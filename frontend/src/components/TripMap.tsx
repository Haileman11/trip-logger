import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TripMapProps {
  currentLocation?: [number, number];
  route?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  nextStop?: {
    location: [number, number];
    name: string;
  };
}

// Fix for default marker icons in React-Leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const TripMap: React.FC<TripMapProps> = ({ currentLocation, route, nextStop }) => {
  const center = currentLocation || [33.7490, -84.3880]; // Default to Atlanta

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full w-full"
      style={{ zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Current Location Marker */}
      {currentLocation && (
        <Marker position={currentLocation} icon={defaultIcon}>
          <Popup>Current Location</Popup>
        </Marker>
      )}

      {/* Next Stop Marker */}
      {nextStop && (
        <Marker 
          position={nextStop.location}
          icon={new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })}
        >
          <Popup>{nextStop.name}</Popup>
        </Marker>
      )}

      {/* Route Polyline */}
      {route && route.coordinates.length > 0 && (
        <Polyline
          positions={route.coordinates.map(coord => [coord[1], coord[0]])}
          color="#3B82F6"
          weight={4}
          opacity={0.8}
        />
      )}
    </MapContainer>
  );
};

export default TripMap; 