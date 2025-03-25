import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Add BoundsUpdater component
export const BoundsUpdater = ({
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
