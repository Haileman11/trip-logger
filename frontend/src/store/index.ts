import { configureStore } from '@reduxjs/toolkit';
import tripReducer from './slices/tripSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    trips: tripReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 