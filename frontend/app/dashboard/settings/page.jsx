"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertTriangle, Trash2, X, Eye, EyeOff,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Delete flow state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1=confirm intent, 2=password
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        setUser(me);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const openDelete = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setPassword("");
    setConfirmText("");
    setError("");
  };

  const closeDelete = () => {
    if (deleting) return; // don't close mid-delete
    setShowDeleteModal(false);
    setPassword("");
    setConfirmText("");
    setError("");
  };

  const handleDelete = async () => {
    if (!password) {
      setError("Please enter your password to confirm.");
      return;
    }
    setError("");
    setDeleting(true);
    try {
      await api.deleteAccount(password);
      // Account deleted + tokens cleared. Send to home.
      window.location.href = "/?deleted=1";
    } catch (e) {
      setError(e.message || "Could not delete account");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-white/60 mb-8">
          Manage your account preferences and security.
        </p>

        {/* Account info */}
        <div className="rounded-2xl border border-white/10 bg-[#242030] p-6 mb-6">
          <h2 className="text-white font-semibold mb-3">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Role</span>
              <span className="text-white">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Premium</span>
              <span className={user?.is_premium ? "text-[#D4AF6A]" : "text-white/60"}>
                {user?.is_premium ? "Active" : "Free"}
              </span>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-lg bg-red-500/15 p-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Danger zone</h2>
              <p className="text-white/60 text-sm mt-1">
                Once you delete your account, there is no going back. Your profile,
                media, and data will be permanently removed.
              </p>
            </div>
          </div>
          <button
            onClick={openDelete}
            className="inline-flex items-center gap-2 rounded-md bg-red-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-red-600 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete my account
          </button>
        </div>
      </div>
      <Footer />

      {/* ─── Delete confirmation modal ─── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={closeDelete}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#242030] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step 1 — confirm intent */}
            {deleteStep === 1 && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <button
                    onClick={closeDelete}
                    className="text-white/50 hover:text-white transition"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">
                  Delete your account?
                </h3>
                <p className="text-white/70 text-sm mb-5 leading-relaxed">
                  This will permanently delete your account, profile, media, and
                  remove you from all teams. This action cannot be undone.
                </p>
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 mb-5 text-xs text-red-300">
                  <p className="mb-1 font-medium">Before you continue:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>You cannot captain a team with active tournament entries</li>
                    <li>You cannot be organizing an active tournament</li>
                    <li>Payments are retained for accounting (unlinked from you)</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeDelete}
                    className="flex-1 rounded-md border border-white/20 text-white px-4 py-2.5 text-sm hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="flex-1 rounded-md bg-red-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-red-600 transition"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 2 — password confirmation */}
            {deleteStep === 2 && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <button
                    onClick={closeDelete}
                    className="text-white/50 hover:text-white transition"
                    disabled={deleting}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">
                  Confirm with your password
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  Type <span className="font-medium text-white">DELETE</span> to confirm, then enter
                  your password.
                </p>

                {error && (
                  <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
                    {error}
                  </div>
                )}

                <label className="block text-xs text-white/50 mb-1">
                  Type DELETE
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full mb-3 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/60"
                />

                <label className="block text-xs text-white/50 mb-1">
                  Password
                </label>
                <div className="relative mb-5">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white outline-none focus:border-red-500/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeDelete}
                    disabled={deleting}
                    className="flex-1 rounded-md border border-white/20 text-white px-4 py-2.5 text-sm hover:bg-white/5 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || confirmText !== "DELETE" || !password}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-red-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete forever
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}