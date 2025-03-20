import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface Trip {
  id: number;
  current_location: {
    latitude: number;
    longitude: number;
  };
  pickup_location: {
    latitude: number;
    longitude: number;
  };
  dropoff_location: {
    latitude: number;
    longitude: number;
  };
  current_cycle_hours: number;
  status: string;
  stops: any[];
  log_sheets: any[];
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

export const createTrip = createAsyncThunk(
  'trip/createTrip',
  async (tripData: Omit<Trip, 'id' | 'status' | 'stops' | 'log_sheets'>) => {
    const response = await axios.post(`${API_URL}/api/trips/`, tripData);
    return response.data;
  }
);

export const planRoute = createAsyncThunk(
  'trip/planRoute',
  async ({ tripId, mapboxToken }: { tripId: number; mapboxToken: string }) => {
    const response = await axios.post(
      `${API_URL}/api/trips/${tripId}/plan_route/`,
      {},
      {
        headers: {
          'X-Mapbox-Token': mapboxToken,
        },
      }
    );
    return response.data;
  }
);

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    setCurrentTrip: (state, action) => {
      state.currentTrip = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.trips.push(action.payload);
        state.currentTrip = action.payload;
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create trip';
      })
      .addCase(planRoute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(planRoute.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.trips.findIndex((trip) => trip.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        if (state.currentTrip?.id === action.payload.id) {
          state.currentTrip = action.payload;
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