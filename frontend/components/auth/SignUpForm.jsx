"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, User, ShieldCheck, Building2 } from "lucide-react";
import { z } from "zod";
import Label from "@/components/form/Label";
import Input from "@/components/form/InputField";
import Button from "@/components/elements/Button";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/\d/, "Password must contain a number.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain a special character."),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match.",
  path: ["confirm"],
});

const ROLES = [
  {
    value: "PLAYER",
    title: "Player",
    description: "Create a profile, upload highlights, join teams & tournaments",
    icon: User,
  },
  {
    value: "SCOUT",
    title: "Scout / Agent",
    description: "Discover players, contact talent, organize tournaments",
    icon: ShieldCheck,
  },
  {
    value: "INSTITUTION",
    title: "Institution",
    description: "Schools, clubs, academies, and organizations",
    icon: Building2,
  },
];

export default function SignUpForm() {
  const router = useRouter();

  const [role, setRole] = useState("PLAYER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirm: "",
    general: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: "", password: "", confirm: "", general: "" });

    const parsed = signupSchema.safeParse({ email, password, confirm });
    if (!parsed.success) {
      const f = parsed.error.format();
      setErrors({
        email: f.email?._errors[0] || "",
        password: f.password?._errors[0] || "",
        confirm: f.confirm?._errors[0] || "",
        general: "",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        }
      );
      const data = await res.json();

      if (res.ok && data.data) {
        if (data.data.access_token) {
          localStorage.setItem("access_token", data.data.access_token);
        }
        if (data.data.refresh_token) {
          localStorage.setItem("refresh_token", data.data.refresh_token);
        }
        if (data.data.user) {
          localStorage.setItem("user", JSON.stringify(data.data.user));
        }

        // Role-based redirect to the correct onboarding flow
        if (role === "SCOUT") {
          router.push("/onboarding/scout");
        } else if (role === "INSTITUTION") {
          router.push("/onboarding/institution");
        } else {
          router.push("/onboarding/player");
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          general: data.error || data.message || "Sign up failed",
        }));
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general:
          err.message === "Failed to fetch"
            ? "Cannot reach the server. Is the backend running?"
            : err.message || "Something went wrong.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
            Create your account
          </h1>
          <p className="text-sm text-white/60">
            Choose how you want to use Footy Scouts. You can change this later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <span className="block text-sm font-medium text-white/70">
              I am a...
            </span>
            <div className="grid grid-cols-1 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const selected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-[#D4AF6A] bg-[#D4AF6A]/10"
                        : "border-white/10 bg-white/5 hover:border-white/25"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        selected ? "text-[#D4AF6A]" : "text-white/50"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {r.title}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
              error={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, upper, lower, digit, symbol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-white/50"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </span>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirm">
              Confirm password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={!!errors.confirm}
            />
            {errors.confirm && (
              <p className="mt-1 text-sm text-red-500">{errors.confirm}</p>
            )}
          </div>

          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60 sm:text-left">
          Already have an account?{" "}
          <Link href="/login" className="gold-font hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}