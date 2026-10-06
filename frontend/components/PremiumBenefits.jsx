"use client";

import Link from "next/link";
import { Check, Star, Video, MessageCircle, Trophy, Eye } from "lucide-react";

const BENEFITS = [
  {
    key: "contact_scout",
    icon: MessageCircle,
    title: "Contact scouts & institutions",
    desc: "Reach out directly to verified scouts and clubs looking for talent.",
  },
  {
    key: "upload_highlights",
    icon: Video,
    title: "Upload video highlights",
    desc: "Show your skills with match clips. Free accounts can't upload video.",
  },
  {
    key: "featured_player",
    icon: Star,
    title: "Featured placement",
    desc: "Get surfaced on the homepage and at the top of search results.",
  },
  {
    key: "analytics",
    icon: Eye,
    title: "Profile analytics",
    desc: "See who's viewing your profile and where interest is coming from.",
  },
  {
    key: "tournament_entry",
    icon: Trophy,
    title: "Priority tournament entries",
    desc: "Get early access to tournament invites from organizers.",
  },
];

export default function PremiumBenefits({ reason = "default" }) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
          Unlock everything Footy Scout offers
        </h2>
        <p className="text-white/60">
          Upgrade to a premium account to contact scouts, upload highlights, and
          get discovered faster.
        </p>
        {reason !== "default" && (
          <p className="mt-3 text-sm text-[#D4AF6A]">
            {reason === "contact_scout" && "Contacting scouts requires a premium account."}
            {reason === "upload_highlights" && "Uploading video highlights requires a premium account."}
            {reason === "featured_player" && "Featured placement requires a premium account."}
            {reason === "analytics" && "Profile analytics require a premium account."}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:gap-5 md:grid-cols-2 max-w-5xl mx-auto mb-10">
        {BENEFITS.map((b) => {
          const Icon = b.icon;
          const highlighted = b.key === reason;
          return (
            <div
              key={b.key}
              className={`rounded-xl border p-5 transition ${
                highlighted
                  ? "border-[#D4AF6A] bg-[#D4AF6A]/10 shadow-lg shadow-[#D4AF6A]/10"
                  : "border-white/10 bg-[#242030]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-lg p-2 ${
                    highlighted
                      ? "bg-[#D4AF6A] text-[#1C1928]"
                      : "bg-[#D4AF6A]/15 text-[#D4AF6A]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{b.title}</h3>
                  <p className="text-white/60 text-sm mt-1">{b.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan cards */}
      <div className="mt-10 grid gap-4 md:gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <PlanCard
          plan="MONTHLY"
          planLabel="Monthly"
          price="KSh 1,000"
          period="/ month"
          features={[
            "Contact scouts & clubs",
            "Upload video highlights",
            "Full profile analytics",
            "Featured on search",
          ]}
          ctaLabel="Go Monthly"
        />
        <PlanCard
          plan="ANNUAL"
          planLabel="Annual"
          price="KSh 10,000"
          period="/ year"
          badge="Save 17%"
          features={[
            "Everything in Monthly",
            "Priority tournament invites",
            "Extended highlight storage",
            "Early access to new features",
          ]}
          ctaLabel="Go Annual"
          highlight
        />
      </div>

      <p className="mt-8 text-center text-xs text-white/40">
        Payments via Paystack. Cards, mobile money, and bank transfers accepted.
        Cancel anytime.
      </p>
    </section>
  );
}

function PlanCard({
  plan,
  planLabel,
  price,
  period,
  badge,
  features,
  ctaLabel,
  highlight,
}) {
  return (
    <Link
      href={`/dashboard/subscription?plan=${plan}`}
      className={`group block rounded-2xl border p-6 transition-all duration-300 transform hover:-translate-y-1 ${
        highlight
          ? "border-[#D4AF6A] bg-gradient-to-b from-[#D4AF6A]/10 to-transparent hover:shadow-2xl hover:shadow-[#D4AF6A]/20"
          : "border-white/10 bg-[#242030] hover:border-[#D4AF6A]/60 hover:shadow-xl hover:shadow-[#D4AF6A]/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white text-lg font-semibold">{planLabel}</h3>
        {badge && (
          <span className="text-xs px-2 py-1 rounded-full bg-[#D4AF6A] text-[#1C1928] font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-white/50 text-sm">{period}</span>
      </div>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/70">
            <Check className="w-4 h-4 text-[#D4AF6A] mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <div
        className={`mt-6 block rounded-md px-5 py-3 text-center font-medium transition ${
          highlight
            ? "bg-[#D4AF6A] text-[#1C1928] group-hover:bg-[#c9a45f]"
            : "border border-[#D4AF6A]/40 text-[#D4AF6A] group-hover:bg-[#D4AF6A] group-hover:text-[#1C1928]"
        }`}
      >
        {ctaLabel}
      </div>
    </Link>
  );
}