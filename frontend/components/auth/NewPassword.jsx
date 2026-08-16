"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Label from "@/components/form/Label";
import Input from "@/components/form/InputField";
import Button from "@/components/elements/Button";

export default function NewPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!resetToken) {
      toast.error("Reset token not found in URL");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password reset. Please log in with your new password.");
        router.push("/login");
      } else {
        toast.error(data.message || "Password reset failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Set a new password</h1>
          <p className="text-sm text-white/60">Enter and confirm your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="newPassword">
              New Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

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
