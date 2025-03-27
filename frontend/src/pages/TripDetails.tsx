import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createTrip,
  fetchTrip,
  fetchTrips,
  planRoute,
  startTrip,
  updateStopStatus,
} from "../store/slices/tripSlice";
import type { RootState, AppDispatch } from "../store";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Popup,
  Polyline,
} from "react-leaflet";
import { FaTruck, FaGasPump, FaBed } from "react-icons/fa";
import { BiTimeFive } from "react-icons/bi";
import { MdLocationOn, MdLocalGasStation } from "react-icons/md";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import type { Location, RouteLeg, Trip, Stop, LogSheet } from "@/types";
import { BoundsUpdater } from "../components/map/BoundsUpdater";
import { LocationMarker } from "../components/map/LocationMarker";
import { leafletIcons } from "@/utils/leaflet-icons";
import { current } from "@reduxjs/toolkit";
import { LocateIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// Add interfaces for type safety
interface TimelineEntry {
  type:
    | "start"
    | "pickup"
    | "dropoff"
    | "fuel"
    | "rest"
    | "waypoint"
    | "location";
  location: string;
  time: string;
  index: number;
}

interface RouteData {
  timeline: TimelineEntry[];
  eldLogs: {
    drivingTime: string;
    onDuty: string;
    restTime: string;
  };
  summary: {
    totalDistance: string;
    estimatedDuration: string;
    fuelStops: number;
    restStops: number;
  };
}

// Update interfaces to include GeoJSON types
interface GeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][];
}

// Remove the polyline decoder as we don't need it anymore
const RoutePolyline = ({ geometry }: { geometry: GeoJSONLineString }) => {
  if (!geometry || !geometry.coordinates || !geometry.coordinates.length)
    return null;

  // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
  const positions = geometry.coordinates.map(
    (coord) => [coord[1], coord[0]] as L.LatLngTuple
  );

  return (
    <Polyline positions={positions} color="#3B82F6" weight={4} opacity={0.8} />
  );
};

const TripDetails = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const dispatch = useAppDispatch();
  const [trip, setTrip] = useState<Trip | null>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dispatch(fetchTrip(tripId!)).unwrap();
        setTrip(response);
        console.log("Trip creation response:", response);
      } catch (error) {
        console.error("Error fetching trip:", error);
      }
    };

    fetchData();
  }, [dispatch, tripId]);

  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [hasFuelStop, setHasFuelStop] = useState(false);
  const [routeData, setRouteData] = useState<RouteData>({
    timeline: [],
    eldLogs: {
      drivingTime: "0:00",
      onDuty: "0:00",
      restTime: "0:00",
    },
    summary: {
      totalDistance: "0 miles",
      estimatedDuration: "0h 0m",
      fuelStops: 0,
      restStops: 0,
    },
  });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  const formatDurationfromMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const minutesValue = Math.floor((minutes % 60) / 60);
    return `${hours}h ${minutesValue}m`;
  };

  const formatDistance = (meters: number): string => {
    const miles = (meters / 1609.34).toFixed(1);
    return `${miles} miles`;
  };

  // Default center for the map
  const defaultCenter: L.LatLngTuple =
    trip != null
      ? [trip?.current_location.latitude, trip?.current_location.longitude]
      : [9.0248826, 38.7807792]; // Default to Addis Ababa coordinates
  function createStopIcon(stopType: string) {
    switch (stopType) {
      case "pickup":
        return <MdLocationOn height={"2em"} width={"2em"} color="green" />;
      case "dropoff":
        return <MdLocationOn height={"2em"} width={"2em"} color="red" />;

      case "fuel":
        return <MdLocationOn height={"2em"} width={"2em"} color="yellow" />;

      case "rest":
        return <MdLocationOn height={"2em"} width={"2em"} color="gray" />;

      default:
        return <MdLocationOn height={"2em"} width={"2em"} color="gray" />;
    }
  }
  function handleStartTrip(event: React.MouseEvent<HTMLButtonElement>): void {
    console.log("Starting trip");

    // First check if there are any active trips
    const checkActiveTrips = async () => {
      try {
        const response = await fetch("/api/trips/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch trips");

        const trips = await response.json();
        const activeTrips = trips.filter(
          (trip: any) => trip.status === "in_progress"
        );

        if (activeTrips.length > 0) {
          // Show warning to user
          if (
            window.confirm(
              "You already have an active trip. Starting this trip will complete the active trip. Do you want to continue?"
            )
          ) {
            // User confirmed, proceed with starting the trip
            dispatch(startTrip(tripId!));
            navigate("/trip/" + tripId + "/live");
          }
        } else {
          // No active trips, proceed normally
          dispatch(startTrip(tripId!));
          navigate("/trip/" + tripId + "/live");
        }
      } catch (error) {
        console.error("Error checking active trips:", error);
        // If there's an error checking active trips, proceed with starting the trip
        dispatch(startTrip(tripId!));
        navigate("/trip/" + tripId + "/live");
      }
    };

    checkActiveTrips();
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Details</h1>
          <p className="text-gray-500 mt-1">View and manage trip information</p>
        </div>
      </div>

      {trip && (
        <>
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Trip Status:{" "}
                  <Badge className="ml-2">{trip?.status.toUpperCase()}</Badge>
                </h2>
                <p className="text-gray-600">
                  From{" "}
                  <span className="font-medium">
                    {trip?.route?.routes?.[0]?.legs[0].summary}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {
                      trip?.route?.routes?.[0]?.legs[
                        trip?.route?.routes?.[0]?.legs.length - 1
                      ].summary
                    }
                  </span>
                </p>
              </div>
              {trip?.status === "planned" && (
                <button
                  onClick={handleStartTrip}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Trip
                </button>
              )}
              {trip?.status === "in_progress" && (
                <Link
                  to={`/trip/${tripId}/live`}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Log Trip
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-[600px]">
                <MapContainer
                  center={defaultCenter}
                  zoom={4}
                  className="h-full w-full"
                  style={{ zIndex: 1 }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <BoundsUpdater
                    locations={[
                      trip.current_location,
                      trip.pickup_location,
                      trip.dropoff_location,
                      trip.fuel_stop!,
                    ]}
                  />
                  {trip.route?.routes?.[0]?.geometry && (
                    <RoutePolyline
                      geometry={
                        trip.route?.routes?.[0]?.geometry as GeoJSONLineString
                      }
                    />
                  )}

                  {/* Current Location Marker */}
                  {trip.current_location.latitude !== 0 &&
                    trip.current_location.longitude !== 0 && (
                      <LocationMarker
                        position={[
                          trip.current_location.latitude,
                          trip.current_location.longitude,
                        ]}
                        icon={leafletIcons.defaultIcon}
                      >
                        <Popup>
                          <div className="p-2">
                            <div className="font-semibold">
                              Current Location
                            </div>
                            <div className="text-sm text-gray-600">Stop #1</div>
                          </div>
                        </Popup>
                      </LocationMarker>
                    )}

                  {/* Stop Markers */}
                  {trip.stops.map((stop: Stop, index: number) => (
                    <LocationMarker
                      key={index}
                      position={[
                        stop.location.latitude,
                        stop.location.longitude,
                      ]}
                      icon={
                        stop.stop_type === "pickup"
                          ? leafletIcons.greenIcon
                          : stop.stop_type === "dropoff"
                          ? leafletIcons.redIcon
                          : stop.stop_type === "fuel"
                          ? leafletIcons.yellowIcon
                          : stop.stop_type === "rest"
                          ? leafletIcons.blueIcon
                          : leafletIcons.defaultIcon
                      }
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-semibold">
                            {stop.stop_type.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {stop.summary}
                          </div>
                          <div className="text-sm text-gray-600">
                            Stop {stop.sequence}
                          </div>
                          <div className="text-sm text-gray-600">
                            {stop.location.latitude}, {stop.location.longitude}
                          </div>
                        </div>
                      </Popup>
                    </LocationMarker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Route Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6 overflow-scroll h-[600px]">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Route Timeline
              </h2>
              <div className="space-y-6">
                {trip.stops.map((stop: Stop, index: number) => {
                  const leg = trip.route?.routes?.[0]?.legs[index];
                  if (!leg) return null;
                  const currentStopIndex = trip.stops.findIndex(
                    (stop) => stop.status !== "completed"
                  );
                  return (
                    <div
                      key={stop.id}
                      className={`flex p-4 rounded-lg border ${
                        index === currentStopIndex
                          ? "border-blue-500 bg-blue-50"
                          : stop.status === "completed"
                          ? "border-green-500 bg-green-50"
                          : stop.status === "skipped"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-50">
                          {createStopIcon(stop.stop_type)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {stop.stop_type.toUpperCase()}
                        </p>
                        <p className="text-gray-600">{leg.summary}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-500">
                            {formatDurationfromMinutes(
                              stop.cycle_hours_at_stop * 60
                            )}{" "}
                            cycle hours
                          </p>
                          <p className="text-sm text-gray-500">
                            Arriving in {formatDuration(leg.duration)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDistance(leg.distance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Sections */}

          {/* ELD Logs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Estimated ELD Logs
            </h2>
            <div className="space-y-6">
              {(() => {
                const drivingTime = trip.route?.routes?.[0]?.duration || 0;
                const onDutyTime =
                  trip.stops
                    .filter(
                      (stop) =>
                        stop.stop_type === "pickup" ||
                        stop.stop_type === "dropoff"
                    )
                    .map((stop) => stop.duration_minutes)
                    .reduce((prev, current) => prev + current, 0) * 60;
                const restTime =
                  trip.stops
                    .filter((stop) => stop.stop_type === "rest")
                    .map((stop) => stop.duration_minutes)
                    .reduce((prev, current) => prev + current, 0) * 60;

                const totalTime = drivingTime + onDutyTime + restTime;
                const drivingPercentage = (drivingTime / totalTime) * 100;
                const onDutyPercentage = (onDutyTime / totalTime) * 100;
                const restPercentage = (restTime / totalTime) * 100;

                return (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Driving Time
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDuration(drivingTime)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${drivingPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          On Duty
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDuration(onDutyTime)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${onDutyPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Rest Time
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDuration(restTime)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${restPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Trip Logs Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Trip Logs
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {trip?.log_sheets?.map((log: LogSheet) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
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
                      <div>
                        → {formatDurationfromMinutes(log.end_cycle_hours! * 60)}
                      </div>
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

          {/* Trip Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Trip Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaTruck className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Total Distance</span>
                </div>
                <span className="font-medium text-gray-900">
                  {formatDistance(trip.route?.routes?.[0]?.distance!)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BiTimeFive className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Est. Duration</span>
                </div>
                <span className="font-medium text-gray-900">
                  {formatDuration(trip.route?.routes?.[0]?.duration!)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaGasPump className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Fuel Stops</span>
                </div>
                <span className="font-medium text-gray-900">
                  {
                    trip.stops.filter((stop) => stop.stop_type === "fuel")
                      .length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaBed className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Rest Stops</span>
                </div>
                <span className="font-medium text-gray-900">
                  {
                    trip.stops.filter((stop) => stop.stop_type === "rest")
                      .length
                  }
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TripDetails;
