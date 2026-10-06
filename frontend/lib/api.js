// lib/api.js - API service for connecting to backend

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://footy-scouts-production.up.railway.app/api/v1";

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token");
    }
  }

  // Read the freshest token — from memory, then localStorage.
  getToken() {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Some endpoints (204) return no body; guard against JSON parse crash.
    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      throw new Error(
        (data && (data.error || data.message)) || "Request failed"
      );
    }

    return data;
  }

  // ── Auth ──
  async register(email, password, role) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
  }

  async login(email, password) {
    const result = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result.data?.access_token) {
      this.setToken(result.data.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem("refresh_token", result.data.refresh_token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
      }
    }
    return result;
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore errors on logout
    }
    this.clearToken();
  }

  async getMe() {
    const result = await this.request("/auth/me");
    return result.data.user;
  }

  async refreshToken() {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refresh_token")
        : null;
    if (!refreshToken) throw new Error("No refresh token");

    const result = await this.request("/auth/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    this.setToken(result.data.access_token);
    return result.data.access_token;
  }

  // ── Players ──
  async getPlayers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append("name", params.search);
    if (params.position) query.append("position", params.position);
    if (params.nationality) query.append("country", params.nationality);
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));

    const result = await this.request(`/search/players?${query.toString()}`);
    return result.data;
  }

  async getPlayer(id) {
    const result = await this.request(`/players/${id}`);
    return result.data.player;
  }

  async getPlayerMedia(playerId) {
    const result = await this.request(`/players/${playerId}/media`);
    return result.data;
  }

  async createPlayerProfile(data) {
    const result = await this.request("/players/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data.player;
  }

  async updatePlayerProfile(data) {
    const result = await this.request("/players/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result.data.player;
  }

  // ── Scouts ──
  async getScouts(params = {}) {
    const query = new URLSearchParams();
    if (params.country) query.append("country", params.country);
    if (params.scout_type) query.append("scout_type", params.scout_type);
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));

    const result = await this.request(`/search/scouts?${query.toString()}`);
    return result.data;
  }

  async getScout(id) {
    const result = await this.request(`/scouts/${id}`);
    return result.data.scout;
  }

  async createScoutProfile(data) {
    const result = await this.request("/scouts/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data.scout;
  }

  // ── Scout contact (premium only) ──
  async contactScout(scoutId) {
    const result = await this.request(`/scouts/${scoutId}/contact`, {
      method: "POST",
    });
    return result.data;
  }

  // ── Tournaments ──
  async getTournaments(params = {}) {
    const query = new URLSearchParams();
    if (params.type) query.append("type", params.type);
    if (params.status) query.append("status", params.status);
    if (params.location) query.append("location", params.location);
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));

    const result = await this.request(`/tournaments?${query.toString()}`);
    return result.data;
  }

  async getTournament(id) {
    const result = await this.request(`/tournaments/${id}`);
    return result.data.tournament;
  }

  // ── Organizers ──
  async getMyOrganizerProfile() {
    const result = await this.request("/organizers/me");
    return result.data.organizer;
  }

  async createOrganizerProfile(data) {
    const result = await this.request("/organizers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data.organizer;
  }

  async updateOrganizerProfile(data) {
    const result = await this.request("/organizers", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result.data.organizer;
  }

  // ── Subscriptions ──
  async getSubscriptionPlans() {
    const result = await this.request("/subscriptions/plans");
    return result.data.plans;
  }

  async getMySubscription() {
    const result = await this.request("/subscriptions/my");
    return result.data;
  }

  async cancelSubscription() {
    const result = await this.request("/subscriptions/cancel", {
      method: "POST",
    });
    return result.data;
  }

  // ── Payments (Paystack) ──
  async initializePaystackSubscription(plan) {
    const result = await this.request("/payments/paystack/initialize", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
    return result.data; // { payment_id, reference, authorization_url, access_code, amount, currency }
  }

  async verifyPaystackPayment(reference) {
    const result = await this.request(
      `/payments/paystack/verify/${reference}`
    );
    return result.data; // { payment, subscription }
  }

  async getPaymentHistory() {
    const result = await this.request("/payments/history");
    return result.data.payments;
  }

  // ── Tournament payment stubs (Option 3) ──
  async initializeTeamEntryPayment(teamId, tournamentId) {
    const result = await this.request(
      "/payments/paystack/initialize/team-entry",
      {
        method: "POST",
        body: JSON.stringify({ team_id: teamId, tournament_id: tournamentId }),
      }
    );
    return result.data;
  }

  async initializeTournamentFinalPayment(tournamentId) {
    const result = await this.request(
      "/payments/paystack/initialize/tournament-final",
      {
        method: "POST",
        body: JSON.stringify({ tournament_id: tournamentId }),
      }
    );
    return result.data;
  }

  // ── Admin ──
  async getAdminDashboard() {
    const result = await this.request("/admin/dashboard");
    return result.data;
  }

  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.append("role", params.role);
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));

    const result = await this.request(`/admin/users?${query.toString()}`);
    return result.data;
  }

    // ── Notifications ──
  async getNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));
    const result = await this.request(`/notifications?${query.toString()}`);
    return result.data;
  }

  async getUnreadNotificationCount() {
    const result = await this.request("/notifications/unread-count");
    return result.data.count;
  }

  async markNotificationRead(id) {
    const result = await this.request(`/notifications/${id}/read`, { method: "POST" });
    return result.data.notification;
  }

  async markAllNotificationsRead() {
    return this.request("/notifications/read-all", { method: "POST" });
  }

  async deleteNotification(id) {
    return this.request(`/notifications/${id}`, { method: "DELETE" });
  }

  // ── Auth state helper (used by tiered UI) ──
  isAuthenticated() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
  }
}

// Export singleton
export const api = new ApiService(API_BASE_URL);

// For non-singleton usage
export default ApiService;