import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { LogSheet } from "../../types";
import { apiRequest } from "../../utils/api";

const API_URL = import.meta.env.VITE_API_URL || "";

export interface LogState {
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

export const fetchLogSheets = createAsyncThunk<LogSheet[], string>(
  "log/fetchLogSheets",
  async () => {
    const response = await apiRequest<LogSheet[]>(`/api/log-sheets/`);
    return response.data;
  }
);

export const createLogSheet = createAsyncThunk(
  "log/createLogSheet",
  async ({
    tripId,
    logData,
  }: {
    tripId: string;
    logData: Omit<LogSheet, "id" | "status" | "created_at" | "updated_at">;
  }) => {
    const response = await axios.post(
      `${API_URL}/api/trips/${tripId}/log-sheets/`,
      logData
    );
    return response.data;
  }
);

export const updateLogSheet = createAsyncThunk(
  "log/updateLogSheet",
  async ({
    tripId,
    logId,
    logData,
  }: {
    tripId: string;
    logId: string;
    logData: Partial<LogSheet>;
  }) => {
    const response = await axios.patch(
      `${API_URL}/api/trips/${tripId}/log-sheets/${logId}/`,
      logData
    );
    return response.data;
  }
);

const logSlice = createSlice({
  name: "log",
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
        state.error = action.error.message || "Failed to fetch log sheets";
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
        state.error = action.error.message || "Failed to create log sheet";
      })
      .addCase(updateLogSheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLogSheet.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.logSheets.findIndex(
          (log) => log.id === action.payload.id
        );
        if (index !== -1) {
          state.logSheets[index] = action.payload;
        }
        if (state.currentLogSheet?.id === action.payload.id) {
          state.currentLogSheet = action.payload;
        }
      })
      .addCase(updateLogSheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update log sheet";
      });
  },
});

export const { setCurrentLogSheet } = logSlice.actions;
export default logSlice.reducer;
