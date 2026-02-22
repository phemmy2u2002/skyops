import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginUser,
  logout,
  refreshSession,
  clearAuthError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../store/authSlice.js';

/**
 * Custom hook that exposes authentication state and actions.
 *
 * @param {Object} options
 * @param {boolean} options.requireAuth - Redirect to /login if not authenticated (default: false)
 */
export function useAuth({ requireAuth = false } = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // Attempt to restore session from persisted token on first load
  useEffect(() => {
    if (!isAuthenticated && localStorage.getItem('skyops_token')) {
      dispatch(refreshSession());
    }
  }, [dispatch, isAuthenticated]);

  // Guard: redirect unauthenticated users
  useEffect(() => {
    if (requireAuth && !isAuthenticated && !loading) {
      navigate('/login', { replace: true });
    }
  }, [requireAuth, isAuthenticated, loading, navigate]);

  async function login(credentials) {
    const result = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true });
    }
    return result;
  }

  function signOut() {
    dispatch(logout());
    navigate('/login', { replace: true });
  }

  function dismissError() {
    dispatch(clearAuthError());
  }

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout: signOut,
    dismissError,
    hasRole: (role) => user?.role === role,
    hasAnyRole: (...roles) => roles.includes(user?.role),
  };
}
