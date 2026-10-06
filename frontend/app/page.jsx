"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User, Trophy, Calendar, Image as ImageIcon, Search, Users,
  Bell, Star, ArrowRight, Eye, CheckCircle2, ShieldCheck, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import FAQ from "@/components/FAQ";
import PlayerCard from "@/components/PlayerCard";
import TournamentCard from "@/components/TournamentCard";
import ScoutCard from "@/components/ScoutCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumCTA from "@/components/PremiumCTA";
import ProfileCompleteness from "@/components/ProfileCompleteness";

export default function Home() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setIsAuthed(api.isAuthenticated());
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  return isAuthed ? <LoggedInHome /> : <GuestHome />;
}

// ════ GUEST HOME ════
function GuestHome() {
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [verifiedScouts, setVerifiedScouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, tournamentsRes, scoutsRes] = await Promise.all([
          api.getPlayers({ page: 1, per_page: 4 }),
          api.getTournaments({ page: 1, per_page: 3 }),
          api.getScouts({ page: 1, per_page: 3 }),
        ]);
        setFeaturedPlayers(playersRes.items || []);
        setRecentTournaments(tournamentsRes.items || []);
        setVerifiedScouts(scoutsRes.items || []);
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <section className="container mx-auto px-4 py-12 sm:py-20 md:py-24 pt-20 sm:pt-24 md:pt-32">
        <div className="mx-auto max-w-4xl text-center px-4">
          <span className="text-[#D4AF6A] mb-3 md:mb-4 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Football Recruitment, Reimagined
          </span>
          <h1 className="mb-4 md:mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-snug text-white">
            Footy Scouts — A football recruitment network
          </h1>
          <p className="text-white/80 mx-auto mb-6 md:mb-9 max-w-2xl text-sm sm:text-base md:text-lg font-medium">
            Register, create your profile, and get discovered by scouts, agents, and clubs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-md bg-[#1C1928] border border-[#D4AF6A]/30 px-4 md:px-6 py-2.5 md:py-3.5 text-sm md:text-base font-medium text-[#D4AF6A] transition hover:bg-[#D4AF6A] hover:text-[#1C1928] cursor-pointer"
            >
              Find out more →
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-[#D4AF6A] px-5 md:px-7 py-2.5 md:py-3.5 text-sm md:text-base font-medium text-[#1C1928] transition cursor-pointer"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      <GuestSection
        eyebrow="Discover Talent"
        title="Find a player"
        linkHref="/players"
        linkLabel="View all players →"
        loading={loading}
        items={featuredPlayers}
        renderItem={(p) => <PlayerCard key={p.id} player={p} />}
        emptyMessage="No players found"
        cols={4}
      />

      <div className="bg-[#1C1928] py-12 md:py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 md:mb-10 text-center">
              <span className="text-[#D4AF6A] mb-1 md:mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
                Compete
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Upcoming tournaments
              </h2>
            </div>
            {loading ? (
              <GridSkeleton count={3} cols={3} />
            ) : recentTournaments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {recentTournaments.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white">No tournaments available at the moment</p>
              </div>
            )}
            <div className="mt-6 md:mt-8 text-center">
              <Link
                href="/tournaments"
                className="inline-block rounded-md border border-[#D4AF6A]/30 px-6 py-2.5 text-[#D4AF6A] hover:bg-[#D4AF6A] hover:text-[#1C1928] transition text-sm md:text-base"
              >
                See all tournaments →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <GuestSection
        eyebrow="Trusted Network"
        title="See some of our scouts"
        linkHref="/scouts"
        linkLabel="View all scouts →"
        loading={loading}
        items={verifiedScouts}
        renderItem={(s) => <ScoutCard key={s.id} scout={s} />}
        emptyMessage="No scouts found"
        cols={3}
      />

      <FAQ />
      <Footer />
    </div>
  );
}

function GuestSection({
  eyebrow, title, linkHref, linkLabel, loading, items, renderItem,
  emptyMessage, cols = 4,
}) {
  const gridCols =
    cols === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 md:mb-10 text-center">
          <span className="text-[#D4AF6A] mb-2 md:mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            {eyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{title}</h2>
        </div>
        {loading ? (
          <GridSkeleton count={cols} cols={cols} />
        ) : items.length > 0 ? (
          <div className={`grid ${gridCols} gap-4 md:gap-5`}>
            {items.map(renderItem)}
          </div>
        ) : (
          <p className="text-center text-white">{emptyMessage}</p>
        )}
        <div className="mt-6 md:mt-8 text-center">
          <Link
            href={linkHref}
            className="inline-block rounded-md border border-[#D4AF6A]/30 px-6 py-2.5 text-[#D4AF6A] hover:bg-[#D4AF6A] hover:text-[#1C1928] transition text-sm md:text-base"
          >
            {linkLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function GridSkeleton({ count = 4, cols = 4 }) {
  const gridCols =
    cols === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={`grid ${gridCols} gap-4 md:gap-5`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-[#242030] rounded-lg p-4 md:p-5 border border-white/10 animate-pulse"
        >
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10" />
            <div className="flex-1">
              <div className="h-3 md:h-4 bg-white/10 rounded w-3/4 mb-1 md:mb-2" />
              <div className="h-2 md:h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
          <div className="h-2 md:h-3 bg-white/10 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

// ════ LOGGED-IN HOME ════
function LoggedInHome() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const me = await api.getMe();
        setUser(me);

        try {
          const sub = await api.getMySubscription();
          setSubscription(sub.subscription);
        } catch {}

        try {
          const count = await api.getUnreadNotificationCount();
          setUnreadCount(count);
        } catch {}

        if (me.role === "PLAYER") {
          try {
            const res = await api.request("/players/profile");
            setProfile(res.data.player);
          } catch {}
        } else if (me.role === "SCOUT") {
          try {
            const res = await api.request("/scouts/profile");
            setProfile(res.data.scout);
          } catch {}
        }

        try {
          const [playersRes, tournamentsRes] = await Promise.all([
            api.getPlayers({ page: 1, per_page: 3 }),
            api.getTournaments({ page: 1, per_page: 2 }),
          ]);
          setFeaturedPlayers(playersRes.items || []);
          setUpcomingTournaments(tournamentsRes.items || []);
        } catch {}
      } catch (err) {
        console.error("Failed to load home:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
        </div>
      </div>
    );
  }

  const firstName = user?.email?.split("@")[0] || "there";
  const isPremium = subscription?.is_premium;
  const isAdmin   = user?.role === "ADMIN";
  const isPlayer  = user?.role === "PLAYER";
  const isScout   = user?.role === "SCOUT";

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">

        {/* Welcome */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#D4AF6A]/20 flex items-center justify-center shrink-0 relative">
              {profile?.profile_picture_url ? (
                <Image
                  src={profile.profile_picture_url}
                  alt={firstName}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-[#D4AF6A]">
                  {firstName[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white capitalize">
                Hi, {firstName}!
              </h1>
              <p className="text-white/60 text-sm mt-0.5">
                {isAdmin ? "Admin" : user?.role} account
                {isPremium && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[#D4AF6A]">
                    <Star className="w-3 h-3" /> Premium
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Link
                href="/notifications"
                className="flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2 text-sm hover:bg-[#D4AF6A]/10 transition"
              >
                <Bell className="w-4 h-4" />
                {unreadCount} new
              </Link>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Profile completeness — player/scout */}
        {(isPlayer || isScout) && (
          <div className="mb-8">
            <ProfileCompleteness
              profile={profile || {}}
              role={user.role}
              onActionHref="/dashboard/profile"
            />
          </div>
        )}

        {/* Premium CTA */}
        {!isPremium && !isAdmin && <PremiumCTA variant="banner" />}

        {/* Quick actions — no Dashboard card (navbar has it) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <QuickAction href="/dashboard/profile" icon={User} label="My profile" />
          {isPlayer && (
            <QuickAction href="/dashboard/media" icon={ImageIcon} label="Highlights" />
          )}
          <QuickAction href="/players" icon={Search} label="Find players" />
          <QuickAction href="/scouts" icon={Users} label="Find scouts" />
          <QuickAction href="/tournaments" icon={Trophy} label="Tournaments" />
          <QuickAction href="/notifications" icon={Bell} label="Notifications" badge={unreadCount} />
          <QuickAction
            href="/dashboard/subscription"
            icon={Star}
            label={isPremium ? "Subscription" : "Upgrade"}
          />
          <QuickAction href="/dashboard" icon={ShieldCheck} label="Dashboard" />
        </div>

        {/* Featured players */}
        {featuredPlayers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Featured players</h2>
              <Link href="/players" className="text-sm text-[#D4AF6A] hover:underline">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming tournaments */}
        {upcomingTournaments.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Upcoming tournaments</h2>
              <Link href="/tournaments" className="text-sm text-[#D4AF6A] hover:underline">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingTournaments.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        {profile && (
          <div className="rounded-2xl border border-white/10 bg-[#242030] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your activity</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Profile views" value={profile.profile_views || 0} icon={Eye} />
              <Stat label="Role"          value={user?.role || "—"}           icon={User} />
              <Stat label="Plan"          value={subscription?.plan || "FREE"} icon={Star} />
              <Stat
                label="Status"
                value={user?.is_verified ? "Verified" : "Unverified"}
                icon={CheckCircle2}
                green={user?.is_verified}
              />
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, badge }) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#242030] p-4 hover:border-[#D4AF6A]/50 hover:bg-[#242030]/80 transition aspect-square sm:aspect-auto sm:py-5"
    >
      {badge > 0 && (
        <span className="absolute top-2 right-2 bg-[#D4AF6A] text-[#1C1928] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <Icon className="w-6 h-6 text-[#D4AF6A]" />
      <span className="text-xs sm:text-sm text-white font-medium text-center">{label}</span>
    </Link>
  );
}

function Stat({ label, value, icon: Icon, green }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className={`text-lg font-semibold ${green ? "text-green-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}