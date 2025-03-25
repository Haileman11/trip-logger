import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createTrip,
  fetchTrip,
  fetchTrips,
  planRoute,
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

import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import type { Location, Trip } from "@/types";
import { BoundsUpdater } from "../components/map/BoundsUpdater";
import { LocationMarker } from "../components/map/LocationMarker";
import { leafletIcons } from "@/utils/leaflet-icons";
import { current } from "@reduxjs/toolkit";
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

interface Stop {
  id: number;
  type?: "fuel" | "rest";
  location: {
    latitude: number;
    longitude: number;
  };
  sequence: number;
  arrival_time: string;
  departure_time: string | null;
  status: string;
}

const TripPlanner = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const dispatch = useAppDispatch();
  const [trip, setTrip] = useState<Trip | null>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const formatDistance = (meters: number): string => {
    const miles = (meters / 1609.34).toFixed(1);
    return `${miles} miles`;
  };

  // Default center for the map
  const defaultCenter: L.LatLngTuple =
    trip != null
      ? [trip?.current_location.latitude, trip?.current_location.longitude]
      : [9.0248826, 38.7807792]; // Default to Addis Ababa coordinates

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trip Status</h1>
      </div>

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
                {routeGeometry && <RoutePolyline geometry={routeGeometry} />}

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

                {/* Pickup Location Marker */}
                {trip.pickup_location.latitude !== 0 && (
                  <LocationMarker
                    position={[
                      trip.pickup_location.latitude,
                      trip.pickup_location.longitude,
                    ]}
                    icon={leafletIcons.greenIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="font-semibold">Pickup Location</div>
                        <div className="text-sm text-gray-600">Stop #2</div>
                      </div>
                    </Popup>
                  </LocationMarker>
                )}

                {/* Dropoff Location Marker */}
                {trip.dropoff_location.latitude !== 0 && (
                  <LocationMarker
                    position={[
                      trip.dropoff_location.latitude,
                      trip.dropoff_location.longitude,
                    ]}
                    icon={leafletIcons.redIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="font-semibold">Dropoff Location</div>
                        <div className="text-sm text-gray-600">
                          Stop #{trip.fuel_stop ? "4" : "3"}
                        </div>
                      </div>
                    </Popup>
                  </LocationMarker>
                )}

                {/* Fuel Stop Marker */}
                {hasFuelStop && trip.fuel_stop && (
                  <LocationMarker
                    position={[
                      trip.fuel_stop.latitude,
                      trip.fuel_stop.longitude,
                    ]}
                    icon={leafletIcons.yellowIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="font-semibold">Fuel Stop</div>
                        <div className="text-sm text-gray-600">Stop #3</div>
                      </div>
                    </Popup>
                  </LocationMarker>
                )}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Route Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Route Timeline</h2>
            <div className="space-y-6">
              {trip.route?.routes?.map((stop: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {/* Stop Index Badge */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                      {stop.index + 1}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{stop.location}</p>
                    <p className="text-sm text-gray-500">{stop.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ELD Logs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">ELD Logs</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Driving Time</span>
                  <span className="text-sm font-medium">
                    {routeData.eldLogs.drivingTime}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "70%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">On Duty</span>
                  <span className="text-sm font-medium">
                    {routeData.eldLogs.onDuty}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: "30%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Rest Time</span>
                  <span className="text-sm font-medium">
                    {routeData.eldLogs.restTime}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "50%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Trip Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaTruck className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Total Distance</span>
                </div>
                <span className="font-medium">
                  {formatDistance(
                    trip.route?.routes
                      ?.map((route) => route.distance)
                      .reduce((prev, current) => prev + current)!
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BiTimeFive className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Est. Duration</span>
                </div>
                <span className="font-medium">
                  {formatDuration(
                    trip.route?.routes
                      ?.map((route) => route.duration)
                      .reduce((prev, current) => prev + current)!
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaGasPump className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Fuel Stops</span>
                </div>
                <span className="font-medium">
                  {
                    trip.stops?.map((stop) => (stop.stop_type = "fuel"))
                      .length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaBed className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Rest Stops</span>
                </div>
                <span className="font-medium">
                  {
                    trip.stops?.map((stop) => (stop.stop_type = "rest"))
                      .length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
