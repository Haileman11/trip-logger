import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ErrorBoundary from './ErrorBoundary';

import { leafletIcons } from '../utils/leaflet-icons';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  latitude: number;
  longitude: number;
}

interface Stop {
  id: string;
  location: Location;
  arrival_time: string;
}

interface RouteGeometry {
  coordinates: [number, number][];
}

interface Route {
  routes?: Array<{
    geometry?: RouteGeometry;
  }>;
}

interface MapBoundsUpdaterProps {
  bounds: L.LatLngBounds;
}

interface RouteMapProps {
  route: Route;
  stops: Stop[];
  currentLocation: Location;
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

const RouteMap = ({ route, stops, currentLocation }: RouteMapProps) => {
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

  const routeCoordinates = useMemo(() => 
    route?.routes?.[0]?.geometry?.coordinates?.map((coord) => {
      const [lng, lat] = coord;
      return isValidCoordinate(lat, lng) 
        ? [lat, lng] as L.LatLngTuple 
        : [defaultLat, defaultLng] as L.LatLngTuple;
    }) || [], 
    [route]
  );
  
  const bounds = useMemo(() => {
    if (routeCoordinates.length > 0) {
      return L.latLngBounds(routeCoordinates);
    }
    return L.latLngBounds(
      [safeCurrentLocation.latitude, safeCurrentLocation.longitude] as L.LatLngTuple,
      [safeCurrentLocation.latitude, safeCurrentLocation.longitude] as L.LatLngTuple
    );
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
          {stops.map((stop, index) => {
            const stopLat = stop.location.latitude;
            const stopLng = stop.location.longitude;
            if (!isValidCoordinate(stopLat, stopLng)) return null;
            
            return (
              <Marker
                key={stop.id}
                position={[stopLat, stopLng] as L.LatLngTuple}
                icon={index === 0 ? leafletIcons.greenIcon : leafletIcons.redIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">{index === 0 ? 'Pickup' : 'Dropoff'} Stop</h3>
                    <p className="text-sm">Arrival: {new Date(stop.arrival_time).toLocaleString()}</p>
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

export default RouteMap; 