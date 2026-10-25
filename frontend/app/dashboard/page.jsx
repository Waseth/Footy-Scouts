"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Trophy, Users, Calendar, CreditCard, Settings,
  LogOut, Image as ImageIcon, Shield, Bell,
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
  const [myTeamsCount, setMyTeamsCount] = useState(null);
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [myTournamentsCount, setMyTournamentsCount] = useState(null);

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

        Promise.allSettled([
          api.getMyTeams({ per_page: 1 }),
          api.getMyPlayerInvitations({ per_page: 1 }),
          api.getMyTournaments({ per_page: 1 }),
        ]).then(([teamsRes, invRes, tourRes]) => {
          if (teamsRes.status === "fulfilled") setMyTeamsCount(teamsRes.value.total || 0);
          if (invRes.status === "fulfilled") setInvitationsCount(invRes.value.total || 0);
          if (tourRes.status === "fulfilled") setMyTournamentsCount(tourRes.value.total || 0);
        });

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
  const isPlayer = user?.role === "PLAYER";
  const isScout = user?.role === "SCOUT";

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

        {(isPlayer || isScout) && (
          <div className="mb-8">
            <ProfileCompleteness
              profile={profile || {}}
              role={user.role}
              onActionHref="/dashboard/profile"
            />
          </div>
        )}

        {!isPremium && !isAdmin && <PremiumCTA variant="banner" />}

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
                href="/dashboard/teams"
                icon={Shield}
                title="My Teams"
                subtitle={
                  myTeamsCount === null
                    ? "Teams you captain or join"
                    : `${myTeamsCount} team${myTeamsCount !== 1 ? "s" : ""}`
                }
                badge={myTeamsCount}
              />
              <ActionCard
                href="/dashboard/teams"
                icon={Bell}
                title="Invitations"
                subtitle="Team invites and requests"
                badge={invitationsCount}
              />
              <ActionCard
                href="/tournaments"
                icon={Calendar}
                title="Tournaments"
                subtitle="Browse and register for tournaments"
              />
              <ActionCard
                href="/dashboard/organizer"
                icon={Trophy}
                title="My Tournaments"
                subtitle={
                  myTournamentsCount === null
                    ? "Organize and manage tournaments"
                    : `${myTournamentsCount} tournament${myTournamentsCount !== 1 ? "s" : ""}`
                }
                badge={myTournamentsCount}
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
                href="/dashboard/teams"
                icon={Shield}
                title="My Teams"
                subtitle="Teams you captain or join"
                badge={myTeamsCount}
              />
              <ActionCard
                href="/tournaments"
                icon={Trophy}
                title="Tournaments"
                subtitle="Discover talent at tournaments"
              />
              <ActionCard
                href="/dashboard/organizer"
                icon={Trophy}
                title="My Tournaments"
                subtitle={
                  myTournamentsCount === null
                    ? "Organize and manage tournaments"
                    : `${myTournamentsCount} tournament${myTournamentsCount !== 1 ? "s" : ""}`
                }
                badge={myTournamentsCount}
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
              <MiniStat label="Total Users" value={stats.users?.total || 0} />
              <MiniStat label="Players" value={stats.users?.players || 0} />
              <MiniStat label="Scouts" value={stats.users?.scouts || 0} />
              <MiniStat label="Tournaments" value={stats.tournaments || 0} />
            </div>
          </div>
        )}

        {!isAdmin && (
          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-5 py-2.5 text-sm font-medium hover:bg-[#D4AF6A] hover:text-[#1C1928] transition"
            >
              <CreditCard className="w-4 h-4" />
              {isPremium ? "Manage subscription" : "Upgrade to premium"}
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 text-white/80 px-5 py-2.5 text-sm font-medium hover:bg-white/5 transition"
            >
              <Settings className="w-4 h-4" />
              Settings
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

function ActionCard({ href, icon: Icon, title, subtitle, badge }) {
  return (
    <Link
      href={href}
      className="relative bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 hover:shadow-lg hover:shadow-[#D4AF6A]/5 transition-all"
    >
      {badge > 0 && (
        <span className="absolute top-3 right-3 bg-[#D4AF6A] text-[#1C1928] text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
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