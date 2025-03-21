import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTrips } from '../store/slices/tripSlice';
import type { RootState, AppDispatch } from '../store';

const TripList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trips, loading, error } = useSelector((state: RootState) => state.trip);

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Trips</h1>
        <Link to="/new-trip" className="btn btn-primary">
          New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No trips found. Create a new trip to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Trip #{trip.id}</h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span>{' '}
                      <span className="capitalize">{trip.status}</span>
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Current Location:</span>{' '}
                      {trip.current_location.latitude.toFixed(4)}, {trip.current_location.longitude.toFixed(4)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Cycle Hours:</span>{' '}
                      {trip.current_cycle_hours}
                    </p>
                  </div>
                </div>
                <div className="space-x-2">
                  <Link 
                    to={`/trip/${trip.id}`} 
                    className="btn btn-secondary"
                  >
                    View Details
                  </Link>
                  <Link 
                    to={`/logs?trip=${trip.id}`} 
                    className="btn btn-outline"
                  >
                    View Logs
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;
