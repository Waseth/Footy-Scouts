"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User, Trophy, Calendar, Image as ImageIcon, Search, Users,
  Bell, Star, Eye, CheckCircle2, Loader2, Shield,
  Film, FileText, Upload, CreditCard, LayoutDashboard, Sparkles,
  Bookmark,
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

// ─── Helpers ───
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function useRevealOnScroll() {
  const [ref, setRef] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return { setRef, visible };
}

export default function Home() {
  const [authState, setAuthState] = useState("checking");

  useEffect(() => {
    const token = api.isAuthenticated();
    if (!token) {
      setAuthState("guest");
      return;
    }

    api
      .getMe()
      .then((me) => {
        if (me.role === "PLAYER" && !me.has_player_profile) {
          window.location.href = "/onboarding/player";
          return;
        }
        if (me.role === "SCOUT" && !me.has_scout_profile) {
          window.location.href = "/onboarding/scout";
          return;
        }
        if (me.role === "INSTITUTION" && !me.has_institution_profile) {
          window.location.href = "/onboarding/institution";
          return;
        }
        setAuthState("authed");
      })
      .catch(() => {
        api.clearToken();
        setAuthState("guest");
      });
  }, []);

  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  return authState === "authed" ? <LoggedInHome /> : <GuestHome />;
}

// ════════════════════════════════════════════════════════════════
//  GUEST HOME
// ════════════════════════════════════════════════════════════════

function GuestHome() {
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [verifiedScouts, setVerifiedScouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, tournamentsRes, scoutsRes] = await Promise.all([
          api.getFeaturedPlayers(3),
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

  const goToLogin = (target) => {
    const redirect = encodeURIComponent(target || "/");
    window.location.href = `/login?redirect=${redirect}`;
  };

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <section
        className="relative min-h-[70vh] sm:min-h-[75vh] md:min-h-[80vh] flex items-center justify-center"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-[#1C1928]/65 md:bg-[#1C1928]/55" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#1C1928]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center px-4 py-16 sm:py-20 md:py-24">
          <span className="text-[#D4AF6A] mb-3 md:mb-4 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Football Recruitment, Reimagined
          </span>
          <h1 className="mb-4 md:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white drop-shadow-lg">
            Footy Scouts — A football recruitment network
          </h1>
          <p className="text-white/90 mx-auto mb-6 md:mb-9 max-w-2xl text-sm sm:text-base md:text-lg font-medium drop-shadow">
            Register, create your profile, and get discovered by scouts, agents, and clubs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-md bg-[#1C1928]/70 backdrop-blur border border-[#D4AF6A]/40 px-4 md:px-6 py-2.5 md:py-3.5 text-sm md:text-base font-medium text-[#D4AF6A] transition hover:bg-[#D4AF6A] hover:text-[#1C1928]"
            >
              Find out more
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-[#D4AF6A] px-5 md:px-7 py-2.5 md:py-3.5 text-sm md:text-base font-medium text-[#1C1928] hover:bg-[#c9a45f] transition shadow-lg shadow-black/20"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      <FeaturedSection
        eyebrow="Discover Talent"
        title="Featured players"
        loading={loading}
        items={featuredPlayers}
        renderItem={(p) => <PlayerCard key={p.id} player={p} />}
        emptyMessage="No featured premium players yet"
        onSeeMore={() => goToLogin("/players")}
        animated
      />

      <FeaturedTournamentsSection
        loading={loading}
        items={recentTournaments}
        onSeeMore={() => goToLogin("/tournaments")}
      />

      <FeaturedSection
        eyebrow="Trusted Network"
        title="Featured scouts"
        loading={loading}
        items={verifiedScouts}
        renderItem={(s) => <ScoutCard key={s.id} scout={s} />}
        emptyMessage="No scouts found"
        onSeeMore={() => goToLogin("/scouts")}
        animated
      />

      <FAQ />
      <Footer />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  LOGGED-IN HOME
// ════════════════════════════════════════════════════════════════

function LoggedInHome() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [media, setMedia] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [featuredScouts, setFeaturedScouts] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [myTeamsCount, setMyTeamsCount] = useState(null);
  const [invitationsCount, setInvitationsCount] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let me;
      try {
        me = await api.getMe();
        setUser(me);

        const lastLogin = me.last_login ? new Date(me.last_login) : null;
        const now = new Date();
        if (!lastLogin || now - lastLogin < 60_000) {
          setIsFirstLogin(true);
        }
      } catch (err) {
        api.clearToken();
        window.location.href = "/";
        return;
      }

      const results = await Promise.allSettled([
        api.getMySubscription(),
        api.getUnreadNotificationCount(),
        (me.role === "PLAYER"
          ? api.request("/players/profile")
          : me.role === "SCOUT"
          ? api.request("/scouts/profile")
          : me.role === "INSTITUTION"
          ? api.request("/institutions/profile")
          : Promise.resolve(null)),
        api.getPlayerMedia(me.id).catch(() => ({ media: [] })),
        Promise.all([
          api.getFeaturedPlayers(3),
          api.getScouts({ page: 1, per_page: 3 }),
          api.getTournaments({ page: 1, per_page: 3 }),
        ]),
        me.role === "PLAYER"
          ? api.getMyTeams({ per_page: 1 }).catch(() => null)
          : Promise.resolve(null),
        me.role === "PLAYER"
          ? api.getMyPlayerInvitations({ per_page: 1 }).catch(() => null)
          : Promise.resolve(null),
      ]);

      const [subR, notifR, profileR, mediaR, featuredR, teamsR, invR] = results;

      if (subR.status === "fulfilled") setSubscription(subR.value.subscription);
      if (notifR.status === "fulfilled") setUnreadCount(notifR.value);
      if (profileR.status === "fulfilled" && profileR.value) {
        const payload = profileR.value.data;
        setProfile(payload.player || payload.scout || payload.institution || null);
      }
      if (mediaR.status === "fulfilled" && mediaR.value?.media) {
        setMedia(mediaR.value.media);
      }
      if (featuredR.status === "fulfilled") {
        const [playersRes, scoutsRes, tournamentsRes] = featuredR.value;
        setFeaturedPlayers(playersRes.items || []);
        setFeaturedScouts(scoutsRes.items || []);
        setUpcomingTournaments(tournamentsRes.items || []);
      }
      if (teamsR.status === "fulfilled" && teamsR.value) setMyTeamsCount(teamsR.value.total || 0);
      if (invR.status === "fulfilled" && invR.value) setInvitationsCount(invR.value.total || 0);

      setLoading(false);
    })();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
        </div>
      </div>
    );
  }

  // First-name greeting — pull from profile, fallback to email prefix
  const displayName =
    (profile?.full_name && profile.full_name.trim().split(/\s+/)[0]) ||
    (profile?.scout_name && profile.scout_name.trim().split(/\s+/)[0]) ||
    (profile?.institution_name && profile.institution_name.trim().split(/\s+/)[0]) ||
    (user.email ? user.email.split("@")[0] : "there");

  const username = capitalize(displayName);
  const greeting = getGreeting();
  const isPremium = subscription?.is_premium;
  const isAdmin = user.role === "ADMIN";
  const isPlayer = user.role === "PLAYER";
  const isScout = user.role === "SCOUT";
  const isInstitution = user.role === "INSTITUTION";

  const welcomeText = isFirstLogin ? "Welcome" : "Welcome back";

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section
        className="relative min-h-[55vh] sm:min-h-[60vh] md:min-h-[65vh] flex items-center justify-center border-b border-white/5"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-[#1C1928]/70 md:bg-[#1C1928]/60" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#1C1928]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center px-4 py-14 sm:py-16 md:py-20">
          <p className="text-[#D4AF6A] mb-2 md:mb-3 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            {welcomeText}
          </p>
          <h1 className="mb-3 md:mb-4 text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            {greeting}, <span className="text-[#D4AF6A]">{username}</span>!
          </h1>
          <p className="text-white/85 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 drop-shadow">
            {isAdmin
              ? "Manage the platform from your admin console."
              : isScout
              ? "Discover talent, shortlist players, and organize tournaments."
              : isInstitution
              ? "Find players, contact scouts, and organize tournaments."
              : "Ready to get discovered? Keep your profile updated and upload highlights."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isAdmin && !isPlayer && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 text-sm md:text-base font-medium hover:bg-[#c9a45f] transition shadow-lg shadow-black/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 text-sm md:text-base font-medium hover:bg-[#c9a45f] transition shadow-lg shadow-black/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin console
              </Link>
            )}
            {isPlayer && (
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center gap-2 rounded-md bg-[#1C1928]/70 backdrop-blur border border-[#D4AF6A]/40 text-[#D4AF6A] px-5 py-2.5 text-sm md:text-base font-medium hover:bg-[#D4AF6A] hover:text-[#1C1928] transition"
              >
                <CreditCard className="w-4 h-4" />
                {isPremium ? "Manage subscription" : "Upgrade to premium"}
              </Link>
            )}
            {unreadCount > 0 && (
              <Link
                href="/notifications"
                className="inline-flex items-center gap-2 rounded-md border border-white/25 text-white px-5 py-2.5 text-sm md:text-base font-medium hover:bg-white/10 transition"
              >
                <Bell className="w-4 h-4" />
                {unreadCount} new
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══ PROFILE COMPLETENESS (directly under the hero) ═══ */}
      {(isPlayer || isScout) && (
        <section className="container mx-auto px-4 pt-10 pb-2">
          <div className="mx-auto max-w-4xl">
            <ProfileCompleteness
              profile={profile || {}}
              role={user.role}
              onActionHref="/dashboard/profile"
            />
          </div>
        </section>
      )}

      {/* ═══ QUICK ACTIONS ═══ */}
      {!isAdmin && (
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow="Quick Actions" title="What would you like to do?" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {isPlayer && (
                <>
                  <Tile href="/dashboard/media" icon={ImageIcon} title="Highlights" subtitle="Upload images, videos, and PDFs" />
                  <Tile href="/dashboard/teams" icon={Shield} title="My Teams" subtitle={myTeamsCount === null ? "Teams you captain or join" : `${myTeamsCount} team${myTeamsCount !== 1 ? "s" : ""}`} badge={myTeamsCount} />
                  <Tile href="/dashboard/invitations" icon={Bell} title="Invitations" subtitle="Team invites and requests" badge={invitationsCount} />
                  <Tile href="/tournaments" icon={Calendar} title="Tournaments" subtitle="Browse and request to join with your team" />
                </>
              )}
              {isScout && (
                <>
                  <Tile href="/dashboard/profile" icon={User} title="My Scout Profile" subtitle="Manage your scout details" />
                  <Tile href="/players" icon={Search} title="Find Players" subtitle="Search for talented players" />
                  <Tile href="/dashboard/shortlist" icon={Bookmark} title="Shortlist" subtitle="Players you've saved" />
                  <Tile href="/scouts" icon={Shield} title="Find Scouts" subtitle="Browse other scouts and agencies" />
                  <Tile href="/institutions" icon={Users} title="Institutions" subtitle="Browse clubs, schools, and academies" />
                  <Tile href="/dashboard/organizer" icon={Trophy} title="My Tournaments" subtitle="Create & manage tournaments" />
                </>
              )}
              {isInstitution && (
                <>
                  <Tile href="/dashboard/profile" icon={User} title="Institution Profile" subtitle="Manage your institution details" />
                  <Tile href="/players" icon={Search} title="Find Players" subtitle="Search for talented players" />
                  <Tile href="/dashboard/shortlist" icon={Bookmark} title="Shortlist" subtitle="Players you've saved" />
                  <Tile href="/scouts" icon={Users} title="Find Scouts" subtitle="Browse scouts and agencies" />
                  <Tile href="/tournaments" icon={Calendar} title="Tournaments" subtitle="Browse tournaments" />
                  <Tile href="/dashboard/organizer" icon={Trophy} title="My Tournaments" subtitle="Create & manage tournaments" />
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ YOUR ACTIVITY ═══ */}
      {profile && (isPlayer || isScout) && (
        <section className="container mx-auto px-4 py-10 md:py-14 border-t border-white/5">
          <div className="mx-auto max-w-5xl">
            <SectionHeading eyebrow="Overview" title="Your activity" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard icon={Eye} label="Profile views" value={profile.profile_views || 0} />
              <StatCard icon={User} label="Account type" value={user.role || "—"} />
              <StatCard icon={Star} label="Plan" value={subscription?.plan || "FREE"} highlight={isPremium} />
              <StatCard icon={CheckCircle2} label="Status" value={user.is_verified ? "Verified" : "Unverified"} green={user.is_verified} />
            </div>
          </div>
        </section>
      )}

      {/* ═══ PREMIUM CTA ═══ */}
      {isPlayer && !isPremium && (
        <section className="container mx-auto px-4 pb-10">
          <div className="mx-auto max-w-4xl">
            <PremiumCTA variant="banner" />
          </div>
        </section>
      )}

      {/* ═══ MY HIGHLIGHTS ═══ */}
      {isPlayer && (
        <section className="container mx-auto px-4 py-10 md:py-14 border-t border-white/5">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <span className="text-[#D4AF6A] mb-1 inline-block text-xs font-semibold uppercase tracking-[0.2em]">
                  Your Highlights
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  My media
                </h2>
              </div>
              <Link
                href="/dashboard/media"
                className="inline-flex items-center gap-2 rounded-md border border-[#D4AF6A]/40 text-[#D4AF6A] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A] hover:text-[#1C1928] transition"
              >
                <Upload className="w-4 h-4" /> Manage media
              </Link>
            </div>

            <div className="mb-5 rounded-xl border border-[#D4AF6A]/20 bg-[#D4AF6A]/5 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#D4AF6A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm md:text-base">
                    Highlights get you noticed
                  </p>
                  <p className="text-white/60 text-xs md:text-sm mt-1 leading-relaxed">
                    Scouts are more likely to view and shortlist players with videos
                    on their profile.{" "}
                    <span className="text-[#D4AF6A]">Premium members</span> can upload
                    video highlights and match clips — the single biggest boost to your
                    visibility.
                  </p>
                </div>
              </div>
            </div>

            {media.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#242030] p-8 text-center">
                <ImageIcon className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 text-sm mb-4">
                  You haven't uploaded any highlights yet.
                </p>
                <Link
                  href="/dashboard/media"
                  className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-5 py-2.5 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
                >
                  <Upload className="w-4 h-4" /> Upload your first highlight
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {media.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#242030] p-3 hover:border-[#D4AF6A]/40 transition"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#D4AF6A]/15 flex items-center justify-center text-[#D4AF6A] shrink-0">
                      {m.media_type === "VIDEO" ? (
                        <Film className="w-6 h-6" />
                      ) : m.media_type === "PDF" ? (
                        <FileText className="w-6 h-6" />
                      ) : (
                        <ImageIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {m.title || "Untitled"}
                      </p>
                      <p className="text-white/50 text-xs truncate">
                        {m.media_type} ·{" "}
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#D4AF6A] text-xs font-medium hover:underline shrink-0"
                    >
                      Open →
                    </a>
                  </div>
                ))}
                {media.length > 5 && (
                  <Link
                    href="/dashboard/media"
                    className="block text-center text-sm text-[#D4AF6A] hover:underline pt-2"
                  >
                    View all {media.length} →
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ FEATURED SECTIONS ═══ */}
      <FeaturedSection
        eyebrow="Discover Talent"
        title="Featured players"
        loading={false}
        items={featuredPlayers}
        renderItem={(p) => <PlayerCard key={p.id} player={p} />}
        emptyMessage="No featured premium players yet"
        onSeeMore={() => (window.location.href = "/players")}
        seeMoreLabel="See more players"
        animated
      />

      <FeaturedTournamentsSection
        loading={false}
        items={upcomingTournaments}
        onSeeMore={() => (window.location.href = "/tournaments")}
      />

      <FeaturedSection
        eyebrow="Trusted Network"
        title="Featured scouts"
        loading={false}
        items={featuredScouts}
        renderItem={(s) => <ScoutCard key={s.id} scout={s} />}
        emptyMessage="No scouts found"
        onSeeMore={() => (window.location.href = "/scouts")}
        seeMoreLabel="See more scouts"
        animated
      />

      <FAQ />
      <Footer />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  Shared components
// ════════════════════════════════════════════════════════════════

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-6 md:mb-8 text-center">
      <span className="text-[#D4AF6A] mb-2 inline-block text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
        {eyebrow}
      </span>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
        {title}
      </h2>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, green, highlight }) {
  const iconColor = green
    ? "text-green-400"
    : highlight
    ? "text-[#D4AF6A]"
    : "text-[#D4AF6A]";
  return (
    <div className="rounded-xl border border-white/10 bg-[#242030] p-4 md:p-5 hover:border-[#D4AF6A]/40 transition">
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-lg bg-[#D4AF6A]/15 p-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p
        className={`text-xl md:text-2xl font-bold ${
          green ? "text-green-400" : highlight ? "text-[#D4AF6A]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Tile({ href, icon: Icon, title, subtitle, badge }) {
  return (
    <Link
      href={href}
      className="group relative rounded-xl border border-white/10 bg-[#242030] p-5 hover:border-[#D4AF6A]/50 hover:shadow-lg hover:shadow-[#D4AF6A]/5 hover:-translate-y-0.5 transition-all duration-300"
    >
      {badge > 0 && (
        <span className="absolute top-3 right-3 bg-[#D4AF6A] text-[#1C1928] text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-[#D4AF6A]/15 p-2.5 shrink-0">
          <Icon className="w-5 h-5 text-[#D4AF6A]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-semibold group-hover:text-[#D4AF6A] transition">
            {title}
          </h3>
          <p className="text-white/60 text-sm mt-0.5 leading-snug">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function RevealCard({ children, index = 0, animated = false }) {
  const { setRef, visible } = useRevealOnScroll();

  if (!animated) return children;

  return (
    <div
      ref={setRef}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {children}
    </div>
  );
}

function FeaturedSection({
  eyebrow,
  title,
  loading,
  items,
  renderItem,
  emptyMessage,
  onSeeMore,
  seeMoreLabel,
  animated = false,
}) {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow={eyebrow} title={title} />
        {loading ? (
          <GridSkeleton count={3} cols={3} />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {items.map((item, i) => (
              <RevealCard key={item.id || i} index={i} animated={animated}>
                {renderItem(item)}
              </RevealCard>
            ))}
          </div>
        ) : (
          <p className="text-center text-white/60">{emptyMessage}</p>
        )}
        <div className="mt-6 md:mt-8 text-center">
          <button
            onClick={onSeeMore}
            className="inline-block rounded-md border border-[#D4AF6A]/30 px-6 py-2.5 text-[#D4AF6A] hover:bg-[#D4AF6A] hover:text-[#1C1928] transition text-sm md:text-base"
          >
            {seeMoreLabel || "See more"}
          </button>
        </div>
      </div>
    </section>
  );
}

function FeaturedTournamentsSection({ loading, items, onSeeMore }) {
  return (
    <section className="bg-[#1C1928] py-10 md:py-14 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Compete" title="Featured tournaments" />
          {loading ? (
            <GridSkeleton count={3} cols={3} />
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {items.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          ) : (
            <p className="text-center text-white/60">
              No tournaments available at the moment
            </p>
          )}
          <div className="mt-6 md:mt-8 text-center">
            <button
              onClick={onSeeMore}
              className="inline-block rounded-md border border-[#D4AF6A]/30 px-6 py-2.5 text-[#D4AF6A] hover:bg-[#D4AF6A] hover:text-[#1C1928] transition text-sm md:text-base"
            >
              See more tournaments
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function GridSkeleton({ count = 3, cols = 3 }) {
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