import React from 'react';
import { FaTruck, FaBed } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';

type DutyStatus = 'driving' | 'onDuty' | 'sleeper' | 'offDuty';

interface DutyStatusControlProps {
  currentStatus: DutyStatus;
  onStatusChange: (status: DutyStatus) => void;
  drivingHours: number;
  maxDrivingHours: number;
  onDutyHours: number;
  maxOnDutyHours: number;
  cycleHours: number;
  buttonStyles?: {
    driving: string;
    onDuty: string;
    sleeper: string;
    offDuty: string;
  };
  buttonIcons?: {
    driving: React.ReactNode;
    onDuty: React.ReactNode;
    sleeper: React.ReactNode;
    offDuty: React.ReactNode;
  };
}

const DutyStatusControl: React.FC<DutyStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  drivingHours,
  maxDrivingHours,
  onDutyHours,
  maxOnDutyHours,
  cycleHours,
  buttonStyles = {
    driving: 'bg-green-600 hover:bg-green-300 text-white ',
    onDuty: 'bg-yellow-600 hover:bg-yellow-300 text-white',
    sleeper: 'bg-blue-600 hover:bg-blue-300 text-white',
    offDuty: 'bg-red-600 hover:bg-red-300 text-white'
  },
  buttonIcons = {
    driving: <FaTruck className="mr-2" />,
    onDuty: <BiTimeFive className="mr-2" />,
    sleeper: <FaBed className="mr-2" />,
    offDuty: <BiTimeFive className="mr-2" />
  }
}) => {
  const isApproachingLimit = (current: number, max: number) => {
    return (current / max) > 0.8;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Duty Status</h3>
        <div className="text-sm text-gray-600">
          Cycle Hours: <span className="font-medium">{cycleHours.toFixed(1)}</span>
        </div>
      </div>
      
      <div className=" grid grid-cols-2 gap-4">
        <button
          onClick={() => onStatusChange('driving')}
          disabled={drivingHours >= maxDrivingHours}
          className={`flex items-center justify-center gap-2 p-4 rounded-lg ${
            currentStatus === 'driving'
              ? buttonStyles.driving
              : isApproachingLimit(drivingHours, maxDrivingHours)
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 border border-green-300 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {buttonIcons.driving}
          Driving
          {isApproachingLimit(drivingHours, maxDrivingHours) && (
            <span className="ml-2 text-xs">
              ({Math.round(maxDrivingHours - drivingHours)}h left)
            </span>
          )}
        </button>

        <button
          onClick={() => onStatusChange('onDuty')}
          disabled={onDutyHours >= maxOnDutyHours}
          className={`flex items-center justify-center gap-2 p-4 rounded-lg ${
            currentStatus === 'onDuty'
              ? buttonStyles.onDuty
              : isApproachingLimit(onDutyHours, maxOnDutyHours)
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 border border-yellow-300 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {buttonIcons.onDuty}
          On Duty
          {isApproachingLimit(onDutyHours, maxOnDutyHours) && (
            <span className="ml-2 text-xs">
              ({Math.round(maxOnDutyHours - onDutyHours)}h left)
            </span>
          )}
        </button>

        <button
          onClick={() => onStatusChange('sleeper')}
          className={`flex items-center justify-center gap-2 p-4 rounded-lg ${
            currentStatus === 'sleeper'
              ? buttonStyles.sleeper
              : 'bg-gray-100 border border-blue-300 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {buttonIcons.sleeper}
          Sleeper Berth
        </button>

        <button
          onClick={() => onStatusChange('offDuty')}
          className={`flex items-center justify-center gap-2 p-4 rounded-lg ${
            currentStatus === 'offDuty'
              ? buttonStyles.offDuty
              : 'bg-gray-100 border border-red-300 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {buttonIcons.offDuty}
          Off Duty
        </button>
      </div>
    </div>
  );
};

export default DutyStatusControl; 