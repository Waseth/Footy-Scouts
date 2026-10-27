"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumBenefits from "@/components/PremiumBenefits";
import { api } from "@/lib/api";

function PricingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams?.reason || "default";

  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (!api.isAuthenticated()) {
        setRole("GUEST");
        setChecking(false);
        return;
      }
      try {
        const me = await api.getMe();
        setRole(me?.role || "PLAYER");
      } catch {
        setRole("GUEST");
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  // Scouts and institutions never pay — show a friendly no-op
  if (role === "SCOUT" || role === "INSTITUTION") {
    return (
      <div className="min-h-screen bg-[#1C1928]">
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="rounded-2xl border border-[#D4AF6A]/30 bg-[#242030] p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-3">
              You&apos;re already a {role === "SCOUT" ? "scout" : "institution"}
            </h1>
            <p className="text-white/60 mb-6">
              Your account has full free access — no subscription needed.
              Contact players and scouts directly, shortlist talent, and organize tournaments.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-3 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Admins are redirected away
  if (role === "ADMIN") {
    router.replace("/admin");
    return null;
  }

  // Player or guest sees the plans
  return <PremiumBenefits reason={reason} />;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="pt-24">
        <Suspense fallback={null}>
          <PricingContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}