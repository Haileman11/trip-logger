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
}

const DutyStatusControl: React.FC<DutyStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  drivingHours,
  maxDrivingHours,
  onDutyHours,
  maxOnDutyHours
}) => {
  const isApproachingLimit = (current: number, max: number) => {
    return (current / max) > 0.8;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Duty Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onStatusChange('driving')}
            disabled={drivingHours >= maxDrivingHours}
            className={`flex items-center justify-center p-4 rounded-lg ${
              currentStatus === 'driving'
                ? 'bg-blue-600 text-white'
                : isApproachingLimit(drivingHours, maxDrivingHours)
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaTruck className="mr-2" />
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
            className={`flex items-center justify-center p-4 rounded-lg ${
              currentStatus === 'on_duty'
                ? 'bg-blue-600 text-white'
                : isApproachingLimit(onDutyHours, maxOnDutyHours)
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BiTimeFive className="mr-2" />
            On Duty
            {isApproachingLimit(onDutyHours, maxOnDutyHours) && (
              <span className="ml-2 text-xs">
                ({Math.round(maxOnDutyHours - onDutyHours)}h left)
              </span>
            )}
          </button>

          <button
            onClick={() => onStatusChange('sleeper_berth')}
            className={`flex items-center justify-center p-4 rounded-lg ${
              currentStatus === 'sleeper_berth'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaBed className="mr-2" />
            Sleeper Berth
          </button>

          <button
            onClick={() => onStatusChange('off_duty')}
            className={`flex items-center justify-center p-4 rounded-lg ${
              currentStatus === 'off_duty'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BiTimeFive className="mr-2" />
            Off Duty
          </button>
        </div>
      </div>

      {/* Status Change History */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Status Changes</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Driving</span>
            <span className="text-gray-900">2:30 PM</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">On Duty</span>
            <span className="text-gray-900">1:15 PM</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Off Duty</span>
            <span className="text-gray-900">12:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DutyStatusControl; 