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
            print(f"OSRM response: {json.dumps(route_data, indent=2)}")
            
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
            
            # Create pickup stop
            pickup_stop = Stop.objects.create(
                trip=trip,
                location=trip.pickup_location,
                sequence=1,
                status='pending',
                arrival_time=datetime.now() + timedelta(seconds=legs[0]['duration'])
            )
            print(f"Created pickup stop: {pickup_stop.id}")
            
            # Create dropoff stop
            dropoff_stop = Stop.objects.create(
                trip=trip,
                location=trip.dropoff_location,
                sequence=2,
                status='pending',
                arrival_time=datetime.now() + timedelta(seconds=legs[0]['duration'] + legs[1]['duration'])
            )
            print(f"Created dropoff stop: {dropoff_stop.id}")

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
                'stops': StopSerializer([pickup_stop, dropoff_stop], many=True).data
            }
            print(f"Sending response: {json.dumps(response_data, indent=2)}")
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
        return LogSheet.objects.filter(trip_id=trip_id)

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
