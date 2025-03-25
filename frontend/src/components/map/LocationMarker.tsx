import L from "leaflet";
import React from "react";
import { Marker, Popup } from "react-leaflet";

export const LocationMarker = React.forwardRef<
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
