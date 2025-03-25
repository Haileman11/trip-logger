import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTrip, planRoute } from "../store/slices/tripSlice";
import type { RootState, AppDispatch } from "../store";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import { FaTruck, FaGasPump, FaBed, FaCheck, FaTimes } from "react-icons/fa";
import { BiTimeFive } from "react-icons/bi";
import { MdLocationOn, MdLocalGasStation } from "react-icons/md";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { DialogDescription } from "@radix-ui/react-dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { DialogTrigger } from "@/components/ui/dialog";
import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import type { Location } from "@/types";

import { leafletIcons  } from "../utils/leaflet-icons";

const LocationMarker = React.forwardRef<
  L.Marker,
  {
    position: L.LatLngTuple;
    icon: L.Icon;
    onRemove?: () => void;
    children?: React.ReactNode;
  }
>(({ position, icon, onRemove, children }, ref) => {
  return (
    <Marker position={position} icon={icon} ref={ref}>
      {children ||
        (onRemove && (
          <Popup>
            <button
              onClick={onRemove}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove Location
            </button>
          </Popup>
        ))}
    </Marker>
  );
});

LocationMarker.displayName = "LocationMarker";

const MapClickHandler = ({
  onLocationSelect,
}: {
  onLocationSelect: (location: { latitude: number; longitude: number }) => void;
}) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });
  return null;
};

// Add BoundsUpdater component
const BoundsUpdater = ({
  currentLocation,
  pickupLocation,
  dropoffLocation,
}: {
  currentLocation: { latitude: number; longitude: number };
  pickupLocation: { latitude: number; longitude: number };
  dropoffLocation: { latitude: number; longitude: number };
}) => {
  const map = useMap();

  useEffect(() => {
    if (currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
      // Create bounds with current location
      const bounds = new L.LatLngBounds(
        [currentLocation.latitude, currentLocation.longitude],
        [currentLocation.latitude, currentLocation.longitude]
      );

      // Extend bounds with pickup and dropoff locations if they exist
      if (pickupLocation.latitude !== 0 && pickupLocation.longitude !== 0) {
        bounds.extend([pickupLocation.latitude, pickupLocation.longitude]);
      }
      if (dropoffLocation.latitude !== 0 && dropoffLocation.longitude !== 0) {
        bounds.extend([dropoffLocation.latitude, dropoffLocation.longitude]);
      }

      // If we only have current location, center and zoom
      if (pickupLocation.latitude === 0 && dropoffLocation.latitude === 0) {
        map.setView([currentLocation.latitude, currentLocation.longitude], 13);
      } else {
        // If we have multiple points, fit bounds with padding
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, currentLocation, pickupLocation, dropoffLocation]);

  return null;
};

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

interface GeoJSONGeometry {
  geometry: GeoJSONLineString;
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

interface Trip {
  id: number;
  current_location: {
    latitude: number;
    longitude: number;
  };
  pickup_location: {
    latitude: number;
    longitude: number;
  };
  dropoff_location: {
    latitude: number;
    longitude: number;
  };
  current_cycle_hours: number;
  status: string;
  stops: Stop[];
  required_rest_time: number;
  rest_stops: number;
}

const TripPlanner = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { greenIcon, redIcon, defaultIcon, yellowIcon } = leafletIcons;
  // Form state
  const [formState, setFormState] = useState({
    currentLocation: { latitude: 0, longitude: 0 },
    pickupLocation: { latitude: 0, longitude: 0 },
    dropoffLocation: { latitude: 0, longitude: 0 },
    fuelStop: undefined as Location | undefined,
    currentCycleHours: 0,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [hasFuelStop, setHasFuelStop] = useState(false);
  const [isFuelStopRequired, setIsFuelStopRequired] = useState(false);
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [isSelectingFuelStop, setIsSelectingFuelStop] = useState(false);
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

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormState((prev) => ({
            ...prev,
            currentLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
        },
        (error) => {
          setError(
            "Unable to get your location. Please enable location services."
          );
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
  }) => {
    if (isSelectingFuelStop) {
      setFormState((prev) => ({
        ...prev,
        fuelStop: location,
      }));
      setHasFuelStop(true);
      setIsSelectingFuelStop(false);
      return;
    }

    if (formState.pickupLocation.latitude === 0) {
      setFormState((prev) => ({
        ...prev,
        pickupLocation: location,
      }));
    } else if (formState.dropoffLocation.latitude === 0) {
      setFormState((prev) => ({
        ...prev,
        dropoffLocation: location,
      }));
    }
  };

  const handleRemovePickup = () => {
    setFormState((prev) => ({
      ...prev,
      pickupLocation: { latitude: 0, longitude: 0 },
    }));
  };

  const handleRemoveDropoff = () => {
    setFormState((prev) => ({
      ...prev,
      dropoffLocation: { latitude: 0, longitude: 0 },
    }));
  };

  const handleAddFuelStop = () => {
    setIsSelectingFuelStop(true);
  };

  const handleRemoveFuelStop = () => {
    setFormState((prev) => ({
      ...prev,
      fuelStop: undefined,
    }));
    setHasFuelStop(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tripPayload = {
        current_location: formState.currentLocation,
        pickup_location: formState.pickupLocation,
        dropoff_location: formState.dropoffLocation,
        fuel_stop: formState.fuelStop,
        current_cycle_hours: formState.currentCycleHours,
      };

      console.log("Creating trip with data:", tripPayload);
      const response = await dispatch(createTrip(tripPayload)).unwrap();
      console.log("Trip creation response:", response);

      // The response already includes trip, route, and stops
      if (!response.trip || !response.route) {
        throw new Error("Invalid response format from server");
      }

      setRouteGeometry(response.route.geometry);

      // Navigate to trips list on success
      navigate(`/trip/${response.trip.id}`);
    } catch (err) {
      console.error("Error creating trip:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create trip";

      // Check if it's an authentication error
      if (
        errorMessage.includes("authentication") ||
        errorMessage.includes("log in")
      ) {
        setError("Please log in to create a trip");
        navigate("/login");
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Default center for the map
  const defaultCenter: L.LatLngTuple =
    formState.currentLocation.latitude !== 0 &&
    formState.currentLocation.longitude !== 0
      ? [
          formState.currentLocation.latitude,
          formState.currentLocation.longitude,
        ]
      : [9.0248826, 38.7807792]; // Default to Addis Ababa coordinates

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plan New Trip</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

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
                currentLocation={formState.currentLocation}
                pickupLocation={formState.pickupLocation}
                dropoffLocation={formState.dropoffLocation}
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />

              {/* Update RoutePolyline rendering */}
              {routeGeometry && <RoutePolyline geometry={routeGeometry} />}

              {/* Current Location Marker */}
              {formState.currentLocation.latitude !== 0 &&
                formState.currentLocation.longitude !== 0 && (
                  <LocationMarker
                    position={[
                      formState.currentLocation.latitude,
                      formState.currentLocation.longitude,
                    ]}
                    icon={defaultIcon}
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
              {formState.pickupLocation.latitude !== 0 && (
                <LocationMarker
                  position={[
                    formState.pickupLocation.latitude,
                    formState.pickupLocation.longitude,
                  ]}
                  icon={greenIcon}
                  onRemove={handleRemovePickup}
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
              {formState.dropoffLocation.latitude !== 0 && (
                <LocationMarker
                  position={[
                    formState.dropoffLocation.latitude,
                    formState.dropoffLocation.longitude,
                  ]}
                  icon={redIcon}
                  onRemove={handleRemoveDropoff}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="font-semibold">Dropoff Location</div>
                      <div className="text-sm text-gray-600">
                        Stop #{formState.fuelStop ? "4" : "3"}
                      </div>
                    </div>
                  </Popup>
                </LocationMarker>
              )}

              {/* Fuel Stop Marker */}
              {hasFuelStop && formState.fuelStop && (
                <LocationMarker
                  position={[
                    formState.fuelStop.latitude,
                    formState.fuelStop.longitude,
                  ]}
                  icon={
                    new L.Icon({
                      iconUrl:
                        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
                      shadowUrl:
                        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })
                  }
                  onRemove={handleRemoveFuelStop}
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
          <p className="p-4 text-sm text-gray-500">
            {isSelectingFuelStop
              ? "Click on the map to add a fuel stop location"
              : "Click on the map to set pickup (green) and dropoff (red) locations. Click on a marker to remove it."}
          </p>
        </div>
      </div>
      {/* Left Column - Form */}
      {!(tripData && routeData) && (
        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="space-y-4 grid grid-cols-3 gap-4">
              <div className="flex flex-shrink-0 gap-4">
                <div className="w-auto h-full  rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MdLocationOn className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Location
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-4">
                    <div>
                      {/* <span className="text-sm text-gray-500">Latitude</span> */}
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        value={formState.currentLocation.latitude || ""}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            currentLocation: {
                              ...formState.currentLocation,
                              latitude: parseFloat(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      {/* <span className="text-sm text-gray-500">Longitude</span> */}
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        value={formState.currentLocation.longitude || ""}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            currentLocation: {
                              ...formState.currentLocation,
                              longitude: parseFloat(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-4">
                <div className="w-auto h-full  rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MdLocationOn className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pickup Location
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-4">
                    <div>
                      {/* <span className="text-sm text-gray-500">Latitude</span> */}
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        value={formState.pickupLocation.latitude || ""}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pickupLocation: {
                              ...formState.pickupLocation,
                              latitude: parseFloat(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      {/* <span className="text-sm text-gray-500">Longitude</span> */}
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        value={formState.pickupLocation.longitude || ""}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pickupLocation: {
                              ...formState.pickupLocation,
                              longitude: parseFloat(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-4">
                <div className="w-auto h-full  rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MdLocationOn className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dropoff Location
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-4">
                    <div>
                      {/* <span className="text-sm text-gray-500">Latitude</span> */}
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        value={formState.dropoffLocation.latitude || ""}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            dropoffLocation: {
                              ...formState.dropoffLocation,
                              latitude: parseFloat(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      {/* <span className="text-sm text-gray-500">Longitude</span> */}
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        value={formState.dropoffLocation.longitude || ""}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            dropoffLocation: {
                              ...formState.dropoffLocation,
                              longitude: parseFloat(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Add Fuel Stop Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaGasPump className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Fuel Stop</span>
                </div>
                {!hasFuelStop ? (
                  <button
                    type="button"
                    onClick={handleAddFuelStop}
                    className="flex items-center justify-center px-4 py-2 border border-yellow-500 text-yellow-600 rounded-md hover:bg-yellow-50"
                  >
                    <MdLocalGasStation className="mr-2" />
                    Add Fuel Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRemoveFuelStop}
                    className="flex items-center justify-center px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50"
                  >
                    <FaTimes className="mr-2" />
                    Remove Fuel Stop
                  </button>
                )}
              </div>
              {/* Current Cycle Hours Input */}
              <div className="flex gap-4">
                <label
                  htmlFor="current_cycle_hours"
                  className="block text-sm font-medium text-gray-700 py-3"
                >
                  Current Cycle Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  step="0.1"
                  id="current_cycle_hours"
                  className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  value={formState.currentCycleHours || ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      currentCycleHours: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Hours "
                />
              </div>
              {/* Generate Route Button */}
              <div className="py-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? "Planning..." : "Generate Route Plan"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Sections */}
      {tripData && routeData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Route Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Route Timeline</h2>
            <div className="space-y-6">
              {routeData.timeline.map((stop: any, index: number) => (
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
                  {routeData.summary.totalDistance}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BiTimeFive className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Est. Duration</span>
                </div>
                <span className="font-medium">
                  {routeData.summary.estimatedDuration}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaGasPump className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Fuel Stops</span>
                </div>
                <span className="font-medium">
                  {routeData.summary.fuelStops}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaBed className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Rest Stops</span>
                </div>
                <span className="font-medium">
                  {routeData.summary.restStops}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Success!</DialogTitle>
            <DialogDescription>
              Your trip has been created and the route has been planned
              successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2 text-green-600">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">Trip Created Successfully</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>You can now view and manage your trip in the trips list.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSuccessOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripPlanner;
