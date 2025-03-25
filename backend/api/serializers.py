from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Trip, LogSheet, Stop
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'password']
        read_only_fields = ['id']

    def validate(self, attrs):
        if attrs.get('password'):
            validate_password(attrs.get('password'))
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            email=validated_data['email'],
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = ['id', 'location', 'sequence', 'arrival_time', 'departure_time', 'status', 'stop_type', 'duration_minutes', 'cycle_hours_at_stop', 'distance_from_last_stop']

class LogSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogSheet
        fields = ['id', 'start_time', 'end_time', 'start_location', 'end_location', 
                 'start_cycle_hours', 'end_cycle_hours', 'status']

class TripSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    stops = StopSerializer(many=True, read_only=True)
    log_sheets = LogSheetSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = ['id', 'created_by', 'current_location', 'pickup_location', 'dropoff_location', 
                 'current_cycle_hours', 'status', 'route', 'created_at', 'updated_at', 'stops', 'log_sheets']
        read_only_fields = ['created_by']

class TripCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = ['id', 'current_location', 'pickup_location', 'dropoff_location', 'current_cycle_hours']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True) 