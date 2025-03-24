import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { Trip, Location, Stop } from '../../types';

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

export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async ({ page = 1, sortBy = 'id', sortOrder = 'desc' }: { page?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      });
      
      console.log('Fetching trips with params:', params.toString());
      const response = await fetch(`/api/trips/?${params.toString()}`);
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error('Failed to fetch trips');
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
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
    const response = await fetch(`/api/trips/${tripId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trip');
    }
    const data = await response.json();
    console.log('Fetch Trip API Response data:', data);
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
    const response = await fetch('/api/trips/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...tripData,
        current_location: {
          latitude: tripData.current_location.latitude,
          longitude: tripData.current_location.longitude
        },
        pickup_location: {
          latitude: tripData.pickup_location.latitude,
          longitude: tripData.pickup_location.longitude
        },
        dropoff_location: {
          latitude: tripData.dropoff_location.latitude,
          longitude: tripData.dropoff_location.longitude
        },
        fuel_stop: tripData.fuel_stop ? {
          latitude: tripData.fuel_stop.latitude,
          longitude: tripData.fuel_stop.longitude
        } : undefined
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Create Trip API Error:', errorData);
      throw new Error(errorData.message || 'Failed to create trip');
    }
    return response.json();
  }
);

export const planRoute = createAsyncThunk(
  'trips/planRoute',
  async (tripId: number, { getState }) => {
    const state = getState() as RootState;
    const trip = state.trips.currentTrip;
    
    const response = await fetch(`/api/trips/${tripId}/plan_route/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fuelStop: trip?.fuel_stop ? {
          latitude: trip.fuel_stop.latitude,
          longitude: trip.fuel_stop.longitude
        } : undefined
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Plan Route API Error data:", errorData);
      throw new Error(errorData.message || 'Failed to plan route');
    }
    const data = await response.json();
    console.log('Plan Route API Response data:', data);
    return data;
  }
);

export const updateStopStatus = createAsyncThunk(
  'trip/updateStopStatus',
  async ({ tripId, stopId, status }: { tripId: string; stopId: string; status: string }) => {
    const response = await fetch(`/api/trips/${tripId}/stops/${stopId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update stop status');
    }
    const data = await response.json();
    return data as Trip;
  }
);

export const completeTrip = createAsyncThunk(
  'trip/completeTrip',
  async (tripId: string) => {
    const response = await fetch(`/api/trips/${tripId}/complete/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to complete trip');
    }
    const data = await response.json();
    return data as Trip;
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
      .addCase(updateStopStatus.fulfilled, (state, action) => {
        if (state.currentTrip) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(completeTrip.fulfilled, (state, action) => {
        if (state.currentTrip) {
          state.currentTrip = action.payload;
        }
      });
  },
});

export const { setCurrentTrip } = tripSlice.actions;
export default tripSlice.reducer; 