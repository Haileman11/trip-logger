import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ErrorBoundary from './ErrorBoundary';
import { leafletIcons } from '../utils/leaflet-icons';
import { Location, Stop, Route } from '../types';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapBoundsUpdaterProps {
  bounds: L.LatLngBounds;
}

interface TripMapProps {
  currentLocation: Location;
  route?: Route;
  stops: Stop[];
  currentStopIndex: number;
  tripStatus: 'not_started' | 'in_progress' | 'completed';
}

const MapBoundsUpdater = ({ bounds }: MapBoundsUpdaterProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
};

const getStopIcon = (stopType: Stop['stop_type']) => {
  switch (stopType) {
    case 'pickup':
      return leafletIcons.greenIcon;
    case 'dropoff':
      return leafletIcons.redIcon;
    case 'rest':
      return leafletIcons.blueIcon;
    case 'fuel':
      return leafletIcons.yellowIcon;
    default:
      return leafletIcons.defaultIcon;
  }
};

const getStopTitle = (stopType: Stop['stop_type']) => {
  switch (stopType) {
    case 'pickup':
      return 'Pickup Location';
    case 'dropoff':
      return 'Dropoff Location';
    case 'rest':
      return 'Rest Stop';
    case 'fuel':
      return 'Fuel Stop';
    default:
      return 'Stop';
  }
};

const TripMap = ({ currentLocation, route, stops, currentStopIndex, tripStatus }: TripMapProps) => {
  const [MapComponent, setMapComponent] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const loadMap = async () => {
      const { MapContainer } = await import('react-leaflet');
      setMapComponent(() => MapContainer);
      setIsMapReady(true);
    };
    loadMap();
  }, []);

  // Log props for debugging
  useEffect(() => {
    console.log('TripMap props:', {
      currentLocation,
      route,
      stops,
      currentStopIndex,
      tripStatus
    });
  }, [currentLocation, route, stops, currentStopIndex, tripStatus]);

  // Validate coordinates
  const isValidCoordinate = (lat: number, lng: number) => {
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  // Default coordinates if invalid
  const defaultLat = 9.0248826;  // Addis Ababa coordinates
  const defaultLng = 38.7807792;

  const safeCurrentLocation = {
    latitude: isValidCoordinate(currentLocation.latitude, currentLocation.longitude) 
      ? currentLocation.latitude 
      : defaultLat,
    longitude: isValidCoordinate(currentLocation.latitude, currentLocation.longitude) 
      ? currentLocation.longitude 
      : defaultLng
  };

  const routeCoordinates = useMemo(() => {
    if (!route?.routes?.[0]?.geometry?.coordinates) {
      console.log('No route coordinates available:', route);
      return [];
    }
    
    const coords = route.routes[0].geometry.coordinates.map((coord) => {
      const [lng, lat] = coord;
      if (!isValidCoordinate(lat, lng)) {
        console.log('Invalid coordinate:', coord);
        return [defaultLat, defaultLng] as L.LatLngTuple;
      }
      return [lat, lng] as L.LatLngTuple;
    });

    console.log('Processed route coordinates:', coords);
    return coords;
  }, [route]);
  
  const bounds = useMemo(() => {
    if (routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      console.log('Route bounds:', bounds);
      return bounds;
    }
    const defaultBounds = L.latLngBounds(
      [safeCurrentLocation.latitude, safeCurrentLocation.longitude] as L.LatLngTuple,
      [safeCurrentLocation.latitude, safeCurrentLocation.longitude] as L.LatLngTuple
    );
    console.log('Default bounds:', defaultBounds);
    return defaultBounds;
  }, [routeCoordinates, safeCurrentLocation]);

  // Default center if no route coordinates
  const defaultCenter: L.LatLngTuple = [safeCurrentLocation.latitude, safeCurrentLocation.longitude];
  const defaultZoom = 13;

  if (!isMapReady || !MapComponent) {
    return (
      <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
        <MapComponent
          center={defaultCenter}
          zoom={defaultZoom}
          className="w-full h-full"
          scrollWheelZoom={false}
        >
          <MapBoundsUpdater bounds={bounds} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Current Location Marker */}
          <Marker position={[safeCurrentLocation.latitude, safeCurrentLocation.longitude] as L.LatLngTuple}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">Current Location</h3>
              </div>
            </Popup>
          </Marker>

          {/* Stop Markers */}
          {Array.isArray(stops) && stops.length > 0 && stops.map((stop) => {
            console.log('Processing stop:', stop);
            const stopLat = stop.location.latitude;
            const stopLng = stop.location.longitude;
            if (!isValidCoordinate(stopLat, stopLng)) {
              console.log('Invalid stop coordinates:', stop.location);
              return null;
            }
            
            console.log('Rendering stop marker:', stop);
            return (
              <Marker
                key={stop.id}
                position={[stopLat, stopLng] as L.LatLngTuple}
                icon={getStopIcon(stop.stop_type)}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">{getStopTitle(stop.stop_type)}</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Arrival: {stop.arrival_time ? new Date(stop.arrival_time).toLocaleString() : 'Not set'}</p>
                      <p>Duration: {stop.duration_minutes || 0} minutes</p>
                      <p>Cycle Hours: {stop.cycle_hours_at_stop ? stop.cycle_hours_at_stop.toFixed(1) : 'Not set'}</p>
                      {stop.distance_from_last_stop > 0 && (
                        <p>Distance from last stop: {stop.distance_from_last_stop.toFixed(1)} miles</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Route Line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ color: '#3887be', weight: 5, opacity: 0.75 }}
            />
          )}
        </MapComponent>
      </div>
    </ErrorBoundary>
  );
};

export default TripMap; 