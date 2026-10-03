import { Star } from "lucide-react";

export default function PremiumBadge({ size = "sm" }) {
  const cls =
    size === "lg"
      ? "px-4 py-1.5 text-sm"
      : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#D4AF6A]/15 text-[#D4AF6A] font-medium ${cls}`}
    >
      <Star className="w-3.5 h-3.5" />
      Premium
    </span>
  );
}