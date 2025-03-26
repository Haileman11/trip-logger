import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { Trip, Location, Stop, LocationInputModel } from "../../types";
import { apiRequest } from "../../utils/api";

const API_BASE_URL = "http://localhost:8000";

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

interface TripResponse {
  results?: Trip[];
  count?: number;
  next: string | null;
  previous: string | null;
}

interface PlanRouteResponse {
  stops: Stop[];
  route: any;
  trip: Trip;
}

export const fetchTrips = createAsyncThunk(
  "trips/fetchTrips",
  async ({
    page = 1,
    sortBy = "id",
    sortOrder = "desc",
  }: { page?: number; sortBy?: string; sortOrder?: "asc" | "desc" } = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ordering: sortOrder === "desc" ? `-${sortBy}` : sortBy,
      });

      const response = await apiRequest<TripResponse | Trip[]>(
        `${API_BASE_URL}/api/trips/?${params.toString()}`
      );

      // Handle both paginated and non-paginated responses
      const trips = Array.isArray(response.data)
        ? response.data
        : (response.data as TripResponse).results || [];
      const pagination = Array.isArray(response.data)
        ? {
            count: trips.length,
            next: null,
            previous: null,
          }
        : {
            count: (response.data as TripResponse).count || trips.length,
            next: (response.data as TripResponse).next || null,
            previous: (response.data as TripResponse).previous || null,
          };

      return {
        trips,
        pagination,
      };
    } catch (error) {
      console.error("Error fetching trips:", error);
      throw error;
    }
  }
);

export const fetchTrip = createAsyncThunk(
  "trip/fetchTrip",
  async (tripId: string) => {
    const response = await apiRequest(`${API_BASE_URL}/api/trips/${tripId}`);
    return response.data as Trip;
  }
);

export const createTrip = createAsyncThunk(
  "trips/createTrip",
  async (tripData: {
    locations: LocationInputModel[];
    current_cycle_hours: number;
  }) => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/trips/`, {
        method: "POST",
        body: JSON.stringify(tripData),
      });

      console.log("Trip created response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in createTrip:", error);
      throw error;
    }
  }
);

export const planRoute = createAsyncThunk(
  "trips/planRoute",
  async (tripId: number, { getState }) => {
    const state = getState() as RootState;
    const trip = state.trips.currentTrip;

    const response = await apiRequest<PlanRouteResponse>(
      `${API_BASE_URL}/api/trips/${tripId}/plan_route/`,
      {
        method: "POST",
        body: JSON.stringify({
          locations: trip?.fuel_stop
            ? {
                latitude: trip.fuel_stop.latitude,
                longitude: trip.fuel_stop.longitude,
              }
            : undefined,
        }),
      }
    );
    return response.data;
  }
);

export const startTrip = createAsyncThunk(
  "trip/startTrip",
  async (tripId: string) => {
    const response = await apiRequest(
      `${API_BASE_URL}/api/trips/${tripId}/start_trip/`,
      {
        method: "POST",
      }
    );
    return response.data as Trip;
  }
);

export const updateStopStatus = createAsyncThunk(
  "trip/updateStopStatus",
  async ({
    tripId,
    stopId,
    status,
  }: {
    tripId: string;
    stopId: string;
    status: string;
  }) => {
    const response = await apiRequest(
      `${API_BASE_URL}/api/trips/${tripId}/update_stop_status/`,
      {
        method: "POST",
        body: JSON.stringify({ stop_id: stopId, status }),
      }
    );
    return response.data as Trip;
  }
);

export const createStop = createAsyncThunk(
  "trip/createStop",
  async ({ tripId, stopData }: { tripId: string; stopData: Partial<Stop> }) => {
    const response = await apiRequest(
      `${API_BASE_URL}/api/trips/${tripId}/create_stop/`,
      {
        method: "POST",
        body: JSON.stringify(stopData),
      }
    );
    return response.data as Trip;
  }
);

export const deleteStop = createAsyncThunk(
  "trip/deleteStop",
  async ({ tripId, stopId }: { tripId: string; stopId: string }) => {
    const response = await apiRequest(
      `${API_BASE_URL}/api/trips/${tripId}/delete_stop/?stop_id=${stopId}`,
      {
        method: "DELETE",
      }
    );
    return response.data as Trip;
  }
);

export const completeTrip = createAsyncThunk(
  "trip/completeTrip",
  async (tripId: string) => {
    const response = await apiRequest(
      `${API_BASE_URL}/api/trips/${tripId}/complete/`,
      {
        method: "POST",
      }
    );
    return response.data as Trip;
  }
);

export const deleteTrip = createAsyncThunk(
  "trip/deleteTrip",
  async (tripId: string) => {
    const response = await apiRequest(`${API_BASE_URL}/api/trips/${tripId}/`, {
      method: "DELETE",
    });
    return tripId;
  }
);

export const updateLocation = createAsyncThunk(
  "trip/updateLocation",
  async ({ tripId, location }: { tripId: string; location: Location }) => {
    const response = await apiRequest(
      `${API_BASE_URL}/api/trips/${tripId}/update_location/`,
      {
        method: "POST",
        body: JSON.stringify({ location }),
      }
    );
    return response.data as Trip;
  }
);

const tripSlice = createSlice({
  name: "trip",
  initialState,
  reducers: {
    setCurrentTrip: (state, action) => {
      state.currentTrip = action.payload;
    },
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
        state.error = action.error.message || "Failed to fetch trips";
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
        state.error = action.error.message || "Failed to fetch trip";
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
            status: action.payload.trip.status,
          };
        }
      })
      .addCase(planRoute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to plan route";
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
        state.error = action.error.message || "Failed to start trip";
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
        state.error = action.error.message || "Failed to update stop status";
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
        state.error = action.error.message || "Failed to create stop";
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
        state.error = action.error.message || "Failed to delete stop";
      })
      .addCase(completeTrip.fulfilled, (state, action) => {
        if (state.currentTrip) {
          state.currentTrip = action.payload;
        }
      })
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.trips = state.trips.filter(
          (trip) => trip.id.toString() !== action.payload
        );
        if (state.currentTrip?.id.toString() === action.payload) {
          state.currentTrip = null;
        }
      })
      // .addCase(updateLocation.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      // .addCase(updateLocation.fulfilled, (state, action) => {
      //   state.loading = false;
      //   if (state.currentTrip) {
      //     state.currentTrip = action.payload;
      //   }
      // })
      .addCase(updateLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update location";
      });
  },
});

export const { setCurrentTrip } = tripSlice.actions;
export default tripSlice.reducer;
