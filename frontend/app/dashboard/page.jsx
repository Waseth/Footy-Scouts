"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Trophy, Users, Calendar, CreditCard, Settings,
  LogOut, ShieldCheck, Star, Eye, Image as ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileCompleteness from "@/components/ProfileCompleteness";
import PremiumCTA from "@/components/PremiumCTA";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await api.getMe();
        setUser(userData);
        setIsAdmin(userData.role === "ADMIN");

        try {
          const subData = await api.getMySubscription();
          setSubscription(subData.subscription);
        } catch {}

        if (userData.role === "PLAYER") {
          try {
            const res = await api.request("/players/profile");
            setProfile(res.data.player);
          } catch {
            setProfile(null);
          }
        } else if (userData.role === "SCOUT") {
          try {
            const res = await api.request("/scouts/profile");
            setProfile(res.data.scout);
          } catch {
            setProfile(null);
          }
        }

        if (userData.role === "ADMIN") {
          const adminStats = await api.getAdminDashboard();
          setStats(adminStats);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await api.logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isPremium = subscription?.is_premium;
  const isPlayer  = user?.role === "PLAYER";
  const isScout   = user?.role === "SCOUT";

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.email?.split("@")[0] || "User"}!
          </h1>
          <p className="text-white/60 mt-1">
            {isAdmin ? "Admin Dashboard" : `${user?.role || "User"} Dashboard`}
          </p>
        </div>

        {/* Profile completeness — always shown for player/scout, even with no profile */}
        {(isPlayer || isScout) && (
          <div className="mb-8">
            <ProfileCompleteness
              profile={profile || {}}
              role={user.role}
              onActionHref="/dashboard/profile"
            />
          </div>
        )}

        {/* Premium nudge */}
        {!isPremium && !isAdmin && <PremiumCTA variant="banner" />}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Role"     value={user?.role || "—"}           icon={User} />
          <StatCard
            label="Plan"
            value={subscription?.plan || "FREE"}
            icon={Star}
            highlight={isPremium}
          />
          <StatCard
            label="Status"
            value={user?.is_active ? "Active" : "Inactive"}
            icon={ShieldCheck}
            green={user?.is_active}
          />
          <StatCard
            label="Verified"
            value={user?.is_verified ? "Yes" : "No"}
            icon={Eye}
            green={user?.is_verified}
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {isPlayer && (
            <>
              <ActionCard
                href="/dashboard/profile"
                icon={User}
                title="My Profile"
                subtitle="View and edit your player profile"
              />
              <ActionCard
                href="/dashboard/media"
                icon={ImageIcon}
                title="Highlights"
                subtitle="Upload images, videos, and PDFs"
              />
              <ActionCard
                href="/tournaments"
                icon={Calendar}
                title="Tournaments"
                subtitle="Browse and register for tournaments"
              />
            </>
          )}

          {isScout && (
            <>
              <ActionCard
                href="/dashboard/profile"
                icon={User}
                title="My Profile"
                subtitle="View and edit your scout profile"
              />
              <ActionCard
                href="/players"
                icon={Users}
                title="Find Players"
                subtitle="Search for talented players"
              />
              <ActionCard
                href="/tournaments"
                icon={Trophy}
                title="Tournaments"
                subtitle="Discover talent at tournaments"
              />
            </>
          )}

          {isAdmin && (
            <ActionCard
              href="/admin"
              icon={Settings}
              title="Admin Panel"
              subtitle="Manage users, approvals, and content"
            />
          )}
        </div>

        {isAdmin && stats && (
          <div className="bg-[#242030] rounded-lg p-6 border border-white/10 mb-8">
            <h2 className="text-white font-semibold text-lg mb-4">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat label="Total Users"  value={stats.users?.total || 0} />
              <MiniStat label="Players"      value={stats.users?.players || 0} />
              <MiniStat label="Scouts"       value={stats.users?.scouts || 0} />
              <MiniStat label="Tournaments"  value={stats.tournaments || 0} />
            </div>
          </div>
        )}

        {!isAdmin && (
          <div className="mb-8">
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-5 py-2.5 text-sm font-medium hover:bg-[#D4AF6A] hover:text-[#1C1928] transition"
            >
              <CreditCard className="w-4 h-4" />
              {isPremium ? "Manage subscription" : "Upgrade to premium"}
            </Link>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
      <Footer />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, green, highlight }) {
  const iconColor = green
    ? "text-green-500"
    : highlight
    ? "text-[#D4AF6A]"
    : "text-[#D4AF6A]";
  return (
    <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">{label}</p>
          <p className="text-white font-semibold text-lg">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, subtitle }) {
  return (
    <Link
      href={href}
      className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 hover:shadow-lg hover:shadow-[#D4AF6A]/5 transition-all"
    >
      <div className="flex items-center gap-4">
        <Icon className="text-[#D4AF6A] w-8 h-8" />
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-white/60 text-sm">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-white/60 text-sm">{label}</p>
      <p className="text-white font-bold text-2xl">{value}</p>
    </div>
  );
}