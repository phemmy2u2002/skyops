import { configureStore } from '@reduxjs/toolkit';
import flightReducer from './flightSlice.js';
import weatherReducer from './weatherSlice.js';
import authReducer from './authSlice.js';

export const store = configureStore({
  reducer: {
    flights: flightReducer,
    weather: weatherReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Dates stored as ISO strings are safe; ignore if raw Date objects are ever used
        ignoredActionPaths: ['payload.scheduledDeparture', 'payload.scheduledArrival'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});
