from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from core.models import Trip, LogSheet, Stop
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
        trip = self.get_object()
        
        # Calculate route using Mapbox Directions API
        # Note: In production, move this to a background task
        MAPBOX_TOKEN = request.headers.get('X-Mapbox-Token')
        if not MAPBOX_TOKEN:
            return Response(
                {"error": "Mapbox token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get coordinates
        origin = f"{trip.current_location['longitude']},{trip.current_location['latitude']}"
        pickup = f"{trip.pickup_location['longitude']},{trip.pickup_location['latitude']}"
        dropoff = f"{trip.dropoff_location['longitude']},{trip.dropoff_location['latitude']}"

        # Get route from current location to pickup
        pickup_url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{origin};{pickup}?access_token={MAPBOX_TOKEN}"
        pickup_response = requests.get(pickup_url)
        if pickup_response.status_code != 200:
            return Response(
                {"error": "Failed to get route to pickup location"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Get route from pickup to dropoff
        delivery_url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{pickup};{dropoff}?access_token={MAPBOX_TOKEN}"
        delivery_response = requests.get(delivery_url)
        if delivery_response.status_code != 200:
            return Response(
                {"error": "Failed to get route to dropoff location"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Process routes and create stops
        pickup_route = pickup_response.json()
        delivery_route = delivery_response.json()

        # Calculate total distance
        total_distance = (
            pickup_route['routes'][0]['distance'] +
            delivery_route['routes'][0]['distance']
        ) / 1609.34  # Convert meters to miles

        # Calculate number of fuel stops needed
        fuel_stops_needed = int(total_distance / 1000)

        # Create pickup stop
        pickup_duration = timedelta(hours=1)  # 1 hour for pickup
        pickup_arrival = datetime.now() + timedelta(
            seconds=pickup_route['routes'][0]['duration']
        )
        
        Stop.objects.create(
            trip=trip,
            location=trip.pickup_location,
            stop_type='pickup',
            planned_arrival=pickup_arrival,
            planned_departure=pickup_arrival + pickup_duration
        )

        # Create fuel stops
        current_time = pickup_arrival + pickup_duration
        for i in range(fuel_stops_needed):
            # Calculate position along route (simplified)
            progress = (i + 1) / (fuel_stops_needed + 1)
            fuel_stop_location = {
                'latitude': trip.pickup_location['latitude'] + progress * (
                    trip.dropoff_location['latitude'] - trip.pickup_location['latitude']
                ),
                'longitude': trip.pickup_location['longitude'] + progress * (
                    trip.dropoff_location['longitude'] - trip.pickup_location['longitude']
                )
            }
            
            fuel_duration = timedelta(minutes=30)  # 30 minutes for fueling
            Stop.objects.create(
                trip=trip,
                location=fuel_stop_location,
                stop_type='fuel',
                planned_arrival=current_time,
                planned_departure=current_time + fuel_duration
            )
            current_time += fuel_duration

        # Create dropoff stop
        Stop.objects.create(
            trip=trip,
            location=trip.dropoff_location,
            stop_type='dropoff',
            planned_arrival=current_time + timedelta(
                seconds=delivery_route['routes'][0]['duration']
            ),
            planned_departure=current_time + timedelta(
                seconds=delivery_route['routes'][0]['duration']
            ) + timedelta(hours=1)
        )

        # Update trip status
        trip.status = 'planned'
        trip.save()

        return Response(self.get_serializer(trip).data)

class LogSheetViewSet(viewsets.ModelViewSet):
    queryset = LogSheet.objects.all()
    serializer_class = LogSheetSerializer

class StopViewSet(viewsets.ModelViewSet):
    queryset = Stop.objects.all()
    serializer_class = StopSerializer
