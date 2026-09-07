// lib/api.js - API service for connecting to Railway backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://footy-scouts-production.up.railway.app/api/v1';

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  }

  // ── Auth ──
  async register(email, password, role) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  async login(email, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.data?.access_token) {
      this.setToken(result.data.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', result.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }
    return result;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors on logout
    }
    this.clearToken();
  }

  async getMe() {
    const result = await this.request('/auth/me');
    return result.data.user;
  }

  async refreshToken() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (!refreshToken) throw new Error('No refresh token');

    const result = await this.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${refreshToken}` },
    });
    this.setToken(result.data.access_token);
    return result.data.access_token;
  }

  // ── Players ──
  async getPlayers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('name', params.search);
    if (params.position) query.append('position', params.position);
    if (params.nationality) query.append('country', params.nationality);
    if (params.page) query.append('page', String(params.page));
    if (params.per_page) query.append('per_page', String(params.per_page));

    const result = await this.request(`/search/players?${query.toString()}`);
    return result.data;
  }

  async getPlayer(id) {
    const result = await this.request(`/players/${id}`);
    return result.data.player;
  }

  async createPlayerProfile(data) {
    const result = await this.request('/players/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.player;
  }

  async updatePlayerProfile(data) {
    const result = await this.request('/players/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data.player;
  }

  // ── Scouts ──
  async getScouts(params = {}) {
    const query = new URLSearchParams();
    if (params.country) query.append('country', params.country);
    if (params.scout_type) query.append('scout_type', params.scout_type);
    if (params.page) query.append('page', String(params.page));
    if (params.per_page) query.append('per_page', String(params.per_page));

    const result = await this.request(`/search/scouts?${query.toString()}`);
    return result.data;
  }

  async getScout(id) {
    const result = await this.request(`/scouts/${id}`);
    return result.data.scout;
  }

  async createScoutProfile(data) {
    const result = await this.request('/scouts/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data.scout;
  }

  // ── Tournaments ──
  async getTournaments(params = {}) {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.status) query.append('status', params.status);
    if (params.location) query.append('location', params.location);
    if (params.page) query.append('page', String(params.page));
    if (params.per_page) query.append('per_page', String(params.per_page));

    const result = await this.request(`/tournaments?${query.toString()}`);
    return result.data;
  }

  async getTournament(id) {
    const result = await this.request(`/tournaments/${id}`);
    return result.data.tournament;
  }

  // ── Subscriptions ──
  async getMySubscription() {
    const result = await this.request('/subscriptions/my');
    return result.data;
  }

  // ── Admin ──
  async getAdminDashboard() {
    const result = await this.request('/admin/dashboard');
    return result.data;
  }

  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', String(params.page));
    if (params.per_page) query.append('per_page', String(params.per_page));

    const result = await this.request(`/admin/users?${query.toString()}`);
    return result.data;
  }
}

// Export singleton
export const api = new ApiService(API_BASE_URL);

// For non-singleton usage
export default ApiService;