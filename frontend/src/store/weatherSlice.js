import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { weatherService } from '../services/weatherService.js';

// ─── Async thunks ──────────────────────────────────────────────────────────────

export const fetchWeather = createAsyncThunk(
  'weather/fetchOne',
  async (icao, { rejectWithValue }) => {
    try {
      const data = await weatherService.getWeather(icao);
      return { icao: icao.toUpperCase(), ...data };
    } catch (err) {
      return rejectWithValue({ icao: icao.toUpperCase(), error: err.message });
    }
  }
);

export const fetchWeatherBatch = createAsyncThunk(
  'weather/fetchBatch',
  async (icaos, { rejectWithValue }) => {
    try {
      const data = await weatherService.getWeatherBatch(icaos);
      return data; // { KJFK: { metar, taf }, ... }
    } catch (err) {
      // Fall back: mark each icao with an error
      return rejectWithValue({ icaos, error: err.message });
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const weatherSlice = createSlice({
  name: 'weather',
  initialState: {
    byIcao: {}, // { [ICAO]: { metar, taf, loading, error } }
  },
  reducers: {
    clearWeather(state, action) {
      delete state.byIcao[action.payload];
    },
  },
  extraReducers: (builder) => {
    // fetchWeather (single)
    builder
      .addCase(fetchWeather.pending, (state, action) => {
        const icao = action.meta.arg.toUpperCase();
        state.byIcao[icao] = { ...state.byIcao[icao], loading: true, error: null };
      })
      .addCase(fetchWeather.fulfilled, (state, action) => {
        const { icao, metar, taf } = action.payload;
        state.byIcao[icao] = { metar, taf, loading: false, error: null };
      })
      .addCase(fetchWeather.rejected, (state, action) => {
        const { icao, error } = action.payload ?? {};
        if (icao) {
          state.byIcao[icao] = { ...state.byIcao[icao], loading: false, error };
        }
      });

    // fetchWeatherBatch
    builder
      .addCase(fetchWeatherBatch.pending, (state, action) => {
        action.meta.arg.forEach((icao) => {
          const key = icao.toUpperCase();
          state.byIcao[key] = { ...state.byIcao[key], loading: true, error: null };
        });
      })
      .addCase(fetchWeatherBatch.fulfilled, (state, action) => {
        Object.entries(action.payload).forEach(([icao, wx]) => {
          state.byIcao[icao.toUpperCase()] = {
            metar: wx.metar ?? null,
            taf: wx.taf ?? null,
            loading: false,
            error: null,
          };
        });
      })
      .addCase(fetchWeatherBatch.rejected, (state, action) => {
        const { icaos, error } = action.payload ?? {};
        icaos?.forEach((icao) => {
          const key = icao.toUpperCase();
          state.byIcao[key] = { ...state.byIcao[key], loading: false, error };
        });
      });
  },
});

export const { clearWeather } = weatherSlice.actions;
export default weatherSlice.reducer;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectWeatherByIcao = (state) => state.weather.byIcao;
export const selectWeatherForStation = (icao) => (state) =>
  state.weather.byIcao[icao?.toUpperCase()];
