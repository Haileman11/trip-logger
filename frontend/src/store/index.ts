import { configureStore } from '@reduxjs/toolkit';
import tripReducer, { TripState } from './slices/tripSlice';
import authReducer, { AuthState } from './slices/authSlice';
import logReducer, { LogState } from './slices/logSlice';

export interface RootState {
  trips: TripState;
  auth: AuthState;
  logs: LogState;
}

export const store = configureStore({
  reducer: {
    trips: tripReducer,
    auth: authReducer,
    logs: logReducer,
  },
});

export type AppDispatch = typeof store.dispatch; 