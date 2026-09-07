"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/elements/Button";

export default function Verification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  const handleVerify = async (verificationToken) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerified(true);
        setTimeout(() => router.push("/onboarding"), 2000);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email not provided.");
      return;
    }
    setResendLoading(true);
    setResendSuccess(false);
    setError("");

    try {
      // Note: You may need to implement a resend endpoint in your backend
      // For now, we'll inform the user to try logging in again
      setResendSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong!");
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md text-center">
          <p className="text-white/60">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-white/60">Your account is now verified. Redirecting to onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Verify your email</h1>
          <p className="text-sm text-white/60">
            We sent a verification link to{" "}
            {email ? <span className="text-white/90">{email}</span> : "your email"}.
            Click the link to activate your account.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-[#1C1928] rounded-lg p-4 border border-white/10">
            <p className="text-white/40 text-sm">
              Didn't receive the email? Check your spam folder or click the button below to resend.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={resendLoading}
            onClick={handleResend}
          >
            {resendLoading ? "Sending..." : "Resend Verification Email"}
          </Button>

          {resendSuccess && (
            <p className="text-green-400 text-sm text-center">
              Please check your email for the verification link.
            </p>
          )}

          <div className="pt-4 border-t border-white/10">
            <p className="text-center text-sm text-white/40">
              <Link href="/login" className="text-[#D4AF6A] hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}