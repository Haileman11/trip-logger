import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, LatLngBounds, latLng } from 'leaflet';
import { Trip, Stop, setCurrentTrip } from '../store/slices/tripSlice';
import type { RootState, AppDispatch } from '../store';
import 'leaflet/dist/leaflet.css';

// ... icon definitions ...

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { trips, currentTrip, loading, error } = useSelector((state: RootState) => state.trips);

  useEffect(() => {
    if (id) {
      const trip = trips.find((t: Trip) => t.id === parseInt(id));
      if (trip) {
        dispatch(setCurrentTrip(trip));
      }
    }
  }, [dispatch, id, trips]);

  // ... loading, error, and currentTrip checks ...

  const getBounds = () => {
    if (!currentTrip) return undefined;
    
    const points = [];
    
    if (currentTrip.current_location) {
      points.push(latLng(currentTrip.current_location.latitude, currentTrip.current_location.longitude));
    }
    if (currentTrip.pickup_location) {
      points.push(latLng(currentTrip.pickup_location.latitude, currentTrip.pickup_location.longitude));
    }
    if (currentTrip.dropoff_location) {
      points.push(latLng(currentTrip.dropoff_location.latitude, currentTrip.dropoff_location.longitude));
    }
    
    if (currentTrip.stops) {
      points.push(...currentTrip.stops.map((stop: Stop) => 
        latLng(stop.location.latitude, stop.location.longitude)
      ));
    }
    
    return points.length > 0 ? new LatLngBounds(points) : undefined;
  };

  // ... rest of the component ...
};

export default TripDetails;