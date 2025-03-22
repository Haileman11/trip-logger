import React from 'react';
import { useNavigate } from 'react-router-dom';

const TripCompletionReport: React.FC = () => {
  const navigate = useNavigate();

  const handleDownloadELDLogs = () => {
    // TODO: Implement ELD logs download
    console.log('Downloading ELD logs...');
  };

  const handleStartNewTrip = () => {
    navigate('/trip-details');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Trip Summary Report
      </h1>

      <div className="space-y-6">
        {/* Route Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Route Overview
          </h2>
          <div className="divide-y divide-gray-200">
            <div className="py-4">
              <p className="text-sm font-medium text-gray-500">Total Hours Driven</p>
              <p className="mt-1 text-lg text-gray-900">12:30</p>
            </div>
            <div className="py-4">
              <p className="text-sm font-medium text-gray-500">Stops Taken</p>
              <p className="mt-1 text-lg text-gray-900">Fuel: 2, Rest: 3</p>
            </div>
            <div className="py-4">
              <p className="text-sm font-medium text-gray-500">Total Distance</p>
              <p className="mt-1 text-lg text-gray-900">450 miles</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleDownloadELDLogs}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download ELD Logs
          </button>
          <button
            onClick={handleStartNewTrip}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Start New Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripCompletionReport; 