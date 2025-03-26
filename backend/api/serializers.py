from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Trip, LogSheet, Stop, Location, DutyStatusChange
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'street_name', 'latitude', 'longitude']

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
    location = LocationSerializer(read_only=True)
    
    class Meta:
        model = Stop
        fields = ['id', 'location', 'sequence', 'arrival_time', 'status', 'stop_type', 'duration_minutes', 'cycle_hours_at_stop', 'distance_from_last_stop']

class LogSheetSerializer(serializers.ModelSerializer):
    start_location = LocationSerializer(read_only=True)
    end_location = LocationSerializer(read_only=True)
    duty_status_changes = serializers.SerializerMethodField()
    
    class Meta:
        model = LogSheet
        fields = ['id', 'start_time', 'end_time', 'start_location', 'end_location', 
                 'start_cycle_hours', 'end_cycle_hours', 'status', 'duty_status_changes']

    def get_duty_status_changes(self, obj):
        return DutyStatusChangeSerializer(obj.duty_status_changes.all(), many=True).data

class DutyStatusChangeSerializer(serializers.ModelSerializer):
    location = LocationSerializer()
    
    class Meta:
        model = DutyStatusChange
        fields = ['id', 'time', 'status', 'location', 'label']

class DutyStatusChangeCreateSerializer(serializers.ModelSerializer):
    location = serializers.DictField()
    
    class Meta:
        model = DutyStatusChange
        fields = ['time', 'status', 'location', 'label']

    def create(self, validated_data):
        location_data = validated_data.pop('location')
        
        # Try to find existing location first
        try:
            location = Location.objects.get(
                latitude=location_data['latitude'],
                longitude=location_data['longitude']
            )
        except Location.DoesNotExist:
            # If location doesn't exist, create it
            location = Location.objects.create(
                latitude=location_data['latitude'],
                longitude=location_data['longitude'],
                street_name=location_data.get('street_name', '')
            )
        
        # Create duty status change
        duty_status_change = DutyStatusChange.objects.create(
            location=location,
            **validated_data
        )
        return duty_status_change

class LogSheetCreateSerializer(serializers.ModelSerializer):
    start_location = LocationSerializer()
    end_location = LocationSerializer(required=False)
    
    class Meta:
        model = LogSheet
        fields = ['start_time', 'end_time', 'start_location', 'end_location', 
                 'start_cycle_hours', 'end_cycle_hours', 'status']

    def create(self, validated_data):
        start_location_data = validated_data.pop('start_location')
        end_location_data = validated_data.pop('end_location', None)
        
        # Create or get start location
        start_location, _ = Location.objects.get_or_create(
            latitude=start_location_data['latitude'],
            longitude=start_location_data['longitude'],
            defaults={'street_name': start_location_data.get('street_name', '')}
        )
        
        # Create or get end location if provided
        end_location = None
        if end_location_data:
            end_location, _ = Location.objects.get_or_create(
                latitude=end_location_data['latitude'],
                longitude=end_location_data['longitude'],
                defaults={'street_name': end_location_data.get('street_name', '')}
            )
        
        # Create log sheet with locations
        log_sheet = LogSheet.objects.create(
            start_location=start_location,
            end_location=end_location,
            **validated_data
        )
        return log_sheet

class TripSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    stops = StopSerializer(many=True, read_only=True)
    log_sheets = LogSheetSerializer(many=True, read_only=True)
    current_location = LocationSerializer(read_only=True)
    pickup_location = LocationSerializer(read_only=True)
    dropoff_location = LocationSerializer(read_only=True)
    fuel_stop = LocationSerializer(read_only=True)

    class Meta:
        model = Trip
        fields = ['id', 'created_by', 'current_location', 'pickup_location', 'dropoff_location', 
                 'current_cycle_hours', 'status', 'route', 'created_at', 'updated_at', 'stops', 'log_sheets', 'fuel_stop']
        read_only_fields = ['created_by']

class LocationInputSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    street_name = serializers.CharField(required=False)
    stop_type = serializers.CharField(required=False)
    slug = serializers.CharField(required=False)

class TripCreateSerializer(serializers.ModelSerializer):
    locations = LocationInputSerializer(many=True)
    current_cycle_hours = serializers.FloatField(required=True)

    class Meta:
        model = Trip
        fields = ['locations', 'current_cycle_hours']

    def validate(self, data):
        # Just validate the data structure, don't try to create Location instances
        return data

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True) 