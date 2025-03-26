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
    dispatch(startTrip(tripId!));
    console.log("Trip started");
    console.log(trip);
    navigate("/trip/" + tripId + "/live");
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
      </div>
      {trip && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                Trip Status: <Badge>{trip?.status.toUpperCase()}</Badge>
              </h2>
              <p className="text-sm text-gray-600">
                {/* Trip ID: {trip?.id} | Current Stop: {trip?.stops.findIndex((stop)=>stop.status == "pending")|| trip?.stops.length } of {trip?.stops.length} */}
                From{" "}
                <span className="font-bold">
                  {trip?.route?.routes?.[0]?.legs[0].summary}
                </span>{" "}
                to{" "}
                <span className="font-bold">
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
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Start Trip
              </button>
            )}
            {trip?.status === "in_progress" && (
              <Link
                to={`/trip/${tripId}/live`}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Log Trip
              </Link>
            )}
          </div>
        </div>
      )}
      {trip && (
        <div className="flex md:flex-col gap-8">
          {/* Right Column - Map */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-[400px]">
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
                  currentLocation={trip.current_location}
                  pickupLocation={trip.pickup_location}
                  dropoffLocation={trip.dropoff_location}
                />
                {/* <MapClickHandler onLocationSelect={handleLocationSelect} /> */}

                {/* Update RoutePolyline rendering */}
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
                          <div className="font-semibold">Current Location</div>
                          <div className="text-sm text-gray-600">Stop #1</div>
                        </div>
                      </Popup>
                    </LocationMarker>
                  )}
                {trip.stops.map((stop: Stop, index: number) => (
                  <LocationMarker
                    key={index}
                    position={[stop.location.latitude, stop.location.longitude]}
                    icon={
                      stop.stop_type == "pickup"
                        ? leafletIcons.greenIcon
                        : stop.stop_type == "dropoff"
                        ? leafletIcons.redIcon
                        : stop.stop_type == "fuel"
                        ? leafletIcons.yellowIcon
                        : stop.stop_type == "rest"
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
            {/* <p className="p-4 text-sm text-gray-500">
            {isSelectingFuelStop
              ? 'Click on the map to add a fuel stop location'
              : 'Click on the map to set pickup (green) and dropoff (red) locations. Click on a marker to remove it.'}
          </p> */}
          </div>
        </div>
      )}

      {/* Bottom Sections */}
      {trip && routeData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Route Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Route Timeline</h2>
            <div className="space-y-6">
              {trip.stops.map((stop: Stop, index: number) => {
                // Find the corresponding leg for this stop
                const leg = trip.route?.routes?.[0]?.legs[index];
                if (!leg) return null;

                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center text-sm font-medium text-gray-600">
                        {createStopIcon(stop.stop_type)}
                      </div>
                    </div>
                    <div>
                      <p className="font-sm text-gray-900">
                        {stop.stop_type.toUpperCase()}
                      </p>
                      <p className="font-medium text-gray-900">
                        {leg.summary}
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatDurationfromMinutes(
                          stop.cycle_hours_at_stop * 60
                        )}{" "}
                        cycle hours
                      </p>
                      <p className="font-medium text-gray-900">
                        Arriving in {formatDuration(leg.duration)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDistance(leg.distance)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ELD Logs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Estimated ELD Logs</h2>
            <div className="space-y-4">
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
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">
                          Driving Time
                        </span>
                        <span className="text-sm font-medium">
                          {formatDuration(drivingTime)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${drivingPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">On Duty</span>
                        <span className="text-sm font-medium">
                          {formatDuration(onDutyTime)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${onDutyPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Rest Time</span>
                        <span className="text-sm font-medium">
                          {formatDuration(restTime)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
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
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">Trip Logs</h2>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {trip?.log_sheets?.map((log: LogSheet) => (
            <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  log.status === 'active' ? 'bg-green-100 text-green-800' :
                  log.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {log.status.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  {new Date(log.start_time).toLocaleString()}
                  {log.end_time && ` → ${new Date(log.end_time).toLocaleString()}`}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <span>Cycle Hours: {log.start_cycle_hours}</span>
                {log.end_cycle_hours && ` → ${formatDurationfromMinutes(log.end_cycle_hours!*60)}`}
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
            <h2 className="text-lg font-semibold mb-4">Planned Trip Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaTruck className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Total Distance</span>
                </div>
                <span className="font-medium">
                  {formatDistance(trip.route?.routes?.[0]?.distance!)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BiTimeFive className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Est. Duration</span>
                </div>
                <span className="font-medium">
                  {formatDuration(trip.route?.routes?.[0]?.duration!)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaGasPump className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Fuel Stops</span>
                </div>
                <span className="font-medium">
                  {trip.stops.filter((stop) => stop.stop_type == "fuel").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaBed className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Rest Stops</span>
                </div>
                <span className="font-medium">
                  {trip.stops.filter((stop) => stop.stop_type == "rest").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetails;
