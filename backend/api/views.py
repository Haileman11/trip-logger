from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Trip, LogSheet, Stop, Location
from .serializers import (
    TripSerializer,
    TripCreateSerializer,
    LogSheetSerializer,
    StopSerializer,
    UserSerializer,
    LoginSerializer,
)
import requests
import json
from datetime import datetime, timedelta
import logging
from django.db.models import Q
from rest_framework import serializers

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    logger.info(f"Registration attempt with data: {request.data}")
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            logger.info(f"User registered successfully: {user.email}")
            return Response(
                {
                    "user": serializer.data,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error during user registration: {str(e)}")
            return Response(
                {"error": f"Registration failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    logger.error(f"Registration validation failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user:
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": UserSerializer(user).data,
                }
            )
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        trip_id = self.kwargs.get("trip_pk")
        if trip_id:
            return Trip.objects.filter(trip_id=trip_id).prefetch_related('log_sheets')
        return Trip.objects.all().order_by("-created_at").prefetch_related('log_sheets')

    # def get_queryset(self):
    # return Trip.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return TripCreateSerializer
        return TripSerializer

    def create(self, request, *args, **kwargs):
        try:
            # Validate the input data
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            validated_data = serializer.validated_data

            # Get locations from request data
            locations_data = validated_data['locations']
            current_cycle_hours = validated_data['current_cycle_hours']

            # Create or get locations first
            locations = []
            for location_data in locations_data:
                # Try to find existing location
                location, created = Location.objects.get_or_create(
                    latitude=location_data['latitude'],
                    longitude=location_data['longitude'],
                    defaults={
                        'street_name': location_data.get('street_name', f"Location at {location_data['latitude']}, {location_data['longitude']}")
                    }
                )
                locations.append(location)

            # Create trip with the locations
            trip = Trip.objects.create(
                current_location=locations[0],
                pickup_location=locations[1] if len(locations) > 1 else None,
                dropoff_location=locations[2] if len(locations) > 2 else None,
                fuel_stop=locations[3] if len(locations) > 3 else None,
                current_cycle_hours=current_cycle_hours,
                created_by=request.user
            )

            # Build route coordinates from locations
            route_coords = []
            for location in locations:
                coords = f"{location.longitude},{location.latitude}"
                route_coords.append(coords)

            if not route_coords:
                return Response(
                    {"error": "No valid coordinates found in locations"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get route from OSRM
            route_url = f"http://router.project-osrm.org/route/v1/driving/{';'.join(route_coords)}"
            params = {"overview": "full", "geometries": "geojson", "steps": "true"}

            print(f"Requesting route from OSRM: {route_url}")
            print(f"With params: {params}")

            response = requests.get(route_url, params=params)
            print(f"OSRM response status: {response.status_code}")

            if response.status_code != 200:
                print(f"OSRM error response: {response.text}")
                return Response(
                    {"error": f"OSRM API error: {response.text}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            route_data = response.json()

            if not route_data.get("routes"):
                print("No routes found in OSRM response")
                return Response(
                    {"error": "No route found"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Save route data to trip
            trip.route = route_data
            trip.save()

            # Create stops based on locations
            current_time = datetime.now()
            current_cycle_hours = trip.current_cycle_hours

            # Create stops for each location (except current location)
            for i, (location, location_data) in enumerate(zip(locations[1:], locations_data[1:]), start=1):
                # Determine stop type based on location slug
                slug = location_data.get('slug', '')
                print(f"Processing stop {i}:")
                print(f"Location data: {location_data}")
                print(f"Location: {location}")
                print(f"Slug: {slug}")
                
                if slug == 'pickupLocation':
                    stop_type = 'pickup'
                    duration_minutes = 60
                elif slug == 'dropoffLocation':
                    stop_type = 'dropoff'
                    duration_minutes = 60
                elif slug == 'fuelStop':
                    stop_type = 'fuel'
                    duration_minutes = 30
                else:
                    stop_type = 'waypoint'
                    duration_minutes = 0

                # Create the stop
                stop = Stop.objects.create(
                    trip=trip,
                    location=location,
                    sequence=i,
                    status="pending",
                    stop_type=stop_type,
                    arrival_time=current_time,
                    duration_minutes=duration_minutes,
                    cycle_hours_at_stop=current_cycle_hours,
                )
                print(f"Created {stop_type} stop: {stop.id}")

                # Update tracking variables
                current_cycle_hours += duration_minutes / 60
                current_time += timedelta(minutes=duration_minutes)

            # Add rest stops based on HOS compliance
            MAX_DRIVING_HOURS = 11  # Maximum driving hours per day
            REQUIRED_REST_HOURS = 10  # Required rest hours per day
            MAX_CYCLE_HOURS = 70  # Maximum hours in cycle

            # Add rest stops if needed
            if current_cycle_hours >= MAX_DRIVING_HOURS:
                # Use the last location for rest stop
                last_location = locations[-1]
                rest_stop = Stop.objects.create(
                    trip=trip,
                    location=last_location,
                    sequence=len(locations),
                    status="pending",
                    stop_type="rest",
                    arrival_time=current_time,
                    duration_minutes=REQUIRED_REST_HOURS * 60,
                    cycle_hours_at_stop=current_cycle_hours,
                )
                print(f"Created rest stop: {rest_stop.id}")

                # Update tracking variables
                current_cycle_hours += REQUIRED_REST_HOURS
                current_time += timedelta(hours=REQUIRED_REST_HOURS)

            # Update trip status
            trip.status = "planned"
            trip.save()
            print(f"Updated trip status to: {trip.status}")

            # Use TripSerializer for the response
            response_data = {
                "trip": TripSerializer(trip).data,
                "route": route_data,
                "stops": StopSerializer(trip.stops.all(), many=True).data,
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Error in create: {str(e)}")
            import traceback

            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to create trip: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def plan_route(self, request, pk=None):
        try:
            trip = self.get_object()
            print(f"Planning route for trip: {trip.id}")

            # If route already exists, return it
            if trip.route:
                response_data = {
                    "trip": self.get_serializer(trip).data,
                    "route": trip.route,
                    "stops": StopSerializer(trip.stops.all(), many=True).data,
                }
                return Response(response_data)

            # Get route from OSRM
            start_coords = f"{trip.current_location['longitude']},{trip.current_location['latitude']}"
            pickup_coords = f"{trip.pickup_location['longitude']},{trip.pickup_location['latitude']}"
            dropoff_coords = f"{trip.dropoff_location['longitude']},{trip.dropoff_location['latitude']}"

            # Build route URL with optional fuel stop
            route_coords = [start_coords, pickup_coords, dropoff_coords]

            # Check for fuel stop in request data
            fuel_stop = request.data.get("fuelStop")
            if fuel_stop and isinstance(fuel_stop, dict):
                # Calculate total route distance without fuel stop
                no_fuel_route_url = f"http://router.project-osrm.org/route/v1/driving/{';'.join(route_coords)}"
                no_fuel_response = requests.get(
                    no_fuel_route_url, params={"overview": "false"}
                )
                total_distance = (
                    no_fuel_response.json()["routes"][0]["distance"] / 1609.34
                )  # Convert to miles

                # Assume average fuel consumption of 6 miles per gallon
                # and tank capacity of 100 gallons
                FUEL_EFFICIENCY = 6  # miles per gallon
                TANK_CAPACITY = 100  # gallons
                SAFETY_MARGIN = 0.2  # 20% safety margin

                # Calculate optimal fuel stop distance
                optimal_fuel_distance = (
                    TANK_CAPACITY * FUEL_EFFICIENCY * (1 - SAFETY_MARGIN)
                ) / 2

                # Find the best position for fuel stop
                best_fuel_position = 1  # Default to after start
                min_deviation = float("inf")
                best_fuel_stop = None

                # Try different positions for fuel stop
                for i in range(1, len(route_coords)):
                    test_coords = route_coords.copy()
                    fuel_stop_coords = (
                        f"{fuel_stop['longitude']},{fuel_stop['latitude']}"
                    )
                    test_coords.insert(i, fuel_stop_coords)

                    test_route_url = f"http://router.project-osrm.org/route/v1/driving/{';'.join(test_coords)}"
                    test_response = requests.get(
                        test_route_url, params={"overview": "false"}
                    )

                    if test_response.status_code == 200:
                        route_data = test_response.json()
                        if route_data.get("routes"):
                            # Calculate deviation from optimal distance
                            distance_to_fuel = (
                                sum(
                                    leg["distance"]
                                    for leg in route_data["routes"][0]["legs"][:i]
                                )
                                / 1609.34
                            )
                            deviation = abs(distance_to_fuel - optimal_fuel_distance)

                            if deviation < min_deviation:
                                min_deviation = deviation
                                best_fuel_position = i
                                best_fuel_stop = {
                                    "latitude": fuel_stop["latitude"],
                                    "longitude": fuel_stop["longitude"],
                                }

                # Update trip's fuel stop location with the optimal position
                if best_fuel_stop:
                    trip.fuel_stop = best_fuel_stop
                    trip.save()
                    print(f"Updated fuel stop to optimal position: {best_fuel_stop}")

            # Get final route with optimal fuel stop position
            if fuel_stop and isinstance(fuel_stop, dict):
                fuel_stop_coords = (
                    f"{trip.fuel_stop['longitude']},{trip.fuel_stop['latitude']}"
                )
                route_coords.insert(best_fuel_position, fuel_stop_coords)

            route_url = f"http://router.project-osrm.org/route/v1/driving/{';'.join(route_coords)}"
            params = {"overview": "full", "geometries": "geojson", "steps": "true"}

            print(f"Requesting route from OSRM: {route_url}")
            print(f"With params: {params}")

            response = requests.get(route_url, params=params)
            print(f"OSRM response status: {response.status_code}")

            if response.status_code != 200:
                print(f"OSRM error response: {response.text}")
                return Response(
                    {"error": f"OSRM API error: {response.text}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            route_data = response.json()

            if not route_data.get("routes"):
                print("No routes found in OSRM response")
                return Response(
                    {"error": "No route found"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Save route data to trip
            trip.route = route_data
            trip.save()

            # Create stops along the route
            route = route_data["routes"][0]
            legs = route["legs"]

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
                    stop_type = "pickup"
                    last_stop_location = trip.pickup_location
                elif fuel_stop and i == 1:
                    stop_type = "fuel"
                    print(f"Fuel stop: {fuel_stop}")
                    last_stop_location = fuel_stop
                else:
                    stop_type = "dropoff"
                    last_stop_location = trip.dropoff_location

                # Create the stop
                stop = Stop.objects.create(
                    trip=trip,
                    location=last_stop_location,
                    summary=leg["summary"],
                    sequence=i + 1,
                    status="pending",
                    stop_type=stop_type,
                    arrival_time=current_time + timedelta(seconds=leg["duration"]),
                    duration_minutes=(
                        60
                        if stop_type in ["pickup", "dropoff"]
                        else 30 if stop_type == "fuel" else 0
                    ),
                    cycle_hours_at_stop=current_cycle_hours + (leg["duration"] / 3600),
                    distance_from_last_stop=leg["distance"] / 1609.34,
                )
                print(f"Created {stop_type} stop: {stop.id}")

                # Update tracking variables
                current_cycle_hours += (leg["duration"] / 3600) + (
                    stop.duration_minutes / 60
                )
                total_distance += leg["distance"] / 1609.34
                last_stop_location = stop.location
                current_time += timedelta(
                    seconds=leg["duration"] + (stop.duration_minutes * 60)
                )

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
                    status="pending",
                    stop_type="rest",
                    arrival_time=current_time,
                    duration_minutes=REQUIRED_REST_HOURS * 60,
                    cycle_hours_at_stop=current_cycle_hours,
                )
                print(f"Created rest stop: {rest_stop.id}")

                # Update tracking variables
                current_cycle_hours += REQUIRED_REST_HOURS
                current_time += timedelta(hours=REQUIRED_REST_HOURS)

            # Update trip status
            trip.status = "planned"
            trip.save()
            print(f"Updated trip status to: {trip.status}")

            response_data = {
                "trip": self.get_serializer(trip).data,
                "route": route_data,
                "stops": StopSerializer(trip.stops.all(), many=True).data,
            }
            return Response(response_data)

        except Exception as e:
            print(f"Error in plan_route: {str(e)}")
            import traceback

            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to plan route: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        try:
            trip = self.get_object()
            print(f"Completing trip: {trip.id}")

            # Update trip status
            trip.status = "completed"
            trip.save()

            # Update all remaining stops to completed
            trip.stops.filter(status="pending").update(status="completed")

            response_data = {
                "trip": self.get_serializer(trip).data,
                "route": trip.route,
                "stops": StopSerializer(trip.stops.all(), many=True).data,
            }
            return Response(response_data)

        except Exception as e:
            print(f"Error completing trip: {str(e)}")
            import traceback

            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to complete trip: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def start_trip(self, request, pk=None):
        try:
            trip = self.get_object()
            print(f"Starting trip: {trip.id}")

            # Update trip status
            trip.status = "in_progress"
            trip.save()

            # Update first stop to in_progress
            first_stop = trip.stops.first()
            if first_stop:
                first_stop.status = "in_progress"
                first_stop.save()

                # Create initial driving log
                LogSheet.objects.create(
                    trip=trip,
                    start_time=datetime.now(),
                    start_location=trip.current_location,
                    start_cycle_hours=trip.current_cycle_hours,
                    status="active"
                )

            response_data = {
                "trip": self.get_serializer(trip).data,
                "route": trip.route,
                "stops": StopSerializer(trip.stops.all(), many=True).data,
            }
            return Response(response_data)

        except Exception as e:
            print(f"Error starting trip: {str(e)}")
            import traceback

            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to start trip: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def update_stop_status(self, request, pk=None):
        try:
            trip = self.get_object()
            stop_id = request.data.get("stop_id")
            new_status = request.data.get("status")

            if not stop_id or not new_status:
                return Response(
                    {"error": "stop_id and status are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                stop_id = int(stop_id)
            except (TypeError, ValueError):
                return Response(
                    {"error": "Invalid stop_id format"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            stop = trip.stops.filter(id=stop_id).first()
            if not stop:
                return Response(
                    {"error": "Stop not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Update stop status
            stop.status = new_status
            stop.save()

            # If completing a stop, create a log entry
            if new_status == "completed":
                # Find the active driving log
                active_log = trip.log_sheets.filter(status="active").first()
                if active_log:
                    # Update the active log with end time and location
                    active_log.end_time = datetime.now()
                    active_log.end_location = stop.location
                    active_log.end_cycle_hours = trip.current_cycle_hours
                    active_log.status = "completed"
                    active_log.save()

                    # Create a new driving log for the next segment
                    next_stop = trip.stops.filter(
                        sequence_number__gt=stop.sequence_number
                    ).first()
                    if next_stop:
                        LogSheet.objects.create(
                            trip=trip,
                            start_time=datetime.now(),
                            start_location=stop.location,
                            start_cycle_hours=trip.current_cycle_hours,
                            status="active"
                        )

            # Check if all stops are completed
            all_stops_completed = not trip.stops.filter(
                ~Q(status="completed")
            ).exists()

            if all_stops_completed:
                trip.status = "completed"
                trip.save()

            # Get updated trip data
            response_data = {
                "trip": self.get_serializer(trip).data,
                "route": trip.route,
                "stops": StopSerializer(trip.stops.all(), many=True).data,
            }
            return Response(response_data)

        except Exception as e:
            print(f"Error updating stop status: {str(e)}")
            import traceback

            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to update stop status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def create_stop(self, request, pk=None):
        try:
            trip = self.get_object()
            print(f"Creating stop for trip: {trip.id}")

            # Get the last stop's sequence
            last_stop = trip.stops.order_by("-sequence").first()
            next_sequence = (last_stop.sequence + 1) if last_stop else 1

            # Create new stop
            stop_data = {
                "trip": trip,
                "location": request.data.get("location"),
                "sequence": next_sequence,
                "status": "pending",
                "stop_type": request.data.get("stop_type", "rest"),
                "duration_minutes": request.data.get("duration_minutes", 0),
                "cycle_hours_at_stop": request.data.get("cycle_hours_at_stop"),
                "distance_from_last_stop": request.data.get("distance_from_last_stop"),
                "summary": request.data.get("summary", ""),
            }

            stop = Stop.objects.create(**stop_data)

            response_data = {
                "trip": self.get_serializer(trip).data,
                "route": trip.route,
                "stops": StopSerializer(trip.stops.all(), many=True).data,
            }
            return Response(response_data)

        except Exception as e:
            print(f"Error creating stop: {str(e)}")
            import traceback

            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to create stop: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["delete"])
    def delete_stop(self, request, pk=None):
        try:
            trip = self.get_object()
            stop_id = request.query_params.get("stop_id")

            if not stop_id:
                return Response(
                    {"error": "stop_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            stop = trip.stops.filter(id=stop_id).first()
            if not stop:
                return Response(
                    {"error": "Stop not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Only allow deletion of rest stops
            if stop.stop_type != "rest":
                return Response(
                    {"error": "Only rest stops can be deleted"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            stop.delete()

            # Reorder remaining stops
            for idx, stop in enumerate(trip.stops.order_by("sequence"), 1):
                stop.sequence = idx
                stop.save()

            response_data = {
                "trip": self.get_serializer(trip).data,
                "route": trip.route,
                "stops": StopSerializer(trip.stops.all(), many=True).data,
            }
            return Response(response_data)

        except Exception as e:
            print(f"Error deleting stop: {str(e)}")
            import traceback

            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to delete stop: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def update_location(self, request, pk=None):
        try:
            trip = self.get_object()
            new_location = request.data.get("location")

            if not new_location or not isinstance(new_location, dict):
                return Response(
                    {"error": "Invalid location data"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update trip's current location
            trip.current_location = new_location
            trip.save()

            response_data = {
                "trip": self.get_serializer(trip).data,
                "route": trip.route,
                "stops": StopSerializer(trip.stops.all(), many=True).data,
            }
            return Response(response_data)

        except Exception as e:
            print(f"Error updating location: {str(e)}")
            import traceback

            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to update location: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LogSheetViewSet(viewsets.ModelViewSet):
    queryset = LogSheet.objects.all()
    serializer_class = LogSheetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        trip_id = self.kwargs.get("trip_pk")
        if trip_id == "all":
            # Return all logs for the current user's trips
            return LogSheet.objects.filter(trip__created_by=self.request.user).order_by("-created_at")
        elif trip_id:
            # Return logs for a specific trip, ensuring the user has access
            return LogSheet.objects.filter(trip_id=trip_id, trip__created_by=self.request.user)
        return LogSheet.objects.filter(trip__created_by=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        trip = get_object_or_404(Trip, pk=self.kwargs.get("trip_pk"))
        
        # Validate that we're not creating overlapping logs
        start_time = serializer.validated_data.get('start_time')
        end_time = serializer.validated_data.get('end_time')
        
        if end_time and start_time > end_time:
            raise serializers.ValidationError("Start time cannot be after end time")
            
        # Check for overlapping logs
        overlapping_logs = LogSheet.objects.filter(
            trip=trip,
            start_time__lte=end_time if end_time else datetime.now(),
            end_time__gte=start_time
        ).exists()
        
        if overlapping_logs:
            raise serializers.ValidationError("This log overlaps with an existing log")
            
        serializer.save(trip=trip)

    def perform_update(self, serializer):
        # Validate that we're not creating overlapping logs
        start_time = serializer.validated_data.get('start_time')
        end_time = serializer.validated_data.get('end_time')
        
        if end_time and start_time > end_time:
            raise serializers.ValidationError("Start time cannot be after end time")
            
        # Check for overlapping logs, excluding the current log
        overlapping_logs = LogSheet.objects.filter(
            trip=self.get_object().trip,
            start_time__lte=end_time if end_time else datetime.now(),
            end_time__gte=start_time
        ).exclude(id=self.get_object().id).exists()
        
        if overlapping_logs:
            raise serializers.ValidationError("This log overlaps with an existing log")
            
        serializer.save()


class StopViewSet(viewsets.ModelViewSet):
    queryset = Stop.objects.all()
    serializer_class = StopSerializer

    def get_queryset(self):
        trip_id = self.kwargs.get("trip_pk")
        return Stop.objects.filter(trip_id=trip_id)

    def perform_create(self, serializer):
        trip = get_object_or_404(Trip, pk=self.kwargs.get("trip_pk"))
        serializer.save(trip=trip)
