import React from 'react';
import { useNavigate } from 'react-router-dom';

const RouteAndELDLogDisplay: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Trip Plan
        </h1>
      </div>

      <div className="space-y-6">
        {/* Route Map Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Route Map
          </h2>
          {/* TODO: Implement map component with route visualization */}
          <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Map Component Placeholder</p>
          </div>
        </div>

        {/* ELD Logs Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ELD Logs
          </h2>
          {/* TODO: Implement ELD logs visualization */}
          <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">ELD Logs Visualization Placeholder</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/live-trip')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Confirm Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteAndELDLogDisplay; 