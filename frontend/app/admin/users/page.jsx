"use client";

import { useEffect, useState } from "react";
import {
  Loader2, AlertCircle, Users, Search, ShieldAlert, ShieldCheck,
  Trash2, ArrowUpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import ThemedAlert from "@/components/ThemedAlert";

const ROLE_OPTIONS = [
  { key: "", label: "All roles" },
  { key: "PLAYER", label: "Players" },
  { key: "SCOUT", label: "Scouts" },
  { key: "INSTITUTION", label: "Institutions" },
  { key: "ADMIN", label: "Admins" },
];

const STATUS_OPTIONS = [
  { key: "", label: "Any status" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "inactive", label: "Inactive" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getUsers({
        role: role || undefined,
        status: status || undefined,
        search: search || undefined,
      });
      setUsers(data.items || []);
    } catch (e) {
      setError(e.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuspend = (user) => {
    setConfirmState({
      title: "Suspend user?",
      body: `${user.email} will be blocked from logging in. You can unsuspend later.`,
      confirmLabel: "Suspend",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.suspendUser(user.id, "Suspended by admin");
          setAlert({ title: "User suspended", variant: "success" });
          load();
        } catch (e) {
          setAlert({ title: "Error", body: e.message, variant: "danger" });
        }
      },
    });
  };

  const handleUnsuspend = async (user) => {
    try {
      await api.unsuspendUser(user.id);
      setAlert({ title: "User reinstated", variant: "success" });
      load();
    } catch (e) {
      setAlert({ title: "Error", body: e.message, variant: "danger" });
    }
  };

  const handlePromote = (user) => {
    setConfirmState({
      title: "Promote to ADMIN?",
      body: `${user.email} will gain full admin access. This is not reversible from this UI.`,
      confirmLabel: "Promote",
      onConfirm: async () => {
        try {
          await api.promoteUser(user.id);
          setAlert({ title: "User promoted to ADMIN", variant: "success" });
          load();
        } catch (e) {
          setAlert({ title: "Error", body: e.message, variant: "danger" });
        }
      },
    });
  };

  const handleDelete = (user) => {
    setConfirmState({
      title: "Delete user?",
      body: `${user.email} will be permanently deleted. Related data may also be removed. This cannot be undone.`,
      confirmLabel: "Delete permanently",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.deleteUser(user.id, "Deleted by admin");
          setAlert({ title: "User deleted", variant: "success" });
          load();
        } catch (e) {
          setAlert({ title: "Error", body: e.message, variant: "danger" });
        }
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-white/60 mt-1">
          Search, filter, and manage all platform accounts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <div className="sm:col-span-2">
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search by email..."
              className="w-full rounded-md border border-white/15 bg-[#242030] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF6A]/60"
            />
          </div>
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-white/15 bg-[#242030] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-white/15 bg-[#242030] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF6A]/60"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <button
          onClick={load}
          className="rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
        >
          Apply filters
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#D4AF6A] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#242030] rounded-xl border border-white/10 p-12 text-center">
          <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No users match</p>
          <p className="text-white/50 text-sm">Try clearing filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#242030] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1C1928] text-left text-white/50 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const suspended = u.is_suspended;
                  return (
                    <tr key={u.id} className="border-t border-white/5">
                      <td className="px-4 py-3 text-white/90 text-sm">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4AF6A]/15 text-[#D4AF6A] font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            suspended
                              ? "bg-red-500/20 text-red-400"
                              : u.is_active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {suspended ? "Suspended" : u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-end flex-wrap">
                          {suspended ? (
                            <button
                              onClick={() => handleUnsuspend(u)}
                              className="text-xs text-green-400 hover:text-green-300 inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Unsuspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(u)}
                              className="text-xs text-yellow-400 hover:text-yellow-300 inline-flex items-center gap-1"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" /> Suspend
                            </button>
                          )}
                          {u.role !== "ADMIN" && (
                            <button
                              onClick={() => handlePromote(u)}
                              className="text-xs text-[#D4AF6A] hover:text-[#c9a45f] inline-flex items-center gap-1"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" /> Promote
                            </button>
                          )}
                          {u.role !== "ADMIN" && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}