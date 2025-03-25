import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { Trip, Location, Stop } from '../../types';

const API_BASE_URL = 'http://localhost:8000';

interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

const initialState: TripState = {
  trips: [],
  currentTrip: null,
  loading: false,
  error: null,
  pagination: {
    count: 0,
    next: null,
    previous: null,
  },
};

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  console.log('Auth token:', token);
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }
  return token;
};

// Helper function to get headers
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  };
  console.log('Request headers:', headers);
  return headers;
};

export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async ({ page = 1, sortBy = 'id', sortOrder = 'desc' }: { page?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      });
      
      const response = await fetch(`${API_BASE_URL}/api/trips/?${params.toString()}`, {
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch trips');
      }
      
      const data = await response.json();
      
      // Handle both paginated and non-paginated responses
      const trips = Array.isArray(data) ? data : (data.results || []);
      const pagination = Array.isArray(data) ? {
        count: data.length,
        next: null,
        previous: null,
      } : {
        count: data.count || data.length || 0,
        next: data.next || null,
        previous: data.previous || null,
      };
      
      return {
        trips,
        pagination
      };
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  }
);

export const fetchTrip = createAsyncThunk(
  'trip/fetchTrip',
  async (tripId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch trip');
    }
    const data = await response.json();
    return data as Trip;
  }
);

export const createTrip = createAsyncThunk(
  'trips/createTrip',
  async (tripData: {
    current_location: Location;
    pickup_location: Location;
    dropoff_location: Location;
    fuel_stop?: Location;
    current_cycle_hours: number;
  }) => {
    try {
      // Create trip
      const response = await fetch(`${API_BASE_URL}/api/trips/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tripData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create trip');
      }
      
      const tripResponse = await response.json();
      console.log('Trip created response:', tripResponse);

      // Return the response directly since it already includes the route and stops
      return tripResponse;
    } catch (error) {
      console.error('Error in createTrip:', error);
      throw error;
    }
  }
);

export const planRoute = createAsyncThunk(
  'trips/planRoute',
  async (tripId: number, { getState }) => {
    const state = getState() as RootState;
    const trip = state.trips.currentTrip;
    
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/plan_route/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        fuelStop: trip?.fuel_stop ? {
          latitude: trip.fuel_stop.latitude,
          longitude: trip.fuel_stop.longitude
        } : undefined
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to plan route');
    }
    return response.json();
  }
);

export const startTrip = createAsyncThunk(
  'trip/startTrip',
  async (tripId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/start_trip/`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to start trip');
    }
    const data = await response.json();
    return data as Trip;
  }
);

export const updateStopStatus = createAsyncThunk(
  'trip/updateStopStatus',
  async ({ tripId, stopId, status }: { tripId: string; stopId: string; status: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/update_stop_status/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ stop_id: stopId, status }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to update stop status');
    }
    const data = await response.json();
    return data as Trip;
  }
);

export const createStop = createAsyncThunk(
  'trip/createStop',
  async ({ tripId, stopData }: { tripId: string; stopData: Partial<Stop> }) => {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/create_stop/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(stopData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create stop');
    }
    const data = await response.json();
    return data as Trip;
  }
);

export const deleteStop = createAsyncThunk(
  'trip/deleteStop',
  async ({ tripId, stopId }: { tripId: string; stopId: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/delete_stop/?stop_id=${stopId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete stop');
    }
    const data = await response.json();
    return data as Trip;
  }
);

export const completeTrip = createAsyncThunk(
  'trip/completeTrip',
  async (tripId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/complete/`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to complete trip');
    }
    const data = await response.json();
    return data as Trip;
  }
);

export const deleteTrip = createAsyncThunk(
  'trip/deleteTrip',
  async (tripId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete trip');
    }
    return tripId;
  }
);

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    setCurrentTrip: (state, action) => {
      state.currentTrip = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload.trips;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch trips';
        state.trips = [];
        state.pagination = {
          count: 0,
          next: null,
          previous: null,
        };
      })
      .addCase(fetchTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrip = action.payload;
      })
      .addCase(fetchTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch trip';
      })
      .addCase(planRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(planRoute.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTrip) {
          state.currentTrip = {
            ...state.currentTrip,
            stops: action.payload.stops,
            route: action.payload.route,
            status: action.payload.trip.status
          };
        }
      })
      .addCase(planRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to plan route';
      })
      .addCase(startTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startTrip.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTrip) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(startTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start trip';
      })
      .addCase(updateStopStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStopStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTrip) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(updateStopStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update stop status';
      })
      .addCase(createStop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStop.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTrip) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(createStop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create stop';
      })
      .addCase(deleteStop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStop.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTrip) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(deleteStop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete stop';
      })
      .addCase(completeTrip.fulfilled, (state, action) => {
        if (state.currentTrip) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.trips = state.trips.filter(trip => trip.id.toString() !== action.payload);
        if (state.currentTrip?.id.toString() === action.payload) {
          state.currentTrip = null;
        }
      });
  },
});

export const { setCurrentTrip } = tripSlice.actions;
export default tripSlice.reducer; 