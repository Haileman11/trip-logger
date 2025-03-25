import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { 
  fetchTrip, 
  updateStopStatus, 
  completeTrip, 
  planRoute,
  createStop,
  deleteStop
} from '../store/slices/tripSlice';
import { RootState, AppDispatch } from '../store';
import TripMap from '../components/TripMap';
import StopStatusUpdate from '../components/StopStatusUpdate';
import DutyStatusControl from '../components/DutyStatusControl';
import { Location, Stop } from '../types';

type DutyStatus = 'driving' | 'on_duty' | 'sleeper_berth' | 'off_duty';
type TripStatus = 'not_started' | 'in_progress' | 'completed';

interface StatusLog {
  status: DutyStatus;
  timestamp: Date;
}

const TripExecution: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentTrip: trip, loading, error } = useSelector((state: RootState) => state.trips);
  
  const [currentLocation, setCurrentLocation] = useState<Location | undefined>(undefined);
  const [currentStatus, setCurrentStatus] = useState<DutyStatus>('off_duty');
  const [tripStatus, setTripStatus] = useState<TripStatus>('not_started');
  const [drivingHours, setDrivingHours] = useState(0);
  const [onDutyHours, setOnDutyHours] = useState(0);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch trip data and plan route
  useEffect(() => {
    const fetchTripData = async () => {
      if (tripId) {
        try {
          // Fetch trip details
          const result = await dispatch(fetchTrip(tripId)).unwrap();
          
          // Set initial trip status
          setTripStatus(result.status === 'completed' ? 'completed' : 'not_started');
          
          // Plan route if trip is in planned status and has no route
          if (result.status === 'planned' && !result.route) {
            await dispatch(planRoute(parseInt(tripId))).unwrap();
          }
        } catch (error) {
          console.error('Error fetching trip data:', error);
        }
      }
    };

    fetchTripData();
  }, [tripId, dispatch]);

  // Initialize current location
  useEffect(() => {
    if (trip?.current_location && 
        typeof trip.current_location.latitude === 'number' && 
        typeof trip.current_location.longitude === 'number' && 
        !currentLocation) {
      setCurrentLocation(trip.current_location);
    }
  }, [trip, currentLocation]);

  // Simulate location updates
  useEffect(() => {
    if (tripStatus !== 'in_progress') return;

    const interval = setInterval(() => {
      if (currentLocation && trip?.route?.routes?.[0]?.geometry?.coordinates) {
        // Get next point, ensuring it has valid coordinates
        const nextPointIndex = Math.min(currentStopIndex + 1, trip.route.routes[0].geometry.coordinates.length - 1);
        const nextPoint = trip.route.routes[0].geometry.coordinates[nextPointIndex];
        
        if (Array.isArray(nextPoint) && nextPoint.length === 2) {
          const [lng, lat] = nextPoint;
          // Update location
          const updatedLocation: Location = {
            latitude: currentLocation.latitude + (lat - currentLocation.latitude) ,
            longitude: currentLocation.longitude + (lng - currentLocation.longitude)  
          };
          console.log('Updated location:', updatedLocation);
          setCurrentLocation(updatedLocation);

          // Check if within range of current stop
          if (trip.stops?.[currentStopIndex]?.location) {
            const currentStop = trip.stops[currentStopIndex];
            const distance = calculateDistance(updatedLocation, currentStop.location);
            setIsWithinRange(distance <= 0.5); // Within 0.5 miles
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentLocation, trip, currentStopIndex, tripStatus]);

  // Update duty hours
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStatus === 'driving') {
        setDrivingHours(prev => prev + 1/3600);
        setOnDutyHours(prev => prev + 1/3600);
      } else if (currentStatus === 'on_duty') {
        setOnDutyHours(prev => prev + 1/3600);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStatus]);

  // Update time remaining for stop confirmation
  useEffect(() => {
    if (isWithinRange && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isWithinRange, timeRemaining]);

  const handleStatusChange = (status: DutyStatus) => {
    setCurrentStatus(status);
    setStatusLogs(prev => [
      { status, timestamp: new Date() },
      ...prev
    ]);
  };

  const handleStopConfirmation = async () => {
    if (!trip?.stops || !tripId || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const currentStop = trip.stops[currentStopIndex];
      await dispatch(updateStopStatus({ 
        tripId, 
        stopId: currentStop.id, 
        status: 'completed' 
      })).unwrap();
      
      // Fetch updated trip data
      await dispatch(fetchTrip(tripId)).unwrap();
      
      if (currentStopIndex < trip.stops.length - 1) {
        setCurrentStopIndex(prev => prev + 1);
        setTimeRemaining(3600);
      } else {
        // Trip completed
        await dispatch(completeTrip(tripId)).unwrap();
        navigate('/trips');
      }
    } catch (error) {
      console.error('Failed to update stop status:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSkipStop = async () => {
    if (!trip?.stops || !tripId || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const currentStop = trip.stops[currentStopIndex];
      await dispatch(updateStopStatus({ 
        tripId, 
        stopId: currentStop.id, 
        status: 'skipped' 
      })).unwrap();
      
      if (currentStopIndex < trip.stops.length - 1) {
        setCurrentStopIndex(prev => prev + 1);
        setTimeRemaining(3600);
      } else {
        // Trip completed
        await dispatch(completeTrip(tripId)).unwrap();
        navigate('/trips');
      }
    } catch (error) {
      console.error('Failed to skip stop:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartTrip = () => {
    setTripStatus('in_progress');
    setCurrentStatus('driving');
    setStatusLogs(prev => [
      { status: 'driving', timestamp: new Date() },
      ...prev
    ]);
  };

  const handleCreateStop = async () => {
    if (!trip?.stops || !tripId || isUpdating) return;
    
    setIsUpdating(true);
    try {
      // Get the last stop's location as a reference
      const lastStop = trip.stops[trip.stops.length - 1];
      
      // Create a new rest stop near the last stop
      await dispatch(createStop({
        tripId,
        stopData: {
          location: {
            latitude: lastStop.location.latitude + 0.01, // Slightly offset from last stop
            longitude: lastStop.location.longitude + 0.01
          },
          stop_type: 'rest',
          duration_minutes: 30,
          cycle_hours_at_stop: lastStop.cycle_hours_at_stop + 0.5,
          distance_from_last_stop: 1.0 // Approximate 1 mile from last stop
        }
      })).unwrap();
      
      // Fetch updated trip data
      await dispatch(fetchTrip(tripId)).unwrap();
    } catch (error) {
      console.error('Failed to create stop:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!tripId || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await dispatch(deleteStop({ tripId, stopId })).unwrap();
      
      // Fetch updated trip data
      await dispatch(fetchTrip(tripId)).unwrap();
      
      // If we deleted the current stop, move to the next one
      if (trip?.stops[currentStopIndex]?.id.toString() === stopId) {
        setCurrentStopIndex(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete stop:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    // Haversine formula implementation
    const R = 3959; // Earth's radius in miles
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading trip details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!trip || !trip.stops) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">No trip data available</div>
      </div>
    );
  }

  const currentStop = trip.stops[currentStopIndex];

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Trip Status Banner */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Trip Status: {tripStatus}</h2>
            <p className="text-sm text-gray-600">
              Trip ID: {trip.id} | Current Stop: {currentStopIndex + 1} of {trip.stops.length}
            </p>
          </div>
          {tripStatus === 'not_started' && (
            <button
              onClick={handleStartTrip}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Start Trip
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 col-span-2">
          <h2 className="text-xl font-bold mb-4">Trip Progress</h2>
          <TripMap
            currentLocation={currentLocation || trip.current_location}
            route={trip.route}
            stops={trip.stops || []}
            currentStopIndex={currentStopIndex}
            tripStatus={tripStatus}
          />
        </div>

        {/* Stops List Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Stops</h2>
            <button
              onClick={handleCreateStop}
              disabled={isUpdating || tripStatus !== 'in_progress'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Rest Stop
            </button>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[500px]">
            {trip.stops.map((stop, index) => (
              <div
                key={stop.id}
                className={`p-4 rounded-lg border ${
                  index === currentStopIndex
                    ? 'border-blue-500 bg-blue-50'
                    : stop.status === 'completed'
                    ? 'border-green-500 bg-green-50'
                    : stop.status === 'skipped'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{getStopTitle(stop.stop_type)}</h3>
                    <p className="text-sm text-gray-600">
                      Arrival: {new Date(stop.arrival_time).toLocaleString()}
                    </p>
                    {stop.distance_from_last_stop > 0 && (
                      <p className="text-sm text-gray-600">
                        Distance: {stop.distance_from_last_stop.toFixed(1)} miles
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      stop.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : stop.status === 'skipped'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {stop.status.toUpperCase()}
                    </span>
                    {stop.stop_type === 'rest' && tripStatus === 'in_progress' && (
                      <button
                        onClick={() => handleDeleteStop(stop.id.toString())}
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {currentStopIndex === index && <StopStatusUpdate
                  stop={stop}
                  isWithinRange={isWithinRange}
                  onConfirm={handleStopConfirmation}
                  onSkip={handleSkipStop}
                  timeRemaining={timeRemaining}
                  isUpdating={isUpdating}
                />}
              </div>
            ))}
          </div>
        </div>

        
        {/* Duty Status Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 lg:col-span-2">
          <DutyStatusControl
            currentStatus={currentStatus}
            onStatusChange={handleStatusChange}
            drivingHours={drivingHours}
            maxDrivingHours={11}
            onDutyHours={onDutyHours}
            maxOnDutyHours={14}
          />
        </div>

        {/* Status Logs Section
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4">Status Logs</h2>
          <div className="space-y-2">
            {statusLogs.map((log, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{log.status}</span>
                <span className="text-gray-900">
                  {format(log.timestamp, 'h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
};

const getStopTitle = (stopType: Stop['stop_type']) => {
  switch (stopType) {
    case 'pickup':
      return 'Pickup Location';
    case 'dropoff':
      return 'Dropoff Location';
    case 'rest':
      return 'Rest Stop';
    case 'fuel':
      return 'Fuel Stop';
    default:
      return 'Stop';
  }
};

export default TripExecution; 