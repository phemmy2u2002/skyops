import api from './api.js';

export const notamService = {
  /**
   * Fetch NOTAMs for an ICAO aerodrome code.
   * @param {string} icao - 4-letter ICAO code
   * @param {Object} params - Optional filters (type, category, effectiveFrom)
   */
  async getNotams(icao, params = {}) {
    const { data } = await api.get(`/notams/${icao.toUpperCase()}`, { params });
    return data;
  },

  /**
   * Fetch NOTAMs for a route defined by origin and destination.
   */
  async getRouteNotams(originIcao, destIcao, params = {}) {
    const { data } = await api.get('/notams/route', {
      params: {
        origin: originIcao.toUpperCase(),
        destination: destIcao.toUpperCase(),
        ...params,
      },
    });
    return data;
  },

  /**
   * Fetch a single NOTAM by its identifier.
   */
  async getNotam(id) {
    const { data } = await api.get(`/notams/detail/${id}`);
    return data;
  },

  /**
   * Search NOTAMs using a free-text query or structured filters.
   */
  async searchNotams(query, params = {}) {
    const { data } = await api.get('/notams/search', {
      params: { q: query, ...params },
    });
    return data;
  },

  /**
   * Acknowledge a NOTAM as reviewed by the current dispatcher.
   */
  async acknowledgeNotam(id) {
    const { data } = await api.post(`/notams/${id}/acknowledge`);
    return data;
  },
};
