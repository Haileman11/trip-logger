import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchLogSheets } from '../store/slices/logSlice';
import type { RootState, AppDispatch } from '../store';

const LogViewer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tripId } = useParams<{ tripId: string }>();
  const { logSheets, loading, error } = useSelector((state: RootState) => state.logs);

  useEffect(() => {
    if (tripId) {
      console.log('Fetching log sheets for trip:', tripId);
      dispatch(fetchLogSheets(tripId))
        .unwrap()
        .then((data) => {
          console.log('Fetched log sheets:', data);
        })
        .catch((error) => {
          console.error('Error fetching log sheets:', error);
        });
    }
  }, [dispatch, tripId]);

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
        <h1 className="text-2xl font-bold text-gray-900">Trip Logs</h1>
        <div className="space-x-4">
          <Link 
            to={`/trip/${tripId}/log-sheet/new`}
            className="btn btn-primary"
          >
            Add New Log
          </Link>
          <Link 
            to={`/trip/${tripId}`} 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Trip
          </Link>
        </div>
      </div>

      {!logSheets || logSheets.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No logs found for this trip.</p>
          <Link
            to={`/trip/${tripId}/log-sheet/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Your First Log
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {logSheets.map((log) => (
            <Link
              key={log.id}
              to={`/trip/${tripId}/log-sheet/${log.id}`}
              className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Log #{log.id}</h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-600">
                      <span className="font-medium">Start:</span>{' '}
                      {new Date(log.start_time).toLocaleString()}
                    </p>
                    {log.end_time && (
                      <p className="text-gray-600">
                        <span className="font-medium">End:</span>{' '}
                        {new Date(log.end_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-sm rounded-full ${
                    log.status === 'active' ? 'bg-green-100 text-green-800' :
                    log.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {log.status}
                  </span>
                  <p className="text-gray-600 mt-2">
                    <span className="font-medium">Cycle Hours:</span>{' '}
                    {log.start_cycle_hours}
                    {log.end_cycle_hours && ` → ${log.end_cycle_hours}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogViewer; 