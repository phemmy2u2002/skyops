import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api.js';

// ─── Async thunks ──────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem('skyops_token', data.token);
      return data; // { token, user }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return data; // { user }
    } catch (err) {
      localStorage.removeItem('skyops_token');
      return rejectWithValue(err.message);
    }
  }
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function loadPersistedUser() {
  try {
    const token = localStorage.getItem('skyops_token');
    if (!token) return null;
    // Decode the JWT payload (no signature verification — server validates)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp && payload.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem('skyops_token');
      return null;
    }
    return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

// ─── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: loadPersistedUser(),
    token: localStorage.getItem('skyops_token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('skyops_token');
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
      });

    // refreshSession
    builder
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(refreshSession.rejected, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

// ─── Selectors ─────────────────────────────────────────────────────────────────

export const selectIsAuthenticated = (state) => !!state.auth.token && !!state.auth.user;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
