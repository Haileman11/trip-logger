import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchLogSheets } from '../store/slices/logSlice';
import type { RootState, AppDispatch } from '../store';

const LogViewer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { logSheets, loading, error } = useSelector((state: RootState) => state.log);
  const { currentTrip } = useSelector((state: RootState) => state.trip);

  useEffect(() => {
    if (currentTrip?.id) {
      dispatch(fetchLogSheets(currentTrip.id));
    }
  }, [dispatch, currentTrip?.id]);

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
        <h1 className="text-2xl font-bold text-gray-900">Log Sheets</h1>
        <Link to="/" className="btn btn-primary">
          New Trip
        </Link>
      </div>

      {logSheets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No log sheets found. Create a new trip to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {logSheets.map((log) => (
            <Link
              key={log.id}
              to={`/log-sheet/${log.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Log Sheet #{log.id}</h2>
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
                  <span className={`status-badge ${
                    log.status === 'active' ? 'status-badge-active' :
                    log.status === 'completed' ? 'status-badge-completed' :
                    'status-badge-pending'
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