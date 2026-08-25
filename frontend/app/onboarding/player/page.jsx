"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Flag, Calendar, Shirt } from "lucide-react";
import Image from "next/image";

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

    try {
      const res = await fetch("/api/player/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nationality: formData.nationality,
          date_of_birth: formData.dateOfBirth,
          position: formData.position,
          current_team: formData.currentTeam,
        }),
      });

      if (!res.ok) {
        console.error("Failed to update player profile");
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
          className={`absolute -left-[20%] -top-[20%] h-[70%] w-[70%] rounded-full bg-[#D4AF6A]/10 transition-all duration-1000 ease-in-out ${animate ? "scale-110" : "scale-100"
            }`}
        />
        <div
          className={`absolute -bottom-[10%] -right-[10%] h-[60%] w-[60%] rounded-full bg-[#D4AF6A]/5 transition-all delay-300 duration-1000 ease-in-out ${animate ? "scale-125" : "scale-100"
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
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">Searchable by position and nationality</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">Add highlights and stats later from your dashboard</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
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
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-white/15 bg-white/5 py-3 pl-10 pr-3 text-white outline-none focus:border-[#D4AF6A]/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="position" className="block text-sm font-medium text-white/70">
                Position
              </label>
              <div className="relative">
                <Shirt className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <select
                  id="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="block w-full appearance-none rounded-md border border-white/15 bg-white/5 py-3 pl-10 pr-3 text-white outline-none focus:border-[#D4AF6A]/60"
                >
                  <option value="" className="bg-[#242030]">
                    Select your position
                  </option>
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos} className="bg-[#242030]">
                      {pos}
                    </option>
                  ))}
                </select>
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
