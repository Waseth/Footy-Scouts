"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Star, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";

const PLANS = {
  MONTHLY: {
    name: "Monthly Premium",
    price: "KSh 1,000",
    period: "/ month",
    features: [
      "Contact scouts & institutions",
      "Upload video highlights",
      "Full profile analytics",
      "Featured on search",
    ],
  },
  ANNUAL: {
    name: "Annual Premium",
    price: "KSh 10,000",
    period: "/ year",
    badge: "Save 17%",
    features: [
      "Everything in Monthly",
      "Priority tournament invites",
      "Extended highlight storage",
      "Early access to new features",
    ],
  },
};

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = (searchParams.get("plan") || "MONTHLY").toUpperCase();

  const [plan, setPlan] = useState(preselected in PLANS ? preselected : "MONTHLY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMySubscription();
        setSubscription(data.subscription);
      } catch {}
    })();
  }, []);

  const handleUpgrade = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.initializePaystackSubscription(plan);
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message || "Could not start payment");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Upgrade to Premium
          </h1>
          <p className="text-white/60">
            Unlock contact with scouts, video uploads, and analytics.
          </p>
          {subscription?.plan && subscription.plan !== "FREE" && (
            <p className="mt-3 text-sm text-[#D4AF6A]">
              Current plan: {subscription.plan}
              {subscription.end_date &&
                ` · Renews ${new Date(subscription.end_date).toLocaleDateString()}`}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {Object.entries(PLANS).map(([key, p]) => {
            const selected = key === plan;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlan(key)}
                className={`text-left rounded-2xl border p-6 transition ${
                  selected
                    ? "border-[#D4AF6A] bg-[#D4AF6A]/10 shadow-lg shadow-[#D4AF6A]/10"
                    : "border-white/10 bg-[#242030] hover:border-[#D4AF6A]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-lg font-semibold">{p.name}</h3>
                  {p.badge && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[#D4AF6A] text-[#1C1928] font-semibold">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{p.price}</span>
                  <span className="text-white/50 text-sm">{p.period}</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="w-4 h-4 text-[#D4AF6A] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2 mx-auto max-w-2xl rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-[#D4AF6A] text-[#1C1928] px-8 py-3 font-medium hover:bg-[#D4AF6A]/90 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Starting checkout…
              </>
            ) : (
              <>
                <Star className="w-4 h-4" /> Continue to Paystack
              </>
            )}
          </button>
          <p className="mt-3 text-xs text-white/40">
            Secure payment via Paystack. Cards, mobile money, and bank transfers accepted.
          </p>
          <Link href="/dashboard" className="block mt-6 text-sm text-white/60 hover:text-white">
            ← Back to dashboard
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1C1928]" />}>
      <SubscriptionContent />
    </Suspense>
  );
}