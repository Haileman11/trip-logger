import React from 'react';
import { FaTruck, FaBed } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';

type DutyStatus = 'driving' | 'on_duty' | 'sleeper_berth' | 'off_duty';

interface DutyStatusControlProps {
  currentStatus: DutyStatus;
  onStatusChange: (status: DutyStatus) => void;
  drivingHours: number;
  maxDrivingHours: number;
  onDutyHours: number;
  maxOnDutyHours: number;
  buttonStyles?: {
    driving: string;
    on_duty: string;
    sleeper_berth: string;
    off_duty: string;
  };
  buttonIcons?: {
    driving: React.ReactNode;
    on_duty: React.ReactNode;
    sleeper_berth: React.ReactNode;
    off_duty: React.ReactNode;
  };
}

const DutyStatusControl: React.FC<DutyStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  drivingHours,
  maxDrivingHours,
  onDutyHours,
  maxOnDutyHours,
  buttonStyles = {
    driving: 'bg-green-600 hover:bg-green-300 text-white ',
    on_duty: 'bg-yellow-600 hover:bg-yellow-300 text-white',
    sleeper_berth: 'bg-blue-600 hover:bg-blue-300 text-white',
    off_duty: 'bg-red-600 hover:bg-red-300 text-white'
  },
  buttonIcons = {
    driving: <FaTruck className="mr-2" />,
    on_duty: <BiTimeFive className="mr-2" />,
    sleeper_berth: <FaBed className="mr-2" />,
    off_duty: <BiTimeFive className="mr-2" />
  }
}) => {
  const isApproachingLimit = (current: number, max: number) => {
    return (current / max) > 0.8;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Duty Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
          <button
            onClick={() => onStatusChange('driving')}
            disabled={drivingHours >= maxDrivingHours}
            className={`flex items-center  justify-center gap-2 p-4 rounded-lg ${
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
            onClick={() => onStatusChange('on_duty')}
            disabled={onDutyHours >= maxOnDutyHours}
            className={`flex items-center  justify-center gap-2 p-4 rounded-lg ${
              currentStatus === 'on_duty'
                ? buttonStyles.on_duty
                : isApproachingLimit(onDutyHours, maxOnDutyHours)
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 border border-yellow-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {buttonIcons.on_duty}
            On Duty
            {isApproachingLimit(onDutyHours, maxOnDutyHours) && (
              <span className="ml-2 text-xs">
                ({Math.round(maxOnDutyHours - onDutyHours)}h left)
              </span>
            )}
          </button>

          <button
            onClick={() => onStatusChange('sleeper_berth')}
            className={`flex items-center  justify-center gap-2 p-4 rounded-lg ${
              currentStatus === 'sleeper_berth'
                ? buttonStyles.sleeper_berth
                : 'bg-gray-100 border border-blue-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {buttonIcons.sleeper_berth}
            Sleeper Berth
          </button>

          <button
            onClick={() => onStatusChange('off_duty')}
            className={`flex items-center  justify-center gap-2 p-4 rounded-lg ${
              currentStatus === 'off_duty'
                ? buttonStyles.off_duty
                : 'bg-gray-100 border border-red-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {buttonIcons.off_duty}
            Off Duty
          </button>
        </div>
      </div>

      
    </div>
  );
};

export default DutyStatusControl; 