from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Trip, LogSheet, Stop
from .serializers import TripSerializer, TripCreateSerializer, LogSheetSerializer, StopSerializer
import requests
import json
from datetime import datetime, timedelta

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return TripCreateSerializer
        return TripSerializer

    @action(detail=True, methods=['post'])
    def plan_route(self, request, pk=None):
        try:
            trip = self.get_object()
            print(f"Planning route for trip: {trip.id}")
            
            # Get route from OSRM
            start_coords = f"{trip.current_location['longitude']},{trip.current_location['latitude']}"
            pickup_coords = f"{trip.pickup_location['longitude']},{trip.pickup_location['latitude']}"
            dropoff_coords = f"{trip.dropoff_location['longitude']},{trip.dropoff_location['latitude']}"
            
            # Get route from current location to pickup
            route_url = f"http://router.project-osrm.org/route/v1/driving/{start_coords};{pickup_coords};{dropoff_coords}"
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

            # Create stops along the route
            route = route_data['routes'][0]
            legs = route['legs']
            
            print(f"Creating stops with {len(legs)} legs")
            
            # Initialize variables for HOS tracking
            current_cycle_hours = trip.current_cycle_hours
            total_distance = 0
            last_stop_location = trip.current_location
            current_time = datetime.now()
            
            # Create pickup stop
            pickup_stop = Stop.objects.create(
                trip=trip,
                location=trip.pickup_location,
                sequence=1,
                status='pending',
                stop_type='pickup',
                arrival_time=current_time + timedelta(seconds=legs[0]['duration']),
                duration_minutes=60,  # 1 hour for pickup
                cycle_hours_at_stop=current_cycle_hours + (legs[0]['duration'] / 3600),
                distance_from_last_stop=legs[0]['distance'] / 1609.34  # Convert meters to miles
            )
            print(f"Created pickup stop: {pickup_stop.id}")
            
            # Update tracking variables
            current_cycle_hours += (legs[0]['duration'] / 3600) + (60 / 60)  # Add driving time and pickup duration
            total_distance += legs[0]['distance'] / 1609.34
            last_stop_location = trip.pickup_location
            current_time += timedelta(seconds=legs[0]['duration'] + 3600)  # Add driving time and pickup duration
            
            # Create dropoff stop
            dropoff_stop = Stop.objects.create(
                trip=trip,
                location=trip.dropoff_location,
                sequence=2,
                status='pending',
                stop_type='dropoff',
                arrival_time=current_time + timedelta(seconds=legs[1]['duration']),
                duration_minutes=60,  # 1 hour for dropoff
                cycle_hours_at_stop=current_cycle_hours + (legs[1]['duration'] / 3600),
                distance_from_last_stop=legs[1]['distance'] / 1609.34
            )
            print(f"Created dropoff stop: {dropoff_stop.id}")
            
            # Update tracking variables
            current_cycle_hours += (legs[1]['duration'] / 3600) + (60 / 60)
            total_distance += legs[1]['distance'] / 1609.34
            last_stop_location = trip.dropoff_location
            current_time += timedelta(seconds=legs[1]['duration'] + 3600)
            
            # Add rest stops based on HOS compliance
            # Property-carrying driver: 70 hours/8 days, no adverse driving conditions
            MAX_DRIVING_HOURS = 11  # Maximum driving hours per day
            REQUIRED_REST_HOURS = 10  # Required rest hours per day
            MAX_CYCLE_HOURS = 70  # Maximum hours in cycle
            
            # Add rest stops if needed
            if current_cycle_hours >= MAX_DRIVING_HOURS:
                rest_stop = Stop.objects.create(
                    trip=trip,
                    location=last_stop_location,  # Use last stop location for rest
                    sequence=3,
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
            
            # Add fueling stops every 1000 miles
            if total_distance >= 1000:
                fuel_stop = Stop.objects.create(
                    trip=trip,
                    location=last_stop_location,  # Use last stop location for fueling
                    sequence=4,
                    status='pending',
                    stop_type='fuel',
                    arrival_time=current_time,
                    duration_minutes=30,  # 30 minutes for fueling
                    cycle_hours_at_stop=current_cycle_hours,
                    distance_from_last_stop=total_distance
                )
                print(f"Created fuel stop: {fuel_stop.id}")
                
                # Update tracking variables
                current_cycle_hours += 0.5  # 30 minutes
                current_time += timedelta(minutes=30)
                total_distance = 0  # Reset distance counter

            # Create initial log sheet
            log_sheet = LogSheet.objects.create(
                trip=trip,
                start_time=datetime.now(),
                start_location=trip.current_location,
                start_cycle_hours=trip.current_cycle_hours,
                status='active'
            )
            print(f"Created log sheet: {log_sheet.id}")

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
