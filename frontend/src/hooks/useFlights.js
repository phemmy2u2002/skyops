import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFlights,
  createFlight,
  updateFlight,
  deleteFlight,
  selectAllFlights,
  selectActiveFlights,
  selectFlightStats,
  selectFlightsLoading,
  selectFlightsError,
} from '../store/flightSlice.js';

/**
 * Custom hook that provides flight data and dispatch actions.
 * Automatically fetches flights on first mount.
 *
 * @param {Object} options
 * @param {boolean} options.autoFetch - Whether to fetch flights on mount (default: true)
 * @param {Object} options.params - Query parameters forwarded to the API
 */
export function useFlights({ autoFetch = true, params = {} } = {}) {
  const dispatch = useDispatch();
  const flights = useSelector(selectAllFlights);
  const activeFlights = useSelector(selectActiveFlights);
  const stats = useSelector(selectFlightStats);
  const loading = useSelector(selectFlightsLoading);
  const error = useSelector(selectFlightsError);

  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchFlights(params));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, autoFetch]);

  return {
    flights,
    activeFlights,
    stats,
    loading,
    error,
    refetch: () => dispatch(fetchFlights(params)),
    addFlight: (payload) => dispatch(createFlight(payload)),
    editFlight: (id, updates) => dispatch(updateFlight({ id, updates })),
    removeFlight: (id) => dispatch(deleteFlight(id)),
  };
}
