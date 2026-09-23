const API_BASE = '/api';

export const api = {
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getBookings(params) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.date) query.set('date', params.date);

    const url = `${API_BASE}/bookings${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  async getBooking(id) {
    const res = await fetch(`${API_BASE}/bookings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch booking details');
    return res.json();
  },

  async createBooking(booking) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!res.ok) throw new Error('Failed to create booking');
    return res.json();
  },

  async updateBooking(id, booking) {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!res.ok) {
      const error = new Error('Failed to update booking');
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  async updateBookingStatus(id, status, notes) {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) {
      const error = new Error('Failed to update status');
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  async deleteBooking(id) {
    const res = await fetch(`${API_BASE}/bookings/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const error = new Error('Failed to delete booking');
      error.status = res.status;
      throw error;
    }
  },

  async getDrivers() {
    const res = await fetch(`${API_BASE}/drivers`);
    if (!res.ok) throw new Error('Failed to fetch drivers');
    return res.json();
  },

  async updateDriver(driverId, driver) {
    const res = await fetch(`${API_BASE}/drivers/${driverId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    });
    if (!res.ok) throw new Error('Failed to update driver');
    return res.json();
  },

  async updateDriverDuty(driverId, action, hour) {
    const res = await fetch(`${API_BASE}/drivers/${driverId}/duty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, hour }),
    });
    if (!res.ok) throw new Error('Failed to update driver duty');
    return res.json();
  },

  async addDriverBreak(driverId, startHour, endHour, label = 'Break') {
    const res = await fetch(`${API_BASE}/drivers/${driverId}/breaks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'BREAK', startHour, endHour, label }),
    });
    if (!res.ok) throw new Error('Failed to add break');
    return res.json();
  },

  async getRoutes() {
    const res = await fetch(`${API_BASE}/routes`);
    if (!res.ok) throw new Error('Failed to fetch routes');
    return res.json();
  },

  async createRoute(route) {
    const res = await fetch(`${API_BASE}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(route),
    });
    if (!res.ok) throw new Error('Failed to create route');
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },
};
