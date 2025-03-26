import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateLogSheet, fetchLogSheets, createLogSheet } from '../store/slices/logSlice';
import type { RootState, AppDispatch } from '../store';

const LogSheet = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentLogSheet, loading, error } = useSelector((state: RootState) => state.logs);
  const { currentTrip } = useSelector((state: RootState) => state.trips);
  const [formData, setFormData] = useState<{
    start_time?: string;
    end_time?: string;
    start_location?: { latitude: number; longitude: number };
    end_location?: { latitude: number; longitude: number };
    start_cycle_hours?: number;
    end_cycle_hours?: number;
    status?: string;
  }>({
    start_time: new Date().toISOString().slice(0, 16),
    start_location: { latitude: 0, longitude: 0 },
    start_cycle_hours: 0,
    status: 'active'
  });

  const [selectedLocation, setSelectedLocation] = useState<'pickup' | 'dropoff'>('pickup');

  useEffect(() => {
    if (currentTrip?.id) {
      dispatch(fetchLogSheets(currentTrip.id.toString()));
    }
  }, [dispatch, currentTrip?.id]);

  useEffect(() => {
    if (currentLogSheet && id !== 'new') {
      const endTime = currentLogSheet.end_time 
        ? new Date(currentLogSheet.end_time).toISOString().slice(0, 16)
        : '';

      setFormData({
        end_time: endTime,
        end_location: currentLogSheet.end_location || { latitude: 0, longitude: 0 },
        end_cycle_hours: currentLogSheet.end_cycle_hours || 0,
      });
    } else if (currentTrip && id === 'new') {
      // Set initial form data using trip's pickup location
      setFormData({
        start_time: new Date().toISOString().slice(0, 16),
        start_location: currentTrip.pickup_location || { latitude: 0, longitude: 0 },
        start_cycle_hours: currentTrip.current_cycle_hours || 0,
        status: 'active'
      });
    }
  }, [currentLogSheet, currentTrip, id]);

  const handleLocationSelect = (location: 'pickup' | 'dropoff') => {
    setSelectedLocation(location);
    if (currentTrip) {
      const selectedLocationData = location === 'pickup' 
        ? currentTrip.pickup_location 
        : currentTrip.dropoff_location;
      
      if (selectedLocationData) {
        setFormData(prev => ({
          ...prev,
          start_location: selectedLocationData
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!currentTrip?.id) return;

    // try {
    //   if (id === 'new') {
    //     // For new logs, use pickup location as start and dropoff as end
    //     const logData = {
    //       ...formData,
    //       start_location: currentTrip.pickup_location || formData.start_location,
    //       end_location: currentTrip.dropoff_location || formData.end_location,
    //     };

    //     await dispatch(createLogSheet({
    //       tripId: currentTrip.id.toString(),
    //       logData: logData
    //     })).unwrap();
    //   } else if (id) {
    //     const updatedData = {
    //       ...formData,
    //       end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
    //     };

    //     await dispatch(updateLogSheet({
    //       tripId: currentTrip.id.toString(),
    //       logId: id,
    //       logData: updatedData,
    //     })).unwrap();
    //   }
    //   navigate(`/trip/${currentTrip.id}/log-sheets`);
    // } catch (err) {
    //   console.error('Failed to save log sheet:', err);
    // }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {id === 'new' ? 'New Log Sheet' : 'Log Sheet Details'}
        </h1>
        <Link 
          to={`/trip/${currentTrip?.id}/log-sheets`} 
          className="btn btn-secondary"
        >
          Back to Logs
        </Link>
      </div>

      {id !== 'new' && currentLogSheet && (
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
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {id === 'new' ? (
          <>
            <div>
              <label className="label">Start Time</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Start Location</label>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Location
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedLocation}
                  onChange={(e) => handleLocationSelect(e.target.value as 'pickup' | 'dropoff')}
                >
                  <option value="pickup">Pickup Location</option>
                  <option value="dropoff">Dropoff Location</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    value={formData.start_location?.latitude}
                    onChange={(e) => setFormData({
                      ...formData,
                      start_location: {
                        latitude: parseFloat(e.target.value),
                        longitude: formData.start_location?.longitude ?? 0
                      }
                    })}
                    placeholder={currentTrip?.[selectedLocation === 'pickup' ? 'pickup_location' : 'dropoff_location']?.latitude.toString()}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    value={formData.start_location?.longitude}
                    onChange={(e) => setFormData({
                      ...formData,
                      start_location: {
                        latitude: formData.start_location?.latitude ?? 0,
                        longitude: parseFloat(e.target.value)
                      }
                    })}
                    placeholder={currentTrip?.[selectedLocation === 'pickup' ? 'pickup_location' : 'dropoff_location']?.longitude.toString()}
                  />
                </div>
              </div>
              {currentTrip && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected location: {currentTrip[selectedLocation === 'pickup' ? 'pickup_location' : 'dropoff_location']?.latitude}, {currentTrip[selectedLocation === 'pickup' ? 'pickup_location' : 'dropoff_location']?.longitude}
                </p>
              )}
            </div>

            <div>
              <label className="label">Start Cycle Hours</label>
              <input
                type="number"
                min="0"
                max="70"
                step="0.1"
                className="input"
                value={formData.start_cycle_hours}
                onChange={(e) => setFormData({
                  ...formData,
                  start_cycle_hours: parseFloat(e.target.value)
                })}
              />
            </div>
          </>
        ) : (
          <>
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
                    value={formData.end_location?.latitude}
                    onChange={(e) => setFormData({
                      ...formData,
                      end_location: {
                        latitude: parseFloat(e.target.value),
                        longitude: formData.end_location?.longitude ?? 0
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    value={formData.end_location?.longitude}
                    onChange={(e) => setFormData({
                      ...formData,
                      end_location: {
                        latitude: formData.end_location?.latitude ?? 0,
                        longitude: parseFloat(e.target.value)
                      }
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
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Saving...' : id === 'new' ? 'Create Log Sheet' : 'Update Log Sheet'}
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