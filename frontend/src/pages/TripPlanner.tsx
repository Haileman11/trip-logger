import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTrip, planRoute } from '../store/slices/tripSlice';
import type { RootState, AppDispatch } from '../store';
import RouteMap from '../components/RouteMap';

const TripPlanner = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentTrip, loading, error } = useSelector((state: RootState) => state.trips);
  const [formData, setFormData] = useState({
    current_location: { latitude: 9.0248826, longitude: 38.7807792 },
    pickup_location: { latitude: 9.0148826, longitude: 38.7807792 },
    dropoff_location: { latitude: 8.9806034, longitude: 38.7577605 },
    current_cycle_hours: 0,
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            current_location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location services.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate coordinates
      const validateLocation = (loc: { latitude: number; longitude: number }) => {
        return !isNaN(loc.latitude) && !isNaN(loc.longitude) &&
               loc.latitude >= -90 && loc.latitude <= 90 &&
               loc.longitude >= -180 && loc.longitude <= 180;
      };

      if (!validateLocation(formData.current_location) ||
          !validateLocation(formData.pickup_location) ||
          !validateLocation(formData.dropoff_location)) {
        setLocationError('Please enter valid coordinates for all locations');
        return;
      }

      console.log('Creating trip with data:', formData);
      const result = await dispatch(createTrip(formData)).unwrap();
      console.log('Trip created:', result);
      
      if (result.id) {
        console.log('Planning route for trip ID:', result.id);
        try {
          const response = await dispatch(planRoute({
            tripId: result.id
          })).unwrap();
          
          console.log('Route planned successfully:', response);
          
          if (!response.stops || response.stops.length === 0) {
            throw new Error('No stops were generated for the route');
          }
          
          setRouteData(response.route || {});
          setStops(response.stops);
        } catch (planError) {
          console.error('Error planning route:', planError);
          if (planError instanceof Error) {
            setLocationError(planError.message);
          } else {
            setLocationError('Failed to plan route. Please try again.');
          }
        }
      } else {
        setLocationError('Failed to create trip. Please try again.');
      }
    } catch (err) {
      console.error('Failed to create or plan trip:', err);
      if (err instanceof Error) {
        setLocationError(err.message);
      } else {
        setLocationError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Plan Your Trip</h1>
      
      {locationError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {locationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Location</label>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Latitude</span>
              <p className="mt-1">{formData.current_location.latitude}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Longitude</span>
              <p className="mt-1">{formData.current_location.longitude}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.pickup_location.latitude}
              onChange={(e) => setFormData({
                ...formData,
                pickup_location: { ...formData.pickup_location, latitude: parseFloat(e.target.value) }
              })}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.pickup_location.longitude}
              onChange={(e) => setFormData({
                ...formData,
                pickup_location: { ...formData.pickup_location, longitude: parseFloat(e.target.value) }
              })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.dropoff_location.latitude}
              onChange={(e) => setFormData({
                ...formData,
                dropoff_location: { ...formData.dropoff_location, latitude: parseFloat(e.target.value) }
              })}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.dropoff_location.longitude}
              onChange={(e) => setFormData({
                ...formData,
                dropoff_location: { ...formData.dropoff_location, longitude: parseFloat(e.target.value) }
              })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Current Cycle Hours</label>
          <input
            type="number"
            min="0"
            max="70"
            step="0.1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.current_cycle_hours}
            onChange={(e) => setFormData({
              ...formData,
              current_cycle_hours: parseFloat(e.target.value)
            })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Planning...' : 'Plan Trip'}
        </button>

        {error && (
          <div className="text-red-600 text-sm mt-2">
            {error}
          </div>
        )}
      </form>

      {currentTrip && routeData && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Route Map</h2>
            <RouteMap
              route={routeData}
              stops={stops}
              currentLocation={formData.current_location}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Trip Details</h2>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">{currentTrip.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Stops</h3>
                  <p className="mt-1">{stops.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner; 