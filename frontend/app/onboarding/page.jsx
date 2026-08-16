"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Binoculars, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [progress, setProgress] = useState(15);
  const [animate, setAnimate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setProgress(30);
  };

  const handleContinue = async () => {
    if (!selectedOption) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/user/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: selectedOption }),
      });

      // REPLACE
      if (res.ok) {
        console.error("Failed to update user role");
        setSubmitting(false);
        return;
      }

      setProgress(50);
      setTimeout(() => {
        router.push(selectedOption === "PLAYER" ? "/onboarding/player" : "/onboarding/scout");
      }, 400);
    } catch (error) {
      console.error("Error updating user role:", error);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      {/* Left — brand panel */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-[#1C1928] p-8 md:w-1/2 md:p-0">
        <div
          className={`absolute -left-[20%] -top-[20%] h-[70%] w-[70%] rounded-full bg-[#D4AF6A]/10 transition-all duration-1000 ease-in-out ${
            animate ? "scale-110" : "scale-100"
          }`}
        />
        <div
          className={`absolute -bottom-[10%] -right-[10%] h-[60%] w-[60%] rounded-full bg-[#D4AF6A]/5 transition-all delay-300 duration-1000 ease-in-out ${
            animate ? "scale-125" : "scale-100"
          }`}
        />
        <div className="relative z-10 max-w-md text-center text-white md:text-left">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Begin Your <span className="gold-font">Journey</span> With Footy Scouts
          </h1>
          <p className="mb-8 text-lg text-white/70">
            Join players, coaches, scouts and clubs already building their football future on the network.
          </p>
          <div className="mb-8 space-y-4">
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">A profile built for how scouts actually search</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">Direct visibility to verified scouts and clubs</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="mr-3 h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              <span className="text-white/80">From grassroots tournaments to the professionals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — role selection */}
      <div className="flex w-full items-center justify-center bg-[#242030] p-8 md:w-1/2 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white">Footy Scouts</h2>
            <p className="mt-1 text-sm text-white/50">Your football recruitment network</p>
          </div>

          <div className="mb-10">
            <div className="mb-2 flex justify-between text-sm text-white/50">
              <span>Step 1 of 3</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#D4AF6A] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h3 className="mb-8 text-2xl font-bold text-white">How would you like to use Footy Scouts?</h3>

          <div className="mb-10 space-y-6">
            <button
              className={`flex w-full items-center rounded-xl border-2 p-6 text-left transition-all duration-300 ${
                selectedOption === "PLAYER"
                  ? "border-[#D4AF6A] bg-[#D4AF6A]/10"
                  : "border-white/10 bg-white/5 hover:border-white/25"
              }`}
              onClick={() => handleSelect("PLAYER")}
            >
              <div
                className={`mr-6 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  selectedOption === "PLAYER" ? "bg-[#D4AF6A]" : "bg-white/10"
                }`}
              >
                <Trophy className={`h-7 w-7 ${selectedOption === "PLAYER" ? "text-[#1C1928]" : "text-white"}`} />
              </div>
              <div>
                <h4 className="mb-1 text-lg font-semibold text-white">I&apos;m a Player</h4>
                <p className="text-sm text-white/50">I want to build a profile and get scouted</p>
              </div>
              {selectedOption === "PLAYER" && (
                <CheckCircle2 className="ml-auto h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              )}
            </button>

            <button
              className={`flex w-full items-center rounded-xl border-2 p-6 text-left transition-all duration-300 ${
                selectedOption === "SCOUT"
                  ? "border-[#D4AF6A] bg-[#D4AF6A]/10"
                  : "border-white/10 bg-white/5 hover:border-white/25"
              }`}
              onClick={() => handleSelect("SCOUT")}
            >
              <div
                className={`mr-6 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  selectedOption === "SCOUT" ? "bg-[#D4AF6A]" : "bg-white/10"
                }`}
              >
                <Binoculars className={`h-7 w-7 ${selectedOption === "SCOUT" ? "text-[#1C1928]" : "text-white"}`} />
              </div>
              <div>
                <h4 className="mb-1 text-lg font-semibold text-white">I&apos;m a Scout</h4>
                <p className="text-sm text-white/50">I want to discover and track talent</p>
              </div>
              {selectedOption === "SCOUT" && (
                <CheckCircle2 className="ml-auto h-6 w-6 flex-shrink-0 text-[#D4AF6A]" />
              )}
            </button>
          </div>

          <button
            className={`flex w-full items-center justify-center rounded-md py-4 text-base font-medium transition-all duration-300 ${
              selectedOption
                ? "cursor-pointer bg-white text-[#1C1928] hover:bg-white/90"
                : "cursor-not-allowed bg-white/10 text-white/30"
            }`}
            onClick={handleContinue}
            disabled={!selectedOption || submitting}
          >
            {submitting ? "Saving..." : "Continue"}
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
