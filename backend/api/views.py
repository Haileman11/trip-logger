from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Trip, LogSheet, Stop
from .serializers import TripSerializer, TripCreateSerializer, LogSheetSerializer, StopSerializer, UserSerializer, LoginSerializer
import requests
import json
from datetime import datetime, timedelta

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': serializer.data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return TripCreateSerializer
        return TripSerializer

    def create(self, request, *args, **kwargs):
        try:
            # Create the trip first
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            trip = serializer.save()

            # Get route from OSRM
            start_coords = f"{trip.current_location['longitude']},{trip.current_location['latitude']}"
            pickup_coords = f"{trip.pickup_location['longitude']},{trip.pickup_location['latitude']}"
            dropoff_coords = f"{trip.dropoff_location['longitude']},{trip.dropoff_location['latitude']}"
            
            # Build route URL with optional fuel stop
            route_coords = [start_coords, pickup_coords, dropoff_coords]
            
            # Check for fuel stop in request data
            fuel_stop = request.data.get('fuel_stop')
            if fuel_stop and isinstance(fuel_stop, dict):
                fuel_stop_coords = f"{fuel_stop['longitude']},{fuel_stop['latitude']}"
                # Insert fuel stop after start location
                route_coords.insert(1, fuel_stop_coords)
                print(f"Added fuel stop coordinates: {fuel_stop_coords}")
            
            route_url = f"http://router.project-osrm.org/route/v1/driving/{';'.join(route_coords)}"
            params = {
                'overview': 'full',
                'geometries': 'geojson',
                'steps': 'true'
            }
            
            print(f"Requesting route from OSRM: {route_url}")
            print(f"With params: {params}")
            
            response = requests.get(route_url, params=params)
            print(f"OSRM response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"OSRM error response: {response.text}")
                return Response(
                    {'error': f'OSRM API error: {response.text}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            route_data = response.json()
            
            if not route_data.get('routes'):
                print("No routes found in OSRM response")
                return Response(
                    {'error': 'No route found'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save route data to trip
            trip.route = route_data
            trip.save()

            # Create stops along the route
            route = route_data['routes'][0]
            legs = route['legs']
            
            print(f"Creating stops with {len(legs)} legs")
            
            # Initialize variables for HOS tracking
            current_cycle_hours = trip.current_cycle_hours
            total_distance = 0
            last_stop_location = trip.current_location
            current_time = datetime.now()
            
            # Create stops based on legs
            for i, leg in enumerate(legs):
                # Determine stop type based on sequence and fuel stop presence
                if i == 0:
                    stop_type = 'pickup'
                elif fuel_stop and i == 1:
                    stop_type = 'fuel'
                else:
                    stop_type = 'dropoff'
                
                # Create the stop
                stop = Stop.objects.create(
                    trip=trip,
                    location=last_stop_location,
                    sequence=i + 1,
                    status='pending',
                    stop_type=stop_type,
                    arrival_time=current_time + timedelta(seconds=leg['duration']),
                    duration_minutes=60 if stop_type in ['pickup', 'dropoff'] else 30 if stop_type == 'fuel' else 0,
                    cycle_hours_at_stop=current_cycle_hours + (leg['duration'] / 3600),
                    distance_from_last_stop=leg['distance'] / 1609.34
                )
                print(f"Created {stop_type} stop: {stop.id}")
                
                # Update tracking variables
                current_cycle_hours += (leg['duration'] / 3600) + (stop.duration_minutes / 60)
                total_distance += leg['distance'] / 1609.34
                last_stop_location = stop.location
                current_time += timedelta(seconds=leg['duration'] + (stop.duration_minutes * 60))
            
            # Add rest stops based on HOS compliance
            MAX_DRIVING_HOURS = 11  # Maximum driving hours per day
            REQUIRED_REST_HOURS = 10  # Required rest hours per day
            MAX_CYCLE_HOURS = 70  # Maximum hours in cycle
            
            # Add rest stops if needed
            if current_cycle_hours >= MAX_DRIVING_HOURS:
                rest_stop = Stop.objects.create(
                    trip=trip,
                    location=last_stop_location,
                    sequence=len(legs) + 1,
                    status='pending',
                    stop_type='rest',
                    arrival_time=current_time,
                    duration_minutes=REQUIRED_REST_HOURS * 60,
                    cycle_hours_at_stop=current_cycle_hours
                )
                print(f"Created rest stop: {rest_stop.id}")
                
                # Update tracking variables
                current_cycle_hours += REQUIRED_REST_HOURS
                current_time += timedelta(hours=REQUIRED_REST_HOURS)

            # Update trip status
            trip.status = 'planned'
            trip.save()
            print(f"Updated trip status to: {trip.status}")

            response_data = {
                'trip': self.get_serializer(trip).data,
                'route': route_data,
                'stops': StopSerializer(trip.stops.all(), many=True).data
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Error in create: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Failed to create trip: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def plan_route(self, request, pk=None):
        try:
            trip = self.get_object()
            print(f"Planning route for trip: {trip.id}")
            
            # If route already exists, return it
            if trip.route:
                response_data = {
                    'trip': self.get_serializer(trip).data,
                    'route': trip.route,
                    'stops': StopSerializer(trip.stops.all(), many=True).data
                }
                return Response(response_data)

            # Get route from OSRM
            start_coords = f"{trip.current_location['longitude']},{trip.current_location['latitude']}"
            pickup_coords = f"{trip.pickup_location['longitude']},{trip.pickup_location['latitude']}"
            dropoff_coords = f"{trip.dropoff_location['longitude']},{trip.dropoff_location['latitude']}"
            
            # Build route URL with optional fuel stop
            route_coords = [start_coords, pickup_coords, dropoff_coords]
            
            # Check for fuel stop in request data
            fuel_stop = request.data.get('fuelStop')
            if fuel_stop and isinstance(fuel_stop, dict):
                fuel_stop_coords = f"{fuel_stop['longitude']},{fuel_stop['latitude']}"
                # Insert fuel stop after start location
                route_coords.insert(1, fuel_stop_coords)
                print(f"Added fuel stop coordinates: {fuel_stop_coords}")
            
            route_url = f"http://router.project-osrm.org/route/v1/driving/{';'.join(route_coords)}"
            params = {
                'overview': 'full',
                'geometries': 'geojson',
                'steps': 'true'
            }
            
            print(f"Requesting route from OSRM: {route_url}")
            print(f"With params: {params}")
            
            response = requests.get(route_url, params=params)
            print(f"OSRM response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"OSRM error response: {response.text}")
                return Response(
                    {'error': f'OSRM API error: {response.text}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            route_data = response.json()
            
            if not route_data.get('routes'):
                print("No routes found in OSRM response")
                return Response(
                    {'error': 'No route found'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save route data to trip
            trip.route = route_data
            trip.save()

            # Create stops along the route
            route = route_data['routes'][0]
            legs = route['legs']
            
            print(f"Creating stops with {len(legs)} legs")
            
            # Initialize variables for HOS tracking
            current_cycle_hours = trip.current_cycle_hours
            total_distance = 0
            last_stop_location = trip.current_location
            current_time = datetime.now()
            
            # Create stops based on legs
            for i, leg in enumerate(legs):
                # Determine stop type based on sequence and fuel stop presence
                if i == 0:
                    stop_type = 'pickup'
                elif fuel_stop and i == 1:
                    stop_type = 'fuel'
                else:
                    stop_type = 'dropoff'
                
                # Create the stop
                stop = Stop.objects.create(
                    trip=trip,
                    location=last_stop_location,
                    sequence=i + 1,
                    status='pending',
                    stop_type=stop_type,
                    arrival_time=current_time + timedelta(seconds=leg['duration']),
                    duration_minutes=60 if stop_type in ['pickup', 'dropoff'] else 30 if stop_type == 'fuel' else 0,
                    cycle_hours_at_stop=current_cycle_hours + (leg['duration'] / 3600),
                    distance_from_last_stop=leg['distance'] / 1609.34
                )
                print(f"Created {stop_type} stop: {stop.id}")
                
                # Update tracking variables
                current_cycle_hours += (leg['duration'] / 3600) + (stop.duration_minutes / 60)
                total_distance += leg['distance'] / 1609.34
                last_stop_location = stop.location
                current_time += timedelta(seconds=leg['duration'] + (stop.duration_minutes * 60))
            
            # Add rest stops based on HOS compliance
            MAX_DRIVING_HOURS = 11  # Maximum driving hours per day
            REQUIRED_REST_HOURS = 10  # Required rest hours per day
            MAX_CYCLE_HOURS = 70  # Maximum hours in cycle
            
            # Add rest stops if needed
            if current_cycle_hours >= MAX_DRIVING_HOURS:
                rest_stop = Stop.objects.create(
                    trip=trip,
                    location=last_stop_location,
                    sequence=len(legs) + 1,
                    status='pending',
                    stop_type='rest',
                    arrival_time=current_time,
                    duration_minutes=REQUIRED_REST_HOURS * 60,
                    cycle_hours_at_stop=current_cycle_hours
                )
                print(f"Created rest stop: {rest_stop.id}")
                
                # Update tracking variables
                current_cycle_hours += REQUIRED_REST_HOURS
                current_time += timedelta(hours=REQUIRED_REST_HOURS)

            # Update trip status
            trip.status = 'planned'
            trip.save()
            print(f"Updated trip status to: {trip.status}")

            response_data = {
                'trip': self.get_serializer(trip).data,
                'route': route_data,
                'stops': StopSerializer(trip.stops.all(), many=True).data
            }
            return Response(response_data)

        except Exception as e:
            print(f"Error in plan_route: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Failed to plan route: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        try:
            trip = self.get_object()
            print(f"Completing trip: {trip.id}")
            
            # Update trip status
            trip.status = 'completed'
            trip.save()
            
            # Update all remaining stops to completed
            trip.stops.filter(status='pending').update(status='completed')
            
            response_data = {
                'trip': self.get_serializer(trip).data,
                'route': trip.route,
                'stops': StopSerializer(trip.stops.all(), many=True).data
            }
            return Response(response_data)
            
        except Exception as e:
            print(f"Error completing trip: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Failed to complete trip: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LogSheetViewSet(viewsets.ModelViewSet):
    queryset = LogSheet.objects.all()
    serializer_class = LogSheetSerializer

    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        if trip_id:
            return LogSheet.objects.filter(trip_id=trip_id)
        return LogSheet.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        trip = get_object_or_404(Trip, pk=self.kwargs.get('trip_pk'))
        serializer.save(trip=trip)

class StopViewSet(viewsets.ModelViewSet):
    queryset = Stop.objects.all()
    serializer_class = StopSerializer

    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        return Stop.objects.filter(trip_id=trip_id)

    def perform_create(self, serializer):
        trip = get_object_or_404(Trip, pk=self.kwargs.get('trip_pk'))
        serializer.save(trip=trip)
