import { configureStore } from '@reduxjs/toolkit';
import tripReducer from './slices/tripSlice';

export const store = configureStore({
  reducer: {
    trip: tripReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 