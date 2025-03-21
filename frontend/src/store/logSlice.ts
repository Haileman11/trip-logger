import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Location {
  latitude: number;
  longitude: number;
}

export interface LogSheet {
  id: number;
  trip: number;
  start_time: string;
  end_time: string | null;
  start_location: Location;
  end_location: Location | null;
  start_cycle_hours: number;
  end_cycle_hours: number | null;
  status: string;
  remarks?: string;
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
  'logs/fetchLogSheets',
  async (tripId: string) => {
    const response = await fetch(`/api/trips/${tripId}/log-sheets/`);
    if (!response.ok) {
      throw new Error('Failed to fetch log sheets');
    }
    return response.json();
  }
);

export const fetchLogSheet = createAsyncThunk(
  'logs/fetchLogSheet',
  async ({ tripId, logId }: { tripId: string; logId: string }) => {
    const response = await fetch(`/api/trips/${tripId}/log-sheets/${logId}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch log sheet');
    }
    return response.json();
  }
);

export const updateLogSheet = createAsyncThunk(
  'logs/updateLogSheet',
  async ({ tripId, logId, data }: { tripId: string; logId: string; data: Partial<LogSheet> }) => {
    const response = await fetch(`/api/trips/${tripId}/log-sheets/${logId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update log sheet');
    }
    return response.json();
  }
);

export const createLogSheet = createAsyncThunk(
  'logs/createLogSheet',
  async ({ tripId, data }: { tripId: string; data: Partial<LogSheet> }) => {
    const response = await fetch(`/api/trips/${tripId}/log-sheets/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create log sheet');
    }
    return response.json();
  }
);

const logSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {},
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
      .addCase(fetchLogSheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogSheet.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLogSheet = action.payload;
      })
      .addCase(fetchLogSheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch log sheet';
      })
      .addCase(updateLogSheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLogSheet.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLogSheet = action.payload;
      })
      .addCase(updateLogSheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update log sheet';
      })
      .addCase(createLogSheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLogSheet.fulfilled, (state, action) => {
        state.loading = false;
        state.logSheets.push(action.payload);
      })
      .addCase(createLogSheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create log sheet';
      });
  },
});

export default logSlice.reducer; 