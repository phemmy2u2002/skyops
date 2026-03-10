import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWeather,
  fetchWeatherBatch,
  clearWeather,
  selectWeatherForStation,
  selectWeatherByIcao,
} from '../store/weatherSlice.js';

/**
 * Hook to access weather data for a single ICAO station.
 *
 * @param {string} icao - ICAO airport code
 * @param {boolean} autoFetch - Fetch on mount (default: true)
 */
export function useWeather(icao, autoFetch = true) {
  const dispatch = useDispatch();
  const stationSelector = useCallback(selectWeatherForStation(icao), [icao]);
  const weather = useSelector(stationSelector);

  useEffect(() => {
    if (icao && autoFetch) {
      dispatch(fetchWeather(icao));
    }
  }, [dispatch, icao, autoFetch]);

  return {
    metar: weather?.metar ?? null,
    taf: weather?.taf ?? null,
    loading: weather?.loading ?? false,
    error: weather?.error ?? null,
    refresh: () => icao && dispatch(fetchWeather(icao)),
    clear: () => icao && dispatch(clearWeather(icao.toUpperCase())),
  };
}

/**
 * Hook to access weather data for multiple ICAO stations at once.
 *
 * @param {string[]} icaos - Array of ICAO airport codes
 * @param {boolean} autoFetch - Fetch on mount (default: true)
 */
export function useWeatherBatch(icaos = [], autoFetch = true) {
  const dispatch = useDispatch();
  const weatherMap = useSelector(selectWeatherByIcao);

  useEffect(() => {
    if (icaos.length && autoFetch) {
      dispatch(fetchWeatherBatch(icaos));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, autoFetch, icaos.join(',')]);

  return {
    weatherMap,
    refresh: () => icaos.length && dispatch(fetchWeatherBatch(icaos)),
    getStation: (icao) => weatherMap[icao?.toUpperCase()] ?? null,
  };
}
