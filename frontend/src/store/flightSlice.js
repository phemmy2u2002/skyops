import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { flightService } from '../services/flightService.js';
import { notamService } from '../services/notamService.js';

// ─── Async thunks ──────────────────────────────────────────────────────────────

export const fetchFlights = createAsyncThunk(
  'flights/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await flightService.getFlights(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createFlight = createAsyncThunk(
  'flights/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await flightService.createFlight(payload);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateFlight = createAsyncThunk(
  'flights/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await flightService.updateFlight(id, updates);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteFlight = createAsyncThunk(
  'flights/delete',
  async (id, { rejectWithValue }) => {
    try {
      await flightService.deleteFlight(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchNotams = createAsyncThunk(
  'flights/fetchNotams',
  async ({ icao, params }, { rejectWithValue }) => {
    try {
      return await notamService.getNotams(icao, params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  items: [],
  notams: [],
  loading: false,
  notamsLoading: false,
  error: null,
  notamsError: null,
};

const flightSlice = createSlice({
  name: 'flights',
  initialState,
  reducers: {
    updateFlightLocally(state, action) {
      const idx = state.items.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchFlights
    builder
      .addCase(fetchFlights.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFlights.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFlights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createFlight
    builder
      .addCase(createFlight.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createFlight.rejected, (state, action) => {
        state.error = action.payload;
      });

    // updateFlight
    builder
      .addCase(updateFlight.fulfilled, (state, action) => {
        const idx = state.items.findIndex((f) => f.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateFlight.rejected, (state, action) => {
        state.error = action.payload;
      });

    // deleteFlight
    builder
      .addCase(deleteFlight.fulfilled, (state, action) => {
        state.items = state.items.filter((f) => f.id !== action.payload);
      })
      .addCase(deleteFlight.rejected, (state, action) => {
        state.error = action.payload;
      });

    // fetchNotams
    builder
      .addCase(fetchNotams.pending, (state) => { state.notamsLoading = true; state.notamsError = null; })
      .addCase(fetchNotams.fulfilled, (state, action) => {
        state.notamsLoading = false;
        state.notams = action.payload;
      })
      .addCase(fetchNotams.rejected, (state, action) => {
        state.notamsLoading = false;
        state.notamsError = action.payload;
      });
  },
});

export const { updateFlightLocally, clearError } = flightSlice.actions;
export default flightSlice.reducer;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectAllFlights = (state) => state.flights.items;
export const selectFlightsLoading = (state) => state.flights.loading;
export const selectFlightsError = (state) => state.flights.error;
export const selectAllNotams = (state) => state.flights.notams;
export const selectNotamsLoading = (state) => state.flights.notamsLoading;
export const selectNotamsError = (state) => state.flights.notamsError;

export const selectActiveFlights = (state) =>
  state.flights.items.filter((f) =>
    ['AIRBORNE', 'BOARDING', 'DEPARTED'].includes(f.status)
  );

export const selectFlightStats = (state) => {
  const items = state.flights.items;
  const today = new Date().toDateString();

  const active = items.filter((f) => ['AIRBORNE', 'DEPARTED'].includes(f.status)).length;
  const delayed = items.filter((f) => f.status === 'DELAYED').length;
  const scheduledToday = items.filter(
    (f) => f.scheduledDeparture && new Date(f.scheduledDeparture).toDateString() === today
  ).length;
  const completedToday = items.filter(
    (f) =>
      f.status === 'LANDED' &&
      f.scheduledDeparture &&
      new Date(f.scheduledDeparture).toDateString() === today
  ).length;

  const statusCounts = items.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts).map(([name, count]) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    count,
  }));

  return { active, delayed, scheduledToday, completedToday, chartData };
};
