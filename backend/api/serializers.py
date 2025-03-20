from rest_framework import serializers
from .models import Trip, Stop, LogSheet

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = ['id', 'location', 'sequence', 'arrival_time', 'departure_time', 'status']

class LogSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogSheet
        fields = ['id', 'start_time', 'end_time', 'start_location', 'end_location', 
                 'start_cycle_hours', 'end_cycle_hours', 'status']

class TripSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)
    log_sheets = LogSheetSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = ['id', 'current_location', 'pickup_location', 'dropoff_location', 
                 'current_cycle_hours', 'status', 'stops', 'log_sheets']

class TripCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = ['id', 'current_location', 'pickup_location', 'dropoff_location', 'current_cycle_hours'] 