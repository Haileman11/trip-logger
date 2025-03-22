import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTrip, planRoute } from '../store/slices/tripSlice';
import type { RootState, AppDispatch } from '../store';
import RouteMap from '../components/RouteMap';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icons for pickup and dropoff
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const LocationMarker = ({ 
  position, 
  icon,
  onRemove 
}: { 
  position: L.LatLngTuple; 
  icon: L.Icon;
  onRemove?: () => void;
}) => {
  return (
    <Marker position={position} icon={icon}>
      {onRemove && (
        <Popup>
          <button
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Remove Location
          </button>
        </Popup>
      )}
    </Marker>
  );
};

const MapClickHandler = ({ 
  onLocationSelect 
}: { 
  onLocationSelect: (location: { latitude: number; longitude: number }) => void;
}) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      });
    }
  });
  return null;
};

const TripPlanner = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentTrip, loading, error } = useSelector((state: RootState) => state.trips);
  const [formData, setFormData] = useState({
    current_location: { latitude: 0, longitude: 0 },
    pickup_location: { latitude: 0, longitude: 0 },
    dropoff_location: { latitude: 0, longitude: 0 },
    current_cycle_hours: 0,
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [isLocationSet, setIsLocationSet] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            current_location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
          setIsLocationSet(true);
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location services.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleLocationSelect = (location: { latitude: number; longitude: number }) => {
    if (formData.pickup_location.latitude === 0) {
      setFormData(prev => ({
        ...prev,
        pickup_location: location
      }));
    } else if (formData.dropoff_location.latitude === 0) {
      setFormData(prev => ({
        ...prev,
        dropoff_location: location
      }));
    }
  };

  const handleRemovePickup = () => {
    setFormData(prev => ({
      ...prev,
      pickup_location: { latitude: 0, longitude: 0 }
    }));
  };

  const handleRemoveDropoff = () => {
    setFormData(prev => ({
      ...prev,
      dropoff_location: { latitude: 0, longitude: 0 }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate coordinates
      const validateLocation = (loc: { latitude: number; longitude: number }) => {
        return !isNaN(loc.latitude) && !isNaN(loc.longitude) &&
               loc.latitude >= -90 && loc.latitude <= 90 &&
               loc.longitude >= -180 && loc.longitude <= 180;
      };

      if (!validateLocation(formData.current_location) ||
          !validateLocation(formData.pickup_location) ||
          !validateLocation(formData.dropoff_location)) {
        setLocationError('Please enter valid coordinates for all locations');
        return;
      }

      if (formData.pickup_location.latitude === 0 || formData.dropoff_location.latitude === 0) {
        setLocationError('Please set both pickup and dropoff locations on the map');
        return;
      }

      console.log('Creating trip with data:', formData);
      const result = await dispatch(createTrip(formData)).unwrap();
      console.log('Trip created:', result);
      
      if (result.id) {
        console.log('Planning route for trip ID:', result.id);
        try {
          const response = await dispatch(planRoute({
            tripId: result.id
          })).unwrap();
          
          console.log('Route planned successfully:', response);
          
          if (!response.stops || response.stops.length === 0) {
            throw new Error('No stops were generated for the route');
          }
          
          setRouteData(response.route || {});
          setStops(response.stops);
        } catch (planError) {
          console.error('Error planning route:', planError);
          if (planError instanceof Error) {
            setLocationError(planError.message);
          } else {
            setLocationError('Failed to plan route. Please try again.');
          }
        }
      } else {
        setLocationError('Failed to create trip. Please try again.');
      }
    } catch (err) {
      console.error('Failed to create or plan trip:', err);
      if (err instanceof Error) {
        setLocationError(err.message);
      } else {
        setLocationError('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Default center for the map
  const defaultCenter: L.LatLngTuple = isLocationSet 
    ? [formData.current_location.latitude, formData.current_location.longitude]
    : [9.0248826, 38.7807792]; // Default to Addis Ababa coordinates

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Plan Your Trip</h1>
      
      {locationError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {locationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        {/* Map Component */}
        <div className="mb-6">
          <div className="h-[400px] w-full rounded-lg overflow-hidden">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              className="h-full w-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              
              {/* Current Location Marker */}
              {isLocationSet && (
                <LocationMarker 
                  position={[formData.current_location.latitude, formData.current_location.longitude]} 
                  icon={defaultIcon}
                />
              )}
              
              {/* Pickup Location Marker */}
              {formData.pickup_location.latitude !== 0 && (
                <LocationMarker 
                  position={[formData.pickup_location.latitude, formData.pickup_location.longitude]} 
                  icon={greenIcon}
                  onRemove={handleRemovePickup}
                />
              )}
              
              {/* Dropoff Location Marker */}
              {formData.dropoff_location.latitude !== 0 && (
                <LocationMarker 
                  position={[formData.dropoff_location.latitude, formData.dropoff_location.longitude]} 
                  icon={redIcon}
                  onRemove={handleRemoveDropoff}
                />
              )}
            </MapContainer>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Click on the map to set pickup (green) and dropoff (red) locations. Click on a marker to remove it.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Current Location</label>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Latitude</span>
              <p className="mt-1">{formData.current_location.latitude}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Longitude</span>
              <p className="mt-1">{formData.current_location.longitude}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.pickup_location.latitude}
              onChange={(e) => setFormData({
                ...formData,
                pickup_location: { ...formData.pickup_location, latitude: parseFloat(e.target.value) }
              })}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.pickup_location.longitude}
              onChange={(e) => setFormData({
                ...formData,
                pickup_location: { ...formData.pickup_location, longitude: parseFloat(e.target.value) }
              })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.dropoff_location.latitude}
              onChange={(e) => setFormData({
                ...formData,
                dropoff_location: { ...formData.dropoff_location, latitude: parseFloat(e.target.value) }
              })}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.dropoff_location.longitude}
              onChange={(e) => setFormData({
                ...formData,
                dropoff_location: { ...formData.dropoff_location, longitude: parseFloat(e.target.value) }
              })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Current Cycle Hours</label>
          <input
            type="number"
            min="0"
            max="70"
            step="0.1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.current_cycle_hours}
            onChange={(e) => setFormData({
              ...formData,
              current_cycle_hours: parseFloat(e.target.value)
            })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Planning...' : 'Plan Trip'}
        </button>

        {error && (
          <div className="text-red-600 text-sm mt-2">
            {error}
          </div>
        )}
      </form>

      {currentTrip && routeData && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Route Map</h2>
            <RouteMap
              route={routeData}
              stops={stops}
              currentLocation={formData.current_location}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Trip Details</h2>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">{currentTrip.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Stops</h3>
                  <p className="mt-1">{stops.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner; 