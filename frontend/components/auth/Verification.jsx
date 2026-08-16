"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Label from "@/components/form/Label";
import Button from "@/components/elements/Button";

export default function Verification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resendTimer === 0) return;
    const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e, index) => {
    const { value } = e.target;
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < otp.length - 1) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (!email) {
      toast.error("Email not provided in the URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/onboarding");
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email not provided in the URL.");
      return;
    }
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Code resent. Check your email.");
        setResendTimer(30);
      } else {
        toast.error(data.message || "Failed to resend code.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while resending the code!");
    }
  };

  return (
    <div className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Verify your email</h1>
          <p className="text-sm text-white/60">
            We sent a 6-digit code to {email ? <span className="text-white/90">{email}</span> : "your email"}. Enter it below to activate your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>
              Verification code <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 sm:gap-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  maxLength={1}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  className="h-12 w-full rounded-md border border-white/15 bg-white/5 text-center text-xl font-semibold text-white outline-none focus:border-[#D4AF6A]/60 focus:bg-white/8"
                />
              ))}
            </div>
          </div>

          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Verifying..." : "Verify My Account"}
          </Button>
        </form>

        <div className="mt-5 flex items-center gap-3">
          <p className="text-sm text-white/60">Didn&apos;t get the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0}
            className="gold-font text-sm disabled:opacity-50"
          >
            {resendTimer > 0 ? `Resend (${resendTimer}s)` : "Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}
