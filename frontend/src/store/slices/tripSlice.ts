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
}

const initialState: TripState = {
  trips: [],
  currentTrip: null,
  loading: false,
  error: null,
};

export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async () => {
    const response = await fetch('/api/trips/');
    if (!response.ok) {
      throw new Error('Failed to fetch trips');
    }
    return response.json();
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
        state.trips = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch trips';
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