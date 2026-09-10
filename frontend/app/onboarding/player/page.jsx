"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Flag,
  Calendar,
  Shirt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import CustomSelect from "@/components/CustomSelect";

const POSITIONS = [
  "Goalkeeper",
  "Centre-back",
  "Full-back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Winger",
  "Striker",
];

const POSITION_OPTIONS = POSITIONS.map((pos) => ({ value: pos, label: pos }));

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = CURRENT_YEAR - 60;
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - MIN_BIRTH_YEAR + 1 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return { value: String(y), label: String(y) };
});
const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({ value: String(i), label: name }));

/* ---------- Themed date picker ---------- */
function ThemedDatePicker({ id, value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  useClickOutside(wrapperRef, () => setOpen(false));

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const [viewDate, setViewDate] = useState(
    selectedDate || new Date(CURRENT_YEAR - 18, 0, 1)
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const formatDisplay = (date) =>
    date
      ? date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  const toISODate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const handlePick = (day) => {
    if (!day) return;
    onChange({ target: { id, value: toISODate(year, month, day) } });
    setOpen(false);
  };

  const changeMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const handleMonthSelect = (monthValue) => {
    setViewDate(new Date(year, Number(monthValue), 1));
  };

  const handleYearSelect = (yearValue) => {
    setViewDate(new Date(Number(yearValue), month, 1));
  };

  const isSelected = (day) =>
    selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month &&
    selectedDate.getDate() === day;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center rounded-lg border py-2 sm:py-2.5 pl-10 pr-3 text-left text-sm sm:text-base outline-none transition ${
          open ? "border-[#D4AF6A]/60" : "border-white/10 hover:border-white/20"
        } bg-[#1C1928]`}
      >
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <span className={value ? "text-white" : "text-white/40"}>
          {value ? formatDisplay(selectedDate) : "Select your date of birth"}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-80 rounded-lg border border-white/10 bg-[#242030] p-4 shadow-lg shadow-black/40">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="shrink-0 rounded-lg border border-white/10 p-1.5 text-white/60 transition hover:border-white/20 hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <CustomSelect
              value={String(month)}
              onChange={handleMonthSelect}
              options={MONTH_OPTIONS}
              className="flex-[1.4]"
            />
            <CustomSelect
              value={String(year)}
              onChange={handleYearSelect}
              options={YEAR_OPTIONS}
              className="flex-1"
            />

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="shrink-0 rounded-lg border border-white/10 p-1.5 text-white/60 transition hover:border-white/20 hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-white/40">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => (
              <button
                type="button"
                key={i}
                disabled={!day}
                onClick={() => handlePick(day)}
                className={`aspect-square rounded text-sm transition-colors ${
                  !day
                    ? "cursor-default"
                    : isSelected(day)
                    ? "bg-[#D4AF6A] font-medium text-[#1C1928]"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {day || ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayerOnboarding() {
  const [formData, setFormData] = useState({
    nationality: "",
    dateOfBirth: "",
    position: "",
    currentTeam: "",
  });
  const [progress, setProgress] = useState(50);
  const [animate, setAnimate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const isFormValid = formData.nationality && formData.dateOfBirth && formData.position;

  const handleContinue = async () => {
    if (!isFormValid) return;
    setSubmitting(true);
    setProgress(80);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const payload = {
      nationality: formData.nationality,
      date_of_birth: formData.dateOfBirth,
      position: formData.position,
      current_team: formData.currentTeam,
    };

    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      // Try to update existing profile
      let res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/players/profile`,
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(payload),
        }
      );

      // If profile doesn't exist, create it
      if (res.status === 404) {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/players/profile`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              full_name: "New Player",
              ...payload,
            }),
          }
        );
      }

      if (!res.ok) {
        const body = await res.text();
        console.error("Save profile failed:", res.status, body);

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        setSubmitting(false);
        return;
      }

      setProgress(100);
      setTimeout(() => router.push("/dashboard"), 400);
    } catch (error) {
      console.error("Error updating player profile:", error);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      {/* Left — brand panel */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-[#1C1928] p-8 md:w-1/2 md:p-0">
        <div
          className={`absolute left-[20%] top-[20%] h-[70%] w-[70%] rounded-full bg-[#D4AF6A]/10 transition-all duration-1000 ease-in-out ${animate ? "scale-110" : "scale-100"
            }`}
        />
        <div
          className={`absolute bottom-[10%] right-[10%] h-[60%] w-[60%] rounded-full bg-[#D4AF6A]/5 transition-all delay-300 duration-1000 ease-in-out ${animate ? "scale-125" : "scale-100"
            }`}
        />
        <div className="relative z-10 max-w-md text-center text-white md:text-left">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Tell Us About <span className="gold-font">Your Game</span>
          </h1>
          <p className="mb-8 text-lg text-white/70">
            This is what scouts see first — the more accurate it is, the easier you are to find.
          </p>
          <div className="mb-8 space-y-4">
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">Searchable by position and nationality</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">Add highlights and stats later from your dashboard</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">You control what scouts can see</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full items-center justify-center bg-[#242030] p-8 md:w-1/2 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Image src="/logo-modified.png" loading="eager" alt="logo" className="mx-auto mb-3 h-auto w-auto" width={100} height={50} />

            <h2 className="text-2xl font-bold text-white">Footy Scouts</h2>
            <p className="mt-1 text-sm text-white/50">Your football recruitment network</p>
          </div>

          <div className="mb-10">
            <div className="mb-2 flex justify-between text-sm text-white/50">
              <span>Step 2 of 3</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#D4AF6A] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h3 className="mb-8 text-2xl font-bold text-white">Tell us about your game</h3>

          <div className="mb-10 space-y-6">
            <div className="space-y-2">
              <label htmlFor="nationality" className="block text-sm font-medium text-white/70">
                Nationality
              </label>
              <div className="relative">
                <Flag className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  id="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="e.g. Kenya"
                  className="block w-full rounded-md border border-white/15 bg-white/5 py-3 pl-10 pr-3 text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-white/70">
                Date of Birth
              </label>
              <ThemedDatePicker
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="position" className="block text-sm font-medium text-white/70">
                Position
              </label>
              <div className="relative">
                <Shirt className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/40" />
                <CustomSelect
                  value={formData.position}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, position: value }))
                  }
                  options={POSITION_OPTIONS}
                  placeholder="Select your position"
                  className="[&>button]:pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="currentTeam" className="block text-sm font-medium text-white/70">
                Current Team <span className="text-white/40">(optional)</span>
              </label>
              <input
                type="text"
                id="currentTeam"
                value={formData.currentTeam}
                onChange={handleInputChange}
                placeholder="e.g. Nairobi United FC"
                className="block w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#D4AF6A]/60"
              />
            </div>
          </div>

          <button
            className={`flex w-full items-center justify-center rounded-md py-4 text-base font-medium transition-all duration-300 ${isFormValid
                ? "cursor-pointer bg-white text-[#1C1928] hover:bg-white/90"
                : "cursor-not-allowed bg-white/10 text-white/30"
              }`}
            onClick={handleContinue}
            disabled={!isFormValid || submitting}
          >
            {submitting ? "Saving..." : "Finish Setting Up"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>

          <p className="mt-6 text-center text-sm text-white/40">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}