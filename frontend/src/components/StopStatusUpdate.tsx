import React from 'react';
import { format } from 'date-fns';
import { Stop } from '../types';
import { FaTruck, FaBed, FaGasPump } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';

interface StopStatusUpdateProps {
  stop: Stop;
  isWithinRange: boolean;
  onConfirm: () => void;
  onSkip: () => void;
  timeRemaining: number;
  isUpdating: boolean;
}

const StopStatusUpdate: React.FC<StopStatusUpdateProps> = ({
  stop,
  isWithinRange,
  onConfirm,
  onSkip,
  timeRemaining,
  isUpdating
}) => {
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStopIcon = (stopType: Stop['stop_type']) => {
    switch (stopType) {
      case 'pickup':
        return <MdLocationOn className="text-blue-600 text-2xl" />;
      case 'dropoff':
        return <MdLocationOn className="text-red-600 text-2xl" />;
      case 'fuel':
        return <FaGasPump className="text-yellow-600 text-2xl" />;
      case 'rest':
        return <FaBed className="text-purple-600 text-2xl" />;
      default:
        return <MdLocationOn className="text-gray-600 text-2xl" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        {getStopIcon(stop.stop_type)}
        <div>
          <h3 className="text-lg font-semibold">
            {`${stop.stop_type?.toString().charAt(0).toUpperCase() + stop.stop_type?.toString().slice(1)} Stop`}
          </h3>
          
        </div>
      </div>

      {stop.distance_from_last_stop && (
        <div className="text-sm text-gray-600">
          Distance from last stop: {Math.round(stop.distance_from_last_stop)} miles
        </div>
      )}

      

      <div className="flex md:flex-col space-x-4">
        <button
          onClick={onConfirm}
          disabled={!isWithinRange || isUpdating}
          className={`flex-1 py-2 px-4 rounded-lg ${
            isWithinRange && !isUpdating
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isUpdating ? 'Updating...' : 'Confirm Arrival'}
        </button>
        <button
          onClick={onSkip}
          disabled={isUpdating}
          className={`flex-1 py-2 px-4 rounded-lg ${
            isUpdating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isUpdating ? 'Updating...' : 'Skip Stop'}
        </button>
      </div>
    </div>
  );
};

export default StopStatusUpdate; 