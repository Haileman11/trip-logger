import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface LogSheet {
  id: number;
  trip: number;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  log_data: any;
}

interface LogState {
  logSheets: LogSheet[];
  loading: boolean;
  error: string | null;
}

const initialState: LogState = {
  logSheets: [],
  loading: false,
  error: null,
};

export const fetchLogSheets = createAsyncThunk(
  'log/fetchLogSheets',
  async (tripId: number) => {
    const response = await axios.get(`${API_URL}/api/log-sheets/?trip=${tripId}`);
    return response.data;
  }
);

const logSlice = createSlice({
  name: 'log',
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
      });
  },
});

export default logSlice.reducer; 