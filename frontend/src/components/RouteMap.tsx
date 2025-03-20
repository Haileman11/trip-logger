import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LatLngBounds, LatLngTuple } from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapProps {
  route: any;
  stops: any[];
  currentLocation: {
    latitude: number;
    longitude: number;
  };
}

// Component to handle map updates
const MapUpdater = ({ bounds }: { bounds: L.LatLngBounds }) => {
  const map = useMap();
  
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);

  return null;
};

// Separate component for map content
const MapContent = ({ route, stops, currentLocation, bounds }: {
  route: any;
  stops: any[];
  currentLocation: { latitude: number; longitude: number };
  bounds: L.LatLngBounds;
}) => {
  const routeCoordinates = route?.routes?.[0]?.geometry?.coordinates?.map((coord: number[]) => [
    coord[1],
    coord[0]
  ] as LatLngTuple) || [];

  return (
    <div>
      <MapUpdater bounds={bounds} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Current Location Marker */}
      <Marker position={[currentLocation.latitude, currentLocation.longitude] as LatLngTuple}>
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">Current Location</h3>
          </div>
        </Popup>
      </Marker>

      {/* Stop Markers */}
      {stops.map((stop, index) => (
        <Marker
          key={stop.id}
          position={[stop.location.latitude, stop.location.longitude] as LatLngTuple}
          icon={new L.Icon({
            iconUrl: index === 0 ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{index === 0 ? 'Pickup' : 'Dropoff'} Stop</h3>
              <p className="text-sm">Arrival: {new Date(stop.arrival_time).toLocaleString()}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Route Line */}
      {routeCoordinates.length > 0 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{ color: '#3887be', weight: 5, opacity: 0.75 }}
        />
      )}
    </div>
  );
};

const RouteMap = ({ route, stops, currentLocation }: RouteMapProps) => {
  console.log('RouteMap props:', { route, stops, currentLocation });
  
  const routeCoordinates = route?.routes?.[0]?.geometry?.coordinates?.map((coord: number[]) => [
    coord[1],
    coord[0]
  ] as LatLngTuple) || [];
  
  console.log('Route coordinates:', routeCoordinates);
  
  const bounds = routeCoordinates.length > 0
    ? L.latLngBounds(routeCoordinates)
    : L.latLngBounds(
        [currentLocation.latitude, currentLocation.longitude] as LatLngTuple,
        [currentLocation.latitude, currentLocation.longitude] as LatLngTuple
      );
  
  console.log('Map bounds:', bounds);

  // Default center if no route coordinates
  const defaultCenter: LatLngTuple = [currentLocation.latitude, currentLocation.longitude];
  const defaultZoom = 13;

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        scrollWheelZoom={false}
      >
        <MapContent
          route={route}
          stops={stops}
          currentLocation={currentLocation}
          bounds={bounds}
        />
      </MapContainer>
    </div>
  );
};

export default RouteMap; 