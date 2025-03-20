import { configureStore } from '@reduxjs/toolkit';
import tripReducer from './slices/tripSlice';
import logReducer from './slices/logSlice';

export const store = configureStore({
  reducer: {
    trip: tripReducer,
    log: logReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 