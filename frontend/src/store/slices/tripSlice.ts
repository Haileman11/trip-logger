import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Location {
  latitude: number;
  longitude: number;
}

export interface Stop {
  location: Location;
  arrival_time?: string;
  departure_time?: string;
  status: string;
}

export interface Trip {
  id: number;
  status: string;
  current_location?: Location;
  pickup_location?: Location;
  dropoff_location?: Location;
  current_cycle_hours: number;
  stops?: Stop[];
}

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
  'trips/fetchTrip',
  async (tripId: string) => {
    const response = await fetch(`/api/trips/${tripId}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch trip');
    }
    return response.json();
  }
);

export const createTrip = createAsyncThunk(
  'trips/createTrip',
  async (tripData: Partial<Trip>) => {
    const response = await fetch('/api/trips/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
    });
    if (!response.ok) {
      throw new Error('Failed to create trip');
    }
    return response.json();
  }
);

export const planRoute = createAsyncThunk(
  'trips/planRoute',
  async ({ tripId }: { tripId: number }) => {
    const response = await fetch(`/api/trips/${tripId}/plan_route/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to plan route');
    }
    return response.json();
  }
);

const tripSlice = createSlice({
  name: 'trips',
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
            status: 'planned'
          };
        }
      })
      .addCase(planRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to plan route';
      });
  },
});

export const { setCurrentTrip } = tripSlice.actions;
export default tripSlice.reducer; 