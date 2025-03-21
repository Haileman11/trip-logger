import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface LogSheet {
  id: number;
  trip_id: number;
  start_time: string;
  end_time: string | null;
  start_location: {
    latitude: number;
    longitude: number;
  };
  end_location: {
    latitude: number;
    longitude: number;
  } | null;
  start_cycle_hours: number;
  end_cycle_hours: number | null;
  status: string;
}

interface LogState {
  logSheets: LogSheet[];
  currentLogSheet: LogSheet | null;
  loading: boolean;
  error: string | null;
}

const initialState: LogState = {
  logSheets: [],
  currentLogSheet: null,
  loading: false,
  error: null,
};

export const fetchLogSheets = createAsyncThunk(
  'log/fetchLogSheets',
  async (tripId: number) => {
    const response = await axios.get(`${API_URL}/api/trips/${tripId}/log-sheets/`);
    return response.data;
  }
);

export const createLogSheet = createAsyncThunk(
  'log/createLogSheet',
  async ({ tripId, logData }: { tripId: number; logData: Omit<LogSheet, 'id' | 'status'> }) => {
    const response = await axios.post(`${API_URL}/api/trips/${tripId}/log-sheets/`, logData);
    return response.data;
  }
);

export const updateLogSheet = createAsyncThunk(
  'log/updateLogSheet',
  async ({ tripId, logId, logData }: { tripId: number; logId: number; logData: Partial<LogSheet> }) => {
    const response = await axios.patch(`${API_URL}/api/trips/${tripId}/log-sheets/${logId}/`, logData);
    return response.data;
  }
);

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    setCurrentLogSheet: (state, action) => {
      state.currentLogSheet = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogSheets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogSheets.fulfilled, (state, action) => {
        state.loading = false;
        state.logSheets = action.payload;
      })
      .addCase(fetchLogSheets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch log sheets';
      })
      .addCase(createLogSheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLogSheet.fulfilled, (state, action) => {
        state.loading = false;
        state.logSheets.push(action.payload);
        state.currentLogSheet = action.payload;
      })
      .addCase(createLogSheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create log sheet';
      })
      .addCase(updateLogSheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLogSheet.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.logSheets.findIndex((log) => log.id === action.payload.id);
        if (index !== -1) {
          state.logSheets[index] = action.payload;
        }
        if (state.currentLogSheet?.id === action.payload.id) {
          state.currentLogSheet = action.payload;
        }
      })
      .addCase(updateLogSheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update log sheet';
      });
  },
});

export const { setCurrentLogSheet } = logSlice.actions;
export default logSlice.reducer; 