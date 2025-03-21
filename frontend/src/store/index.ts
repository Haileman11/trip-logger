import { configureStore } from '@reduxjs/toolkit';
import tripReducer from './tripSlice';
import logReducer from './logSlice';

export const store = configureStore({
  reducer: {
    trips: tripReducer,
    logs: logReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 