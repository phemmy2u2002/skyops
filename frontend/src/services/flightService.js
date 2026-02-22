import api from './api.js';

export const flightService = {
  /**
   * Fetch all flights, optionally filtered by status or date range.
   * @param {Object} params - Query parameters (status, date, page, limit)
   */
  async getFlights(params = {}) {
    const { data } = await api.get('/flights', { params });
    return data;
  },

  /**
   * Fetch a single flight by ID.
   */
  async getFlight(id) {
    const { data } = await api.get(`/flights/${id}`);
    return data;
  },

  /**
   * Create a new flight.
   * @param {Object} payload - Flight data
   */
  async createFlight(payload) {
    const { data } = await api.post('/flights', payload);
    return data;
  },

  /**
   * Update an existing flight.
   * @param {string} id - Flight ID
   * @param {Object} updates - Partial flight data to update
   */
  async updateFlight(id, updates) {
    const { data } = await api.patch(`/flights/${id}`, updates);
    return data;
  },

  /**
   * Delete a flight by ID.
   */
  async deleteFlight(id) {
    await api.delete(`/flights/${id}`);
    return id;
  },

  /**
   * Update the operational status of a flight.
   */
  async updateFlightStatus(id, status) {
    const { data } = await api.patch(`/flights/${id}/status`, { status });
    return data;
  },

  /**
   * Get the live position/tracking data for an airborne flight.
   */
  async getFlightTracking(id) {
    const { data } = await api.get(`/flights/${id}/tracking`);
    return data;
  },

  /**
   * Release a flight for departure (dispatcher action).
   */
  async releaseFlight(id, remarks = '') {
    const { data } = await api.post(`/flights/${id}/release`, { remarks });
    return data;
  },
};
