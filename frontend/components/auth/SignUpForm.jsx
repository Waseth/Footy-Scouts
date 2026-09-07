"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import Label from "@/components/form/Label";
import Input from "@/components/form/InputField";
import Button from "@/components/elements/Button";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  role: z.enum(["PLAYER", "SCOUT", "INSTITUTION"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("PLAYER");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    general: "",
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({ email: "", password: "", confirmPassword: "", role: "", general: "" });

    if (!isChecked) {
      setErrors((prev) => ({ ...prev, general: "Please accept the Terms and Privacy Policy to continue." }));
      return;
    }

    const formData = { email, password, confirmPassword, role };
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const formatted = result.error.format();
      setErrors({
        email: formatted.email?._errors[0] || "",
        password: formatted.password?._errors[0] || "",
        confirmPassword: formatted.confirmPassword?._errors[0] || "",
        role: formatted.role?._errors[0] || "",
        general: "",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (res.ok && data.data) {
        if (data.data.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setErrors((prev) => ({ ...prev, general: data.error || data.message || "Signup failed" }));
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, general: "Error during signup" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-center overflow-y-auto px-6 py-16 lg:w-1/2 lg:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Create your profile</h1>
          <p className="text-sm text-white/60">
            Register to get discovered by scouts, agents, and clubs.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {errors.general}
            </div>
          )}

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
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password (min 6 characters)"
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
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-white/50"
              >
                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </span>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>

          <div>
            <Label htmlFor="role">
              I am a <span className="text-red-500">*</span>
            </Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#1C1928] border border-white/10 text-white focus:border-[#D4AF6A]/60 outline-none transition"
            >
              <option value="PLAYER">Player</option>
              <option value="SCOUT">Scout / Agent</option>
              <option value="INSTITUTION">Club / Academy / Institution</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
          </div>

          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 accent-[#D4AF6A] focus:outline-none focus:ring-0"
            />
            <label htmlFor="terms" className="text-sm font-normal text-white/60">
              By creating an account you agree to our{" "}
              <Link href="/terms-of-service" className="text-white/90 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-white/90 hover:underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/80 sm:text-left">
          Already have an account?{" "}
          <Link href="/login" className="gold-font hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}