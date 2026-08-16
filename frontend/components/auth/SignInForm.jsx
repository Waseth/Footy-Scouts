"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import Label from "@/components/form/Label";
import Input from "@/components/form/InputField";
import Checkbox from "@/components/form/Checkbox";
import Button from "@/components/elements/Button";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  remember: z.boolean(),
});

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({ email: "", password: "" });
    const loginData = { email, password, remember: isChecked };

    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const formatted = result.error.format();
      setErrors({
        email: formatted.email?._errors[0] || "",
        password: formatted.password?._errors[0] || "",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setErrors((prev) => ({ ...prev, password: data.message || "Login failed" }));
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, password: "Error during login" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-center px-6 py-16 lg:w-1/2 lg:px-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Login</h1>
          <p className="text-sm text-white/60">
            Enter your email and password to access your profile.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
                placeholder="Enter your password"
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

          <div className="flex items-center justify-between">
            <Checkbox
              id="remember"
              label="Keep me logged in"
              checked={isChecked}
              onChange={setIsChecked}
            />
            <Link href="/reset-password" className="gold-font text-sm hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60 sm:text-left">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="gold-font hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
