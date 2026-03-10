import api from './api.js';

export const weatherService = {
  /**
   * Fetch the latest METAR for a single ICAO airport code.
   */
  async getMetar(icao) {
    const { data } = await api.get(`/weather/metar/${icao.toUpperCase()}`);
    return data;
  },

  /**
   * Fetch the latest TAF for a single ICAO airport code.
   */
  async getTaf(icao) {
    const { data } = await api.get(`/weather/taf/${icao.toUpperCase()}`);
    return data;
  },

  /**
   * Fetch METAR + TAF together for a single station.
   */
  async getWeather(icao) {
    const { data } = await api.get(`/weather/${icao.toUpperCase()}`);
    return data;
  },

  /**
   * Fetch weather for multiple ICAO stations in one request.
   * @param {string[]} icaos - Array of ICAO codes
   */
  async getWeatherBatch(icaos) {
    const stations = icaos.map((c) => c.toUpperCase()).join(',');
    const { data } = await api.get('/weather/batch', { params: { stations } });
    return data; // expected: Record<string, { metar, taf }>
  },

  /**
   * Fetch PIREPs (Pilot Reports) for a region.
   */
  async getPireps(params = {}) {
    const { data } = await api.get('/weather/pireps', { params });
    return data;
  },

  /**
   * Fetch SIGMETs and AIRMETs.
   */
  async getSigmets(params = {}) {
    const { data } = await api.get('/weather/sigmets', { params });
    return data;
  },

  /**
   * Fetch winds-aloft forecast for given altitudes and area.
   */
  async getWindsAloft(params = {}) {
    const { data } = await api.get('/weather/winds-aloft', { params });
    return data;
  },
};
