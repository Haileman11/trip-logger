import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, LatLngBounds, latLng } from 'leaflet';
import { setCurrentTrip } from '../store/slices/tripSlice';
import type { RootState, AppDispatch } from '../store';
import 'leaflet/dist/leaflet.css';

// ... icon definitions ...

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { trips, currentTrip, loading, error } = useSelector((state: RootState) => state.trip);

  useEffect(() => {
    if (id) {
      const trip = trips.find(t => t.id === parseInt(id));
      if (trip) {
        dispatch(setCurrentTrip(trip));
      }
    }
  }, [dispatch, id, trips]);

  // ... loading, error, and currentTrip checks ...

  const getBounds = () => {
    if (!currentTrip) return undefined;
    
    const points = [
      latLng(currentTrip.current_location.latitude, currentTrip.current_location.longitude),
      latLng(currentTrip.pickup_location.latitude, currentTrip.pickup_location.longitude),
      latLng(currentTrip.dropoff_location.latitude, currentTrip.dropoff_location.longitude),
      ...(currentTrip.stops?.map(stop => 
        latLng(stop.location.latitude, stop.location.longitude)
      ) || [])
    ];
    
    return new LatLngBounds(points);
  };

  // ... rest of the component ...
};

export default TripDetails;