import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateLogSheet, fetchLogSheets } from '../store/logSlice';
import DailyLogGrid from '../components/DailyLogGrid';
import type { RootState, AppDispatch } from '../store';

type DutyStatus = 'offDuty' | 'sleeper' | 'driving' | 'onDuty';

const LogSheet = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentLogSheet, loading, error } = useSelector((state: RootState) => state.logs);
  const { currentTrip } = useSelector((state: RootState) => state.trips);
  const [formData, setFormData] = useState({
    end_time: '',
    end_location: { latitude: 0, longitude: 0 },
    end_cycle_hours: 0,
  });

  useEffect(() => {
    if (id && currentTrip?.id) {
      dispatch(fetchLogSheets(currentTrip.id.toString()));
    }
  }, [dispatch, id, currentTrip?.id]);

  useEffect(() => {
    if (currentLogSheet) {
      // Convert the ISO string to local datetime-local format
      const endTime = currentLogSheet.end_time 
        ? new Date(currentLogSheet.end_time).toISOString().slice(0, 16)
        : '';

      setFormData({
        end_time: endTime,
        end_location: currentLogSheet.end_location || { latitude: 0, longitude: 0 },
        end_cycle_hours: currentLogSheet.end_cycle_hours || 0,
      });
    }
  }, [currentLogSheet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentTrip?.id) return;

    try {
      const updatedData = {
        ...formData,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      };

      await dispatch(updateLogSheet({
        tripId: currentTrip.id.toString(),
        logId: id,
        data: updatedData,
      })).unwrap();
    } catch (err) {
      console.error('Failed to update log sheet:', err);
    }
  };

  if (!currentLogSheet || !currentTrip) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Log Sheet Details</h1>
        <Link to="/logs" className="btn btn-secondary">
          Back to Logs
        </Link>
      </div>

      <div className="card mb-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
            <p className="mt-1 text-gray-900">{new Date(currentLogSheet.start_time).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Start Location</h3>
            <p className="mt-1 text-gray-900">
              {currentLogSheet.start_location.latitude}, {currentLogSheet.start_location.longitude}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Start Cycle Hours</h3>
            <p className="mt-1 text-gray-900">{currentLogSheet.start_cycle_hours}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1">
              <span className={`status-badge ${
                currentLogSheet.status === 'active' ? 'status-badge-active' :
                currentLogSheet.status === 'completed' ? 'status-badge-completed' :
                'status-badge-pending'
              }`}>
                {currentLogSheet.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">End Time</label>
          <input
            type="datetime-local"
            className="input"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>

        <div>
          <label className="label">End Location</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Latitude</label>
              <input
                type="number"
                step="any"
                className="input"
                value={formData.end_location.latitude}
                onChange={(e) => setFormData({
                  ...formData,
                  end_location: { ...formData.end_location, latitude: parseFloat(e.target.value) }
                })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Longitude</label>
              <input
                type="number"
                step="any"
                className="input"
                value={formData.end_location.longitude}
                onChange={(e) => setFormData({
                  ...formData,
                  end_location: { ...formData.end_location, longitude: parseFloat(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">End Cycle Hours</label>
          <input
            type="number"
            min="0"
            max="70"
            step="0.1"
            className="input"
            value={formData.end_cycle_hours}
            onChange={(e) => setFormData({
              ...formData,
              end_cycle_hours: parseFloat(e.target.value)
            })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Log Sheet'}
        </button>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default LogSheet; 