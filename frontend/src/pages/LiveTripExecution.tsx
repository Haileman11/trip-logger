import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LiveTripExecution: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('driving');
  const [logEntry, setLogEntry] = useState('');

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(event.target.value);
  };

  const handleEndTrip = () => {
    // TODO: Handle trip completion
    navigate('/trip-completion');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Live Map Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Live Map
        </h2>
        {/* TODO: Implement live map component */}
        <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Live Map Component Placeholder</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Trip Status
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Time Driven Today</p>
              <p className="text-lg font-medium text-gray-900">05:30</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Stop</p>
              <p className="text-lg font-medium text-gray-900">Fuel (in 45 minutes)</p>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Current Status
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={handleStatusChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="driving">Driving</option>
                <option value="resting">Resting</option>
                <option value="off-duty">Off-Duty</option>
              </select>
            </div>
          </div>
        </div>

        {/* Log Updates */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Log Updates
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="logEntry" className="block text-sm font-medium text-gray-700">
                Add Log Entry
              </label>
              <textarea
                id="logEntry"
                name="logEntry"
                rows={4}
                value={logEntry}
                onChange={(e) => setLogEntry(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter log details..."
              />
            </div>
            <button
              onClick={() => setLogEntry('')}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* End Trip Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleEndTrip}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          End Trip
        </button>
      </div>
    </div>
  );
};

export default LiveTripExecution; 