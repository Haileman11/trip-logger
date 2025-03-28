import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

// BoundsUpdater component

export const BoundsUpdater = ({
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