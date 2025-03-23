import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchTrip } from '../store/slices/tripSlice';
import { format } from 'date-fns';
import { FaTruck, FaBed, FaGasPump } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';
import { MdLocationOn } from 'react-icons/md';
import TripMap from '../components/TripMap';
import EldLogs from '../components/EldLogs';

const TripExecution = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const trip = useSelector((state: RootState) => state.trips.currentTrip);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (tripId) {
      dispatch(fetchTrip(tripId));
    }
  }, [tripId, dispatch]);

  useEffect(() => {
    // Simulate real-time location updates
    const interval = setInterval(() => {
      if (trip?.current_location) {
        // Add small random movement for simulation
        setCurrentLocation([
          trip.current_location.latitude + (Math.random() - 0.5) * 0.001,
          trip.current_location.longitude + (Math.random() - 0.5) * 0.001
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [trip]);

  if (!trip) {
    return <div>Loading...</div>;
  }

  if (!trip.stops) {
    return <div>No stops found for this trip.</div>;
  }

  const currentStop = trip.stops.find(stop => stop?.status === 'current');
  const nextStop = trip.stops.find(stop => stop?.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Current Trip Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current Trip Status</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {trip.status}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-8 mt-4">
          <div>
            <p className="text-sm text-gray-600">Time Driven</p>
            <p className="text-2xl font-semibold">4h 23m</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Distance</p>
            <p className="text-2xl font-semibold">234 mi</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ETA</p>
            <p className="text-2xl font-semibold">
              {format(new Date(), 'h:mm a')}
            </p>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[400px]">
        <TripMap
          currentLocation={currentLocation || undefined}
          route={trip.route?.geometry}
          nextStop={nextStop && nextStop.location ? {
            location: [nextStop.location.latitude, nextStop.location.longitude],
            name: `${nextStop.type || 'Stop'} - ${nextStop.name || ''}`
          } : undefined}
        />
      </div>

      {/* Next Stop */}
      {nextStop && nextStop.location && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Next Stop</h3>
              <p className="text-gray-600">{nextStop.name || nextStop.type || 'Stop'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {Math.round(nextStop.distance_from_last_stop || 0)} mi
              </p>
              <p className="text-gray-600">
                {nextStop.arrival_time ? format(new Date(nextStop.arrival_time), 'h:mm a') : '--:--'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Duty Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Duty Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg">
            <FaTruck className="mr-2" />
            Driving
          </button>
          <button className="flex items-center justify-center p-4 bg-gray-100 text-gray-700 rounded-lg">
            <BiTimeFive className="mr-2" />
            On Duty
          </button>
          <button className="flex items-center justify-center p-4 bg-gray-100 text-gray-700 rounded-lg">
            <FaBed className="mr-2" />
            Sleeper Berth
          </button>
          <button className="flex items-center justify-center p-4 bg-gray-100 text-gray-700 rounded-lg">
            <BiTimeFive className="mr-2" />
            Off Duty
          </button>
        </div>
      </div>

      {/* Stops */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Stops</h3>
        <div className="space-y-4">
          {trip.stops.map((stop, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {stop.type === 'fuel' && <FaGasPump className="text-yellow-600 mr-3" />}
                {stop.type === 'pickup' && <MdLocationOn className="text-blue-600 mr-3" />}
                {stop.type === 'dropoff' && <MdLocationOn className="text-red-600 mr-3" />}
                {stop.type === 'rest' && <FaBed className="text-purple-600 mr-3" />}
                <div>
                  <p className="font-medium">
                    {stop.type ? stop.type.charAt(0).toUpperCase() + stop.type.slice(1) : ''} - {stop.name || ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(stop.arrival_time), 'h:mm a')}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                stop.status === 'complete' ? 'bg-green-100 text-green-800' :
                stop.status === 'current' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {stop.status ? stop.status.charAt(0).toUpperCase() + stop.status.slice(1) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ELD Logs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <EldLogs
          drivingTime={{ current: 7.75, max: 11 }}
          onDutyTime={{ current: 9.5, max: 14 }}
        />
      </div>
    </div>
  );
};

export default TripExecution; 