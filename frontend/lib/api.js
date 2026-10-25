// lib/api.js - API service for connecting to backend

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://footy-scouts-production.up.railway.app/api/v1";

// Endpoints that must NEVER auto-refresh (avoids loops)
const AUTH_NO_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.refreshPromise = null;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token");
    }
  }

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

  async request(endpoint, options = {}, _retry = false) {
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

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    const isAuthNoRefresh = AUTH_NO_REFRESH.some((p) => endpoint.startsWith(p));

    if (response.status === 401 && !_retry && !isAuthNoRefresh) {
      const refreshed = await this._refreshAccessToken();
      if (refreshed) {
        return this.request(endpoint, options, true);
      }
      this.clearToken();
      throw new Error(
        (data && (data.error || data.message)) || "Session expired"
      );
    }

    if (!response.ok) {
      throw new Error(
        (data && (data.error || data.message)) || "Request failed"
      );
    }

    return data;
  }

  async _refreshAccessToken() {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refresh_token")
            : null;
        if (!refreshToken) return false;

        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        if (!res.ok) return false;

        const data = await res.json();
        const newToken = data?.data?.access_token;
        if (!newToken) return false;

        this.setToken(newToken);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ── Auth ──
  async register(email, password, role) {
    const result = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
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
    } catch (e) {}
    this.clearToken();
  }

  async getMe() {
    const result = await this.request("/auth/me");
    return result.data.user;
  }

  async refreshToken() {
    const ok = await this._refreshAccessToken();
    if (!ok) throw new Error("No refresh token");
    return this.getToken();
  }

  async deleteAccount(password) {
    const result = await this.request("/auth/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    this.clearToken();
    return result;
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

  async updateMediaDetails(mediaId, { title, description }) {
    const result = await this.request(`/players/media/${mediaId}`, {
      method: "PATCH",
      body: JSON.stringify({ title, description }),
    });
    return result.data.media;
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

  async contactScout(scoutId) {
    const result = await this.request(`/scouts/${scoutId}/contact`, {
      method: "POST",
    });
    return result.data;
  }

  // ── Tournaments (public) ──
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
    return result.data;
  }

  // ── Tournament organizer ──
  async createTournament(data) {
    const result = await this.request("/tournaments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data.tournament;
  }

  async updateTournament(id, data) {
    const result = await this.request(`/tournaments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result.data.tournament;
  }

  async publishTournament(id) {
    const result = await this.request(`/tournaments/${id}/publish`, {
      method: "POST",
    });
    return result.data.tournament;
  }

  async cancelTournament(id) {
    const result = await this.request(`/tournaments/${id}/cancel`, {
      method: "POST",
    });
    return result.data.tournament;
  }

  async getMyTournaments(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));
    const result = await this.request(`/tournaments/my?${query.toString()}`);
    return result.data;
  }

  async inviteTeamToTournament(tournamentId, teamId) {
    const result = await this.request(
      `/tournaments/${tournamentId}/invite-team`,
      {
        method: "POST",
        body: JSON.stringify({ team_id: teamId }),
      }
    );
    return result.data.entry;
  }

  async approveTournamentTeam(tournamentId, entryId) {
    const result = await this.request(
      `/tournaments/${tournamentId}/teams/${entryId}/approve`,
      { method: "POST" }
    );
    return result.data.entry;
  }

  async rejectTournamentTeam(tournamentId, entryId) {
    return this.request(
      `/tournaments/${tournamentId}/teams/${entryId}/reject`,
      { method: "POST" }
    );
  }

  async getAvailableTeamsForTournament(tournamentId, q = "") {
    const query = new URLSearchParams();
    if (q) query.append("q", q);
    const result = await this.request(
      `/tournaments/${tournamentId}/available-teams?${query.toString()}`
    );
    return result.data.teams;
  }

  async closeTournamentRegistration(tournamentId) {
    const result = await this.request(
      `/tournaments/${tournamentId}/close-registration`,
      { method: "POST" }
    );
    return result.data;
  }

  async getTournamentPayout(tournamentId) {
    const result = await this.request(`/tournaments/${tournamentId}/payout`);
    return result.data.payout;
  }

  // ── Captain: tournament actions for their team ──
  async requestTeamToTournament(teamId, tournamentId) {
    const result = await this.request(`/teams/${teamId}/request-tournament`, {
      method: "POST",
      body: JSON.stringify({ tournament_id: tournamentId }),
    });
    return result.data.entry;
  }

  async acceptTournamentInvite(teamId, entryId) {
    const result = await this.request(
      `/teams/${teamId}/invitations/${entryId}/accept`,
      { method: "POST" }
    );
    return result.data.entry;
  }

  async declineTournamentInvite(teamId, entryId) {
    return this.request(
      `/teams/${teamId}/invitations/${entryId}/decline`,
      { method: "POST" }
    );
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

  // ── Payments ──
  async initializePaystackSubscription(plan) {
    const result = await this.request("/payments/paystack/initialize", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
    return result.data;
  }

  async verifyPaystackPayment(reference) {
    const result = await this.request(`/payments/paystack/verify/${reference}`);
    return result.data;
  }

  async getPaymentHistory() {
    const result = await this.request("/payments/history");
    return result.data.payments;
  }

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
    const result = await this.request(`/notifications/${id}/read`, {
      method: "POST",
    });
    return result.data.notification;
  }

  async markAllNotificationsRead() {
    return this.request("/notifications/read-all", { method: "POST" });
  }

  async deleteNotification(id) {
    return this.request(`/notifications/${id}`, { method: "DELETE" });
  }

  // ── Teams ──
  async createTeam(data) {
    const result = await this.request("/teams", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data.team;
  }

  async getMyTeams(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));
    const result = await this.request(`/teams/my?${query.toString()}`);
    return result.data;
  }

  async getAvailableTeams(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));
    const result = await this.request(`/teams/available?${query.toString()}`);
    return result.data;
  }

  async getTeam(id) {
    const result = await this.request(`/teams/${id}`);
    return result.data;
  }

  async updateTeam(id, data) {
    const result = await this.request(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result.data.team;
  }

  async deleteTeam(id) {
    return this.request(`/teams/${id}`, { method: "DELETE" });
  }

  async uploadTeamLogo(id, file) {
    const token = this.getToken();
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${this.baseUrl}/teams/${id}/logo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.data.logo_url;
  }

  async getTeamMembers(id) {
    const result = await this.request(`/teams/${id}/members`);
    return result.data;
  }

  async removeTeamMember(teamId, memberId) {
    return this.request(`/teams/${teamId}/members/${memberId}`, {
      method: "DELETE",
    });
  }

  async leaveTeam(teamId) {
    return this.request(`/teams/${teamId}/leave`, { method: "POST" });
  }

  async invitePlayer(teamId, userId, message = "") {
    const result = await this.request(`/teams/${teamId}/invite-player`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, message }),
    });
    return result.data.invitation;
  }

  async cancelInvitation(teamId, inviteId) {
    return this.request(`/teams/${teamId}/invitations/${inviteId}`, {
      method: "DELETE",
    });
  }

  async getJoinRequests(teamId) {
    const result = await this.request(`/teams/${teamId}/join-requests`);
    return result.data.requests;
  }

  async acceptJoinRequest(teamId, requestId) {
    return this.request(
      `/teams/${teamId}/join-requests/${requestId}/accept`,
      { method: "POST" }
    );
  }

  async rejectJoinRequest(teamId, requestId) {
    return this.request(
      `/teams/${teamId}/join-requests/${requestId}/reject`,
      { method: "POST" }
    );
  }

  async requestToJoinTeam(teamId, message = "") {
    const result = await this.request(`/teams/${teamId}/request-join`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    return result.data.request;
  }

  async searchPlayersForInvite(teamId, q = "") {
    const query = new URLSearchParams();
    if (teamId) query.append("team_id", teamId);
    if (q) query.append("q", q);
    const result = await this.request(
      `/teams/search-players?${query.toString()}`
    );
    return result.data.players;
  }

  // ── Invitations ──
  async getMyPlayerInvitations(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));
    const result = await this.request(`/invitations/player?${query.toString()}`);
    return result.data;
  }

  async acceptPlayerInvite(inviteId) {
    return this.request(`/invitations/player/${inviteId}/accept`, {
      method: "POST",
    });
  }

  async rejectPlayerInvite(inviteId) {
    return this.request(`/invitations/player/${inviteId}/reject`, {
      method: "POST",
    });
  }

  async getMyJoinRequests(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));
    const result = await this.request(
      `/invitations/my-join-requests?${query.toString()}`
    );
    return result.data;
  }

  async cancelJoinRequest(requestId) {
    return this.request(`/invitations/my-join-requests/${requestId}`, {
      method: "DELETE",
    });
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

  isAuthenticated() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
  }
}

export const api = new ApiService(API_BASE_URL);
export default ApiService;