import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Location {
  latitude: number;
  longitude: number;
}

interface Stop {
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

const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {},
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
      });
  },
});

export default tripSlice.reducer; 