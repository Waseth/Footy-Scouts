"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Bell, CheckCheck, Trash2, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemedAlert from "@/components/ThemedAlert";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [actioning, setActioning] = useState(null);

  const load = async () => {
    try {
      const result = await api.getNotifications({ per_page: 50 });
      setNotifications(result.items || []);
    } catch (e) {
      if (e.message?.toLowerCase().includes("unauthorized")) {
        router.push("/login");
        return;
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    setActioning(n.id);
    try {
      await api.markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setActioning(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = (n) => {
    setAlert({
      title: "Delete notification?",
      body: "This notification will be permanently removed.",
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await api.deleteNotification(n.id);
          setNotifications((prev) => prev.filter((x) => x.id !== n.id));
        } catch (e) {
          setError(e.message);
        }
      },
    });
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            <p className="text-white/60 mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : notifications.length === 0
                ? "Nothing here yet"
                : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/10 transition"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/10 bg-[#242030]">
            <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No notifications yet.</p>
            <p className="text-white/40 text-sm mt-2">
              You'll see updates here when scouts, captains, or admins
              interact with you.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`group rounded-lg border p-4 transition ${
                  n.is_read
                    ? "border-white/10 bg-[#242030]"
                    : "border-[#D4AF6A]/30 bg-[#D4AF6A]/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      n.is_read ? "bg-white/20" : "bg-[#D4AF6A]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className="text-white font-medium text-sm">
                        {n.title}
                      </h3>
                      <span className="text-xs text-white/40 shrink-0">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm mt-1 leading-relaxed">
                      {n.body}
                    </p>

                    {n.related_type && n.related_id && (
                      <Link
                        href={
                          n.related_type === "Team"
                            ? `/teams/${n.related_id}`
                            : "#"
                        }
                        className="inline-flex items-center gap-1 text-[#D4AF6A] text-xs mt-2 hover:underline"
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n)}
                        disabled={actioning === n.id}
                        className="p-1.5 rounded-md text-white/40 hover:text-[#D4AF6A] hover:bg-white/5 transition disabled:opacity-50"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n)}
                      className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-white/5 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      <ThemedAlert state={alert} onClose={() => setAlert(null)} />
    </div>
  );
}