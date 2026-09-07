"use client";

import { useState } from "react";
import Link from "next/link";
import Label from "@/components/form/Label";
import Input from "@/components/form/InputField";
import Button from "@/components/elements/Button";

export default function Reset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        alert(data.error || data.message || "Failed to send reset link");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Forgot your password?</h1>
          <p className="text-sm text-white/60">
            Enter the email linked to your profile and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
            <p className="text-green-400 text-sm">
              If that email is registered, a password reset link has been sent.
            </p>
            <p className="text-white/40 text-sm mt-2">
              Please check your inbox and spam folder.
            </p>
            <Link href="/login" className="inline-block mt-4 text-[#D4AF6A] hover:underline">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-white/60 sm:text-left">
          Remembered your password?{" "}
          <Link href="/login" className="gold-font hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}