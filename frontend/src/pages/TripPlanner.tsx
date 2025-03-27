import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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
import type { Location, LocationInputModel, LogSheet } from "@/types";

import { leafletIcons } from "../utils/leaflet-icons";

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
  locations,
}: {
  locations: { latitude: number; longitude: number }[];
}) => {
  const map = useMap();
  console.log("Locations", locations);
  useEffect(() => {
    if (locations.length > 0) {
      // Create bounds with the first location
      const bounds = new L.LatLngBounds(
        [locations[0].latitude, locations[0].longitude],
        [locations[0].latitude, locations[0].longitude]
      );
      console.log("Bounds", locations);
      // Extend bounds with all locations
      locations.forEach((location) => {
        if (location.latitude !== 0 && location.longitude !== 0) {
          bounds.extend([location.latitude, location.longitude]);
        }
      });

      // Fit bounds with padding
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, locations]);

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

// Add this interface with the other interfaces
interface TripCreationResponse {
  trip: Trip;
  route: {
    geometry: GeoJSONLineString;
  };
}

const TripPlanner = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { greenIcon, redIcon, defaultIcon, yellowIcon } = leafletIcons;

  // Add state for latest cycle hours
  const [latestCycleHours, setLatestCycleHours] = useState<number | null>(null);

  // Add useEffect to fetch latest cycle hours
  useEffect(() => {
    const fetchLatestCycleHours = async () => {
      try {
        const response = await fetch('/api/logs/all/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch logs');
        
        const logs = await response.json() as LogSheet[];
        if (logs && logs.length > 0) {
          // Find the most recent completed log
          const latestCompletedLog = logs
            .filter((log: any) => log.status === 'completed')
            .sort((a: any, b: any) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())[0];
          
          if (latestCompletedLog) {
            const endTime = new Date(latestCompletedLog.end_time!);
            const timeDifference =  new Date().getTime() - endTime.getTime();
            const hoursDifference = timeDifference / (1000 * 60 * 60);
            const cycleHours = latestCompletedLog.end_cycle_hours! > hoursDifference ? latestCompletedLog.end_cycle_hours!-hoursDifference : 0;
            setLatestCycleHours(cycleHours);
          }
        }
      } catch (error) {
        console.error('Error fetching latest cycle hours:', error);
      }
    };

    fetchLatestCycleHours();
  }, []);

  function createStopIcon(stopType: string) {
    switch (stopType) {
      case "pickup":
        return greenIcon;
      case "dropoff":
        return redIcon;

      case "fuel":
        return yellowIcon;

      case "rest":
        return defaultIcon;

      default:
        return defaultIcon;
    }
  }
  // Form state
  const [formState, setFormState] = useState<{
    locations: LocationInputModel[];
    currentCycleHours: number;
  }>({
    locations: [
      {
        id: "1",
        slug: "currentLocation",
        title: "Current Location",
        latitude: 0,
        longitude: 0,
      },
      {
        id: "2",
        slug: "pickupLocation",
        title: "Pickup Location",
        latitude: 0,
        longitude: 0,
      },
      {
        id: "3",
        slug: "dropoffLocation",
        title: "Dropoff Location",
        latitude: 0,
        longitude: 0,
      },
      {
        id: "4",
        slug: "fuelStop",
        title: "Fuel Stop",
        latitude: 0,
        longitude: 0,
      },
    ],
    currentCycleHours: latestCycleHours || 0,
  });

  // Update formState when latestCycleHours changes
  useEffect(() => {
    if (latestCycleHours !== null) {
      setFormState(prev => ({
        ...prev,
        currentCycleHours: latestCycleHours
      }));
    }
  }, [latestCycleHours]);

  const handleOnDragEnd = (result: any) => {
    const { source, destination } = result;

    // If dropped outside the list or if dropped at the same position, do nothing
    if (!destination || source.index === destination.index) {
      return;
    }

    const items = Array.from(formState.locations);
    const [removed] = items.splice(source.index, 1); // Remove item from original index
    items.splice(destination.index, 0, removed);

    setFormState({ ...formState, locations: items });
  };

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [hasFuelStop, setHasFuelStop] = useState(false);
  const [isFuelStopRequired, setIsFuelStopRequired] = useState(false);
  const [activeLocation, setActiveLocation] =
    useState<string>("pickupLocation");

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
  const updateLocation = ({
    id,
    newLatitude,
    newLongitude,
  }: {
    id: string;
    newLatitude: number;
    newLongitude: number;
  }) => {
    setFormState((prevFormState) => ({
      ...prevFormState, // Ensure you keep all other properties unchanged
      locations: prevFormState.locations.map(
        (location) =>
          location.id === id
            ? { ...location, latitude: newLatitude, longitude: newLongitude } // Update only the specific location
            : location // Leave other locations unchanged
      ),
    }));
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Directly get the location with the slug 'currentLocation'
          const currentLocation = formState.locations.find(
            (loc) => loc.slug === "currentLocation"
          );

          if (currentLocation) {
            updateLocation({
              id: currentLocation.id, // Use the id directly
              newLatitude: position.coords.latitude,
              newLongitude: position.coords.longitude,
            });
          }
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
  useEffect(() => {
    console.log("Updated formState:", formState);
  }, [formState]);

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
  }) => {
    setFormState((prev) => {
      const updatedLocations = prev.locations.map((loc) => {
        if (loc.slug === activeLocation && loc.latitude === 0) {
          return {
            ...loc,
            latitude: location.latitude,
            longitude: location.longitude,
          };
        }
        return loc;
      });
      const newActiveLocation = formState.locations.find(
        (location) => location.slug != activeLocation && location.latitude == 0
      );
      newActiveLocation && handleActiveLocationChange(newActiveLocation?.slug);
      return { ...prev, locations: updatedLocations };
    });
  };

  const handleActiveLocationChange = (locationSlug: string) => {
    // Set the active location to the slug of the location being selected
    setActiveLocation(locationSlug);
  };

  const handleLocationChange = (
    index: number,
    field: keyof LocationInputModel,
    value: string
  ) => {
    const newLocations = [...formState.locations];
    // Determine if the field is latitude or longitude (which are numbers) and parse the value accordingly
    if (field === "latitude" || field === "longitude") {
      // Parse the value to a number
      const parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) {
        // Handle invalid input for number fields (optional)
        return;
      }
      newLocations[index][field] = parsedValue;
    } else {
      // For other fields like id, slug, or title, assign the value directly (it's a string)
      newLocations[index][field] = value;
    }
    setFormState({ ...formState, locations: newLocations });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tripPayload = {
        locations: formState.locations.filter(
          (location) => location.latitude != 0
        ),
        current_cycle_hours: formState.currentCycleHours,
      };

      console.log("Creating trip with data:", tripPayload);
      const response = (await dispatch(
        createTrip(tripPayload)
      ).unwrap()) as TripCreationResponse;

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
    formState.locations.find((loc) => loc.slug == "currentLocation")!
      .latitude !== 0 &&
    formState.locations.find((loc) => loc.slug == "currentLocation")!
      .longitude !== 0
      ? [
          formState.locations.find((loc) => loc.slug == "currentLocation")!
            .latitude,
          formState.locations.find((loc) => loc.slug == "currentLocation")!
            .longitude,
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
              <BoundsUpdater locations={formState.locations} />
              <MapClickHandler onLocationSelect={handleLocationSelect} />

              {/* Update RoutePolyline rendering */}
              {routeGeometry && <RoutePolyline geometry={routeGeometry} />}

              {/* Current Location Marker */}

              {formState.locations.map(
                (location, index) =>
                  location.latitude !== 0 &&
                  location.longitude !== 0 && (
                    <LocationMarker
                      key={index}
                      position={[location.latitude, location.longitude]}
                      icon={createStopIcon(location.slug)}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-semibold">{location.title}</div>
                          <div className="text-sm text-gray-600">
                            Stop {index}
                          </div>
                        </div>
                      </Popup>
                    </LocationMarker>
                  )
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
            {/* <div className="space-y-4 grid grid-cols-3 gap-4"> */}
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="locations" direction="vertical">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-4"
                  >
                    {/* Render currentLocation separately */}
                    <LocationInput
                      location={formState.locations[0]}
                      index={0}
                      onChange={handleLocationChange}
                      onSelect={handleActiveLocationChange}
                    />

                    {/* Render other locations inside Droppable */}
                    {formState.locations.slice(1).map((location, index) => (
                      <Draggable
                        key={location.id}
                        draggableId={location.id}
                        index={index + 1}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <LocationInput
                              location={location}
                              index={index + 1}
                              onChange={handleLocationChange}
                              onSelect={handleActiveLocationChange}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

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
          </form>
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
const LocationInput = ({
  location,
  index,
  onChange,
  onSelect,
}: {
  location: LocationInputModel;
  index: number;
  onChange: (
    index: number,
    field: keyof LocationInputModel,
    value: string
  ) => void;
  onSelect: (slug: string) => void;
}) => (
  <div className="flex flex-shrink-0 gap-4 border border-gray-300 p-4 rounded-md">
    <div className="w-auto h-full rounded-full flex items-center justify-center">
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <MdLocationOn className="w-6 h-6 text-green-600" />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {location.title}
      </label>
      <div className="mt-1 flex gap-4">
        <div>
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={location.latitude}
            onChange={(e) => onChange(index, "latitude", e.target.value)}
          />
        </div>
        <div>
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={location.longitude}
            onChange={(e) => onChange(index, "longitude", e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center justify-center px-4 py-2 border border-yellow-500 text-yellow-600 rounded-md hover:bg-yellow-50"
            onClick={() => onSelect(location.slug)}
          >
            Select on Map
          </button>
          <button
            className="flex items-center justify-center px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50"
            onClick={() => {
              onChange(index, "latitude", "0");
              onChange(index, "longitude", "0");
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
);
