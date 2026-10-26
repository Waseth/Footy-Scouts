"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, UserCheck, Building2, Trophy, CreditCard, Receipt,
  Image as ImageIcon, AlertCircle, Loader2, TrendingUp, Star,
} from "lucide-react";
import { api } from "@/lib/api";

function StatCard({ icon: Icon, label, value, href, accent }) {
  const body = (
    <div
      className={`rounded-xl border bg-[#242030] p-5 transition ${
        href ? "hover:border-[#D4AF6A]/50 cursor-pointer" : ""
      } ${
        accent === "gold"
          ? "border-[#D4AF6A]/30"
          : accent === "warn"
          ? "border-yellow-500/30"
          : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wide">{label}</p>
          <p className="text-white text-2xl font-bold mt-1">
            {value == null ? "—" : value.toLocaleString()}
          </p>
        </div>
        <Icon
          className={`w-5 h-5 ${
            accent === "gold"
              ? "text-[#D4AF6A]"
              : accent === "warn"
              ? "text-yellow-400"
              : "text-white/40"
          }`}
        />
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAdminDashboard();
        setStats(data);
      } catch (e) {
        setError(e.message || "Could not load admin stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        {error}
      </div>
    );
  }

  const u = stats?.users || {};
  const p = stats?.pending_approvals || {};
  const hasPending =
    (p.scouts || 0) > 0 ||
    (p.institutions || 0) > 0 ||
    (stats?.pending_payouts || 0) > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-white/60 mt-1">
          Platform overview and pending actions
        </p>
      </div>

      {hasPending && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-yellow-400 font-medium text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            You have pending items
          </p>
          <div className="text-sm text-white/70 space-y-1">
            {p.scouts > 0 && <p>· {p.scouts} scout(s) awaiting verification</p>}
            {p.institutions > 0 && (
              <p>· {p.institutions} institution(s) awaiting verification</p>
            )}
            {stats?.pending_payouts > 0 && (
              <p>
                · {stats.pending_payouts} organizer payout(s) pending —{" "}
                <Link href="/admin/payouts" className="text-[#D4AF6A] hover:underline">
                  review
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total users" value={u.total} />
        <StatCard icon={UserCheck} label="Players" value={u.players} />
        <StatCard icon={Building2} label="Institutions" value={u.institutions} />
        <StatCard icon={Trophy} label="Tournaments" value={stats?.tournaments} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Total revenue (KES)"
          value={Math.round(stats?.total_revenue_kes || 0)}
          accent="gold"
        />
        <StatCard
          icon={Star}
          label="Premium subs"
          value={stats?.subscriptions?.premium}
        />
        <StatCard
          icon={Receipt}
          label="Payouts pending"
          value={stats?.pending_payouts}
          href="/admin/payouts"
          accent="warn"
        />
        <StatCard
          icon={CreditCard}
          label="Payments"
          value={null}
          href="/admin/payments"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/payouts"
          className="rounded-xl border border-white/10 bg-[#242030] p-5 hover:border-[#D4AF6A]/50 transition group"
        >
          <Receipt className="w-6 h-6 text-[#D4AF6A] mb-3" />
          <h3 className="text-white font-semibold group-hover:text-[#D4AF6A] transition">
            Organizer payouts
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Mark pending payouts as paid, or flag failures.
          </p>
        </Link>
        <Link
          href="/admin/payments"
          className="rounded-xl border border-white/10 bg-[#242030] p-5 hover:border-[#D4AF6A]/50 transition group"
        >
          <CreditCard className="w-6 h-6 text-[#D4AF6A] mb-3" />
          <h3 className="text-white font-semibold group-hover:text-[#D4AF6A] transition">
            Payments & refunds
          </h3>
          <p className="text-white/60 text-sm mt-1">
            View all transactions. Refund team entry fees.
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-xl border border-white/10 bg-[#242030] p-5 hover:border-[#D4AF6A]/50 transition group"
        >
          <Users className="w-6 h-6 text-[#D4AF6A] mb-3" />
          <h3 className="text-white font-semibold group-hover:text-[#D4AF6A] transition">
            User management
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Suspend, promote, or delete user accounts.
          </p>
        </Link>
        <Link
          href="/admin/media"
          className="rounded-xl border border-white/10 bg-[#242030] p-5 hover:border-[#D4AF6A]/50 transition group"
        >
          <ImageIcon className="w-6 h-6 text-[#D4AF6A] mb-3" />
          <h3 className="text-white font-semibold group-hover:text-[#D4AF6A] transition">
            Media moderation
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Approve or reject player uploads.
          </p>
        </Link>
      </div>
    </div>
  );
}