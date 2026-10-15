"use client";

import { CheckCircle2, Circle } from "lucide-react";

export default function ProfileCompleteness({ profile, role = "PLAYER", onActionHref }) {
  const { percent, missing } = computeCompleteness(profile, role);

  // Auto-hide when fully complete
  if (percent === 100) return null;

  const barColor =
    percent >= 80
      ? "bg-green-500"
      : percent >= 50
      ? "bg-[#D4AF6A]"
      : "bg-yellow-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#242030] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Profile Completeness</h3>
        <span className="text-sm text-white/60">{percent}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10 mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {missing.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {missing.slice(0, 4).map((m) => (
            <li key={m} className="flex items-center gap-2 text-sm text-white/60">
              <Circle className="w-3 h-3 text-white/30" />
              {m}
            </li>
          ))}
        </ul>
      )}

      {onActionHref && (
        <a
          href={onActionHref}
          className="inline-block rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90 transition"
        >
          {missing.length > 0 ? "Complete profile" : "Edit profile"}
        </a>
      )}
    </div>
  );
}

function computeCompleteness(profile, role) {
  if (!profile) {
    return { percent: 0, missing: ["Create your profile"] };
  }

  const checks = [];

  if (role === "PLAYER") {
    checks.push(!!profile.full_name);
    checks.push(!!profile.profile_picture_url);
    checks.push(!!profile.nationality);
    checks.push(!!profile.position);
    checks.push(!!profile.date_of_birth);
    checks.push(!!profile.biography);
    checks.push(!!profile.current_team);
  } else if (role === "SCOUT") {
    checks.push(!!profile.scout_name);
    checks.push(!!profile.profile_picture_url);
    checks.push(!!profile.country);
    checks.push(!!profile.biography);
  } else if (role === "INSTITUTION") {
    checks.push(!!profile.institution_name);
    checks.push(!!profile.country);
    checks.push(!!profile.biography);
  }

  const done = checks.filter(Boolean).length;
  const percent = checks.length ? Math.round((done / checks.length) * 100) : 100;
  return { percent, missing: [] };
}