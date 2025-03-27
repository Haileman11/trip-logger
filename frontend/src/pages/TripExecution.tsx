import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import {
  fetchTrip,
  updateStopStatus,
  completeTrip,
  planRoute,
  createStop,
  deleteStop,
  updateLocation,
  createDutyStatusChange,
} from "../store/slices/tripSlice";
import { RootState, AppDispatch } from "../store";
import TripMap from "../components/TripMap";
import StopStatusUpdate from "../components/StopStatusUpdate";
import DutyStatusControl from "../components/DutyStatusControl";
import { Location, LogSheet, Stop, Trip } from "../types";
import { FaTruck, FaBed, FaTimes } from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";

type DutyStatus = "driving" | "onDuty" | "sleeper" | "offDuty";
type TripStatus = "not_started" | "in_progress" | "completed";

interface StatusLog {
  status: DutyStatus;
  timestamp: Date;
}

const TripExecution: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [trip, setTrip] = useState<Trip | undefined>(undefined);
  const { loading, error } = useSelector((state: RootState) => state.trips);
  const [currentLocation, setCurrentLocation] = useState<Location | undefined>(
    undefined
  );
  const [currentStatus, setCurrentStatus] = useState<DutyStatus>("offDuty");
  const [tripStatus, setTripStatus] = useState<TripStatus>("not_started");
  const [drivingHours, setDrivingHours] = useState(0);
  const [onDutyHours, setOnDutyHours] = useState(0);
  const [cycleHours, setCycleHours] = useState(0);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [isUpdating, setIsUpdating] = useState(false);
  // const [watchId, setWatchId] = useState<number | null>(null);

  // Fetch trip data and plan route
  useEffect(() => {
    const fetchTripData = async () => {
      if (tripId) {
        try {
          // Fetch trip details
          const result = await dispatch(fetchTrip(tripId)).unwrap();

          // Set initial trip status
          setTripStatus(
            result.status === "completed"
              ? "completed"
              : result.status === "in_progress"
              ? "in_progress"
              : "not_started"
          );
          setTrip(result);
          setCurrentStopIndex(
            result.stops.findIndex((stop) => stop.status !== "completed")
          );

          // Set initial duty status and cycle hours from latest log
          const activeLog = result.log_sheets.find(
            (log) => log.status === "active"
          );
          if (activeLog) {
            if (
              activeLog.duty_status_changes &&
              activeLog.duty_status_changes.length > 0
            ) {
              const latestStatus =
                activeLog.duty_status_changes[
                  activeLog.duty_status_changes.length - 1
                ];
              setCurrentStatus(latestStatus.status);
            }
            // Set cycle hours from the active log
            setCycleHours(activeLog.start_cycle_hours || 0);
          }

          // Plan route if trip is in planned status and has no route
          if (result.status === "planned" && !result.route) {
            await dispatch(planRoute(parseInt(tripId))).unwrap();
          }
        } catch (error) {
          console.error("Error fetching trip data:", error);
        }
      }
    };

    fetchTripData();
  }, [tripId, dispatch]);

  // Update stop status when duty status changes to driving
  useEffect(() => {
    if (trip && currentStatus === "driving" && trip.stops[currentStopIndex]) {
      const currentStop = trip.stops[currentStopIndex];
      if (currentStop.status === "pending") {
        dispatch(
          updateStopStatus({
            tripId: trip.id.toString(),
            stopId: currentStop.id,
            status: "in_progress",
          })
        ).unwrap();
      }
    }
  }, [currentStatus, currentStopIndex, trip, dispatch]);

  // Update the useEffect that handles location updates
  useEffect(() => {
    if (!trip) return;

    // Handle simulated location updates
    if (tripStatus === "in_progress" && currentStatus === "driving") {
      let currentSegmentIndex = 0;
      let progressInSegment = 0;
      const UPDATE_INTERVAL = 100; // Update every second
      const MOVEMENT_SPEED = 1; // Adjusted speed for smoother movement

      const interval = setInterval(() => {
        if (trip?.route?.routes?.[0]?.geometry?.coordinates) {
          const coordinates = trip.route.routes[0].geometry.coordinates;

          // Get current and next points
          const currentPoint = coordinates[currentSegmentIndex];
          const nextPoint = coordinates[currentSegmentIndex + 1];

          if (Array.isArray(currentPoint) && Array.isArray(nextPoint)) {
            const [currentLng, currentLat] = currentPoint;
            const [nextLng, nextLat] = nextPoint;

            // Calculate movement
            progressInSegment += MOVEMENT_SPEED;

            // Interpolate between current and next point
            const updatedLocation: Location = {
              latitude: currentLat + (nextLat - currentLat) * progressInSegment,
              longitude:
                currentLng + (nextLng - currentLng) * progressInSegment,
            };

            // Update location
            handleLocationUpdate(updatedLocation);

            // Check if we've reached the next point
            if (progressInSegment >= 1) {
              progressInSegment = 0;
              currentSegmentIndex++;

              // If we've reached the end of the route, loop back to start
              if (currentSegmentIndex >= coordinates.length - 1) {
                currentSegmentIndex = 0;
              }
            }

            // Check if within range of current stop
            if (trip.stops?.[currentStopIndex]?.location) {
              const currentStop = trip.stops[currentStopIndex];
              const distance = calculateDistance(
                updatedLocation,
                currentStop.location
              );
              setIsWithinRange(distance <= 0.5); // Within 0.5 miles
            }
          }
        }
      }, UPDATE_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [trip, tripStatus, currentStopIndex, currentStatus]);

  // Update duty hours
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStatus === "driving") {
        setDrivingHours((prev) => prev + 1 / 3600);
        setOnDutyHours((prev) => prev + 1 / 3600);
      } else if (currentStatus === "onDuty") {
        setOnDutyHours((prev) => prev + 1 / 3600);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStatus]);

  // Update cycle hours when duty status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStatus === "driving" || currentStatus === "onDuty") {
        setCycleHours((prev) => prev + 1 / 3600); // Increment by 1 second
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStatus]);

  // Update time remaining for stop confirmation
  useEffect(() => {
    if (isWithinRange && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isWithinRange, timeRemaining]);

  const handleStatusChange = async (status: DutyStatus) => {
    setCurrentStatus(status);
    setStatusLogs((prev) => [{ status, timestamp: new Date() }, ...prev]);

    // Save the status change to the backend
    try {
      // Find the active log sheet
      const activeLog = trip?.log_sheets.find((log) => log.status === "active");
      if (!activeLog) {
        console.error("No active log sheet found");
        return;
      }

      // Ensure we have a valid location
      const location = currentLocation || trip?.current_location;
      if (!location) {
        console.error("No valid location found");
        return;
      }

      await dispatch(
        createDutyStatusChange({
          logSheetId: activeLog.id,
          status,
          location,
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to save status change:", error);
    }
  };

  const handleStopConfirmation = async () => {
    if (!trip?.stops || !tripId || isUpdating) return;

    setIsUpdating(true);
    try {
      const currentStop = trip.stops[currentStopIndex];

      // Update stop status
      await dispatch(
        updateStopStatus({
          tripId,
          stopId: currentStop.id,
          status: "completed",
        })
      ).unwrap();

      // Set status to on_duty when confirming arrival
      handleStatusChange("onDuty");

      // Fetch updated trip data
      await dispatch(fetchTrip(tripId)).unwrap();

      if (currentStopIndex < trip.stops.length - 1) {
        setCurrentStopIndex((prev) => prev + 1);
        setTimeRemaining(3600);
      } else {
        // Trip completed
        await dispatch(completeTrip(tripId)).unwrap();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to update stop status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSkipStop = async () => {
    if (!trip?.stops || !tripId || isUpdating) return;

    setIsUpdating(true);
    try {
      const currentStop = trip.stops[currentStopIndex];
      await dispatch(
        updateStopStatus({
          tripId,
          stopId: currentStop.id,
          status: "skipped",
        })
      ).unwrap();

      if (currentStopIndex < trip.stops.length - 1) {
        setCurrentStopIndex((prev) => prev + 1);
        setTimeRemaining(3600);
      } else {
        // Trip completed
        await dispatch(completeTrip(tripId)).unwrap();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to skip stop:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartTrip = () => {
    setTripStatus("in_progress");
    setCurrentStatus("driving");
    setStatusLogs((prev) => [
      { status: "driving", timestamp: new Date() },
      ...prev,
    ]);
  };

  const handleCreateStop = async () => {
    if (!trip?.stops || !tripId || isUpdating) return;

    setIsUpdating(true);
    try {
      // Get the last stop's location as a reference
      const lastStop = trip.stops[trip.stops.length - 1];

      // Create a new rest stop near the last stop
      await dispatch(
        createStop({
          tripId,
          stopData: {
            location: {
              latitude: lastStop.location.latitude + 0.01, // Slightly offset from last stop
              longitude: lastStop.location.longitude + 0.01,
            },
            stop_type: "rest",
            duration_minutes: 30,
            cycle_hours_at_stop: lastStop.cycle_hours_at_stop + 0.5,
            distance_from_last_stop: 1.0, // Approximate 1 mile from last stop
          },
        })
      ).unwrap();

      // Fetch updated trip data
      await dispatch(fetchTrip(tripId)).unwrap();
    } catch (error) {
      console.error("Failed to create stop:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!tripId || isUpdating) return;

    setIsUpdating(true);
    try {
      await dispatch(deleteStop({ tripId, stopId })).unwrap();

      // Fetch updated trip data
      await dispatch(fetchTrip(tripId)).unwrap();

      // If we deleted the current stop, move to the next one
      if (trip?.stops[currentStopIndex]?.id.toString() === stopId) {
        setCurrentStopIndex((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete stop:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLocationUpdate = async (location: Location) => {
    if (!trip) return;

    try {
      // await dispatch(updateLocation({ tripId: trip.id.toString(), location })).unwrap();
      setCurrentLocation(location);
    } catch (error) {
      console.error("Failed to update location:", error);
      // You might want to show an error message to the user here
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    // Haversine formula implementation
    const R = 3959; // Earth's radius in miles
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading trip details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!trip || !trip.stops) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">No trip data available</div>
      </div>
    );
  }

  const currentStop = trip.stops[currentStopIndex];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Trip</h1>
          <p className="text-gray-500 mt-1">
            Track and manage your trip in real-time
          </p>
        </div>
        {tripStatus === "not_started" && (
          <button
            onClick={handleStartTrip}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FaTruck className="w-5 h-5" />
            Start Trip
          </button>
        )}
      </div>

      {/* Status Banner */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Trip Status</p>
            <p className="text-lg font-semibold text-gray-900">
              {tripStatus.toUpperCase()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Current Stop</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentStopIndex + 1} of {trip.stops.length}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Cycle Hours</p>
            <p className="text-lg font-semibold text-gray-900">
              {cycleHours.toFixed(1)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Trip ID</p>
            <p className="text-lg font-semibold text-gray-900">#{trip.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="">
            <TripMap
              currentLocation={currentLocation || trip.current_location}
              route={trip.route}
              stops={trip.stops || []}
              currentStopIndex={currentStopIndex}
              tripStatus={tripStatus}
            />
          </div>
        </div>

        {/* Current Stop Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Current Stop
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  {createStopIcon(currentStop.stop_type)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {getStopTitle(currentStop.stop_type)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Stop {currentStopIndex + 1}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentStop.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : currentStop.status === "skipped"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {currentStop.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Arrival Time</span>
                <span className="font-medium">
                  {new Date(currentStop.arrival_time).toLocaleString()}
                </span>
              </div>
              {currentStop.distance_from_last_stop > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Distance</span>
                  <span className="font-medium">
                    {currentStop.distance_from_last_stop.toFixed(1)} miles
                  </span>
                </div>
              )}
            </div>

            {(
              <StopStatusUpdate
                stop={currentStop}
                isWithinRange={isWithinRange}
                onConfirm={handleStopConfirmation}
                onSkip={handleSkipStop}
                timeRemaining={timeRemaining}
                isUpdating={isUpdating}
              />
            )}
          </div>
          {/* Duty Status Control */}
          {/* <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6"> */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Duty Status
          </h2>
          <DutyStatusControl
            currentStatus={currentStatus}
            onStatusChange={handleStatusChange}
            drivingHours={drivingHours}
            maxDrivingHours={11}
            onDutyHours={onDutyHours}
            maxOnDutyHours={14}
            cycleHours={cycleHours}
            buttonStyles={{
              driving: "bg-green-600 hover:bg-green-700",
              onDuty: "bg-yellow-600 hover:bg-yellow-700",
              sleeper: "bg-blue-600 hover:bg-blue-700",
              offDuty: "bg-gray-600 hover:bg-gray-700",
            }}
            buttonIcons={{
              driving: <FaTruck className="w-5 h-5" />,
              onDuty: <MdLocationOn className="w-5 h-5" />,
              sleeper: <FaBed className="w-5 h-5" />,
              offDuty: <FaTimes className="w-5 h-5" />,
            }}
          />
          {/* </div> */}
        </div>

        {/* Stops List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Stops</h2>
            <button
              onClick={handleCreateStop}
              disabled={isUpdating || tripStatus !== "in_progress"}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaBed className="w-4 h-4" />
              Add Rest Stop
            </button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {trip.stops.map((stop, index) => (
              <div
                key={stop.id}
                className={`p-4 rounded-lg border ${
                  index === currentStopIndex
                    ? "border-blue-500 bg-blue-50"
                    : stop.status === "completed"
                    ? "border-green-500 bg-green-50"
                    : stop.status === "skipped"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {createStopIcon(stop.stop_type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getStopTitle(stop.stop_type)}
                      </h3>
                      <p className="text-sm text-gray-500">Stop {index + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        stop.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : stop.status === "skipped"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {stop.status.toUpperCase()}
                    </span>
                    {stop.stop_type === "rest" &&
                      tripStatus === "in_progress" && (
                        <button
                          onClick={() => handleDeleteStop(stop.id.toString())}
                          disabled={isUpdating}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Status Changes
          </h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {statusLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      log.status === "driving"
                        ? "bg-green-100 text-green-800"
                        : log.status === "onDuty"
                        ? "bg-yellow-100 text-yellow-800"
                        : log.status === "sleeper"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {log.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Trip Logs
          </h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {trip?.log_sheets?.map((log: LogSheet) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      log.status === "active"
                        ? "bg-green-100 text-green-800"
                        : log.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {log.status.toUpperCase()}
                  </span>
                  <div className="text-sm text-gray-600">
                    <div>{new Date(log.start_time).toLocaleString()}</div>
                    {log.end_time && (
                      <div className="text-gray-500">
                        → {new Date(log.end_time).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <div>Cycle Hours: {log.start_cycle_hours}</div>
                  {log.end_cycle_hours && (
                    <div>→ {log.end_cycle_hours.toFixed(1)}</div>
                  )}
                </div>
              </div>
            ))}
            {(!trip?.log_sheets || trip.log_sheets.length === 0) && (
              <div className="text-center text-gray-500 py-4">
                No logs available for this trip
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getStopTitle = (stopType: Stop["stop_type"]) => {
  switch (stopType) {
    case "pickup":
      return "Pickup Location";
    case "dropoff":
      return "Dropoff Location";
    case "rest":
      return "Rest Stop";
    case "fuel":
      return "Fuel Stop";
    default:
      return "Stop";
  }
};

const createStopIcon = (stopType: Stop["stop_type"]) => {
  switch (stopType) {
    case "pickup":
      return <FaTruck className="w-5 h-5" />;
    case "dropoff":
      return <FaBed className="w-5 h-5" />;
    case "rest":
      return <FaBed className="w-5 h-5" />;
    case "fuel":
      return <FaTruck className="w-5 h-5" />;
    default:
      return <FaTruck className="w-5 h-5" />;
  }
};

export default TripExecution;
