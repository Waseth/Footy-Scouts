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

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    general: "",
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({ firstName: "", lastName: "", email: "", password: "", general: "" });

    if (!isChecked) {
      setErrors((prev) => ({ ...prev, general: "Please accept the Terms and Privacy Policy to continue." }));
      return;
    }

    const formData = { firstName, lastName, email, password };
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const formatted = result.error.format();
      setErrors({
        firstName: formatted.firstName?._errors[0] || "",
        lastName: formatted.lastName?._errors[0] || "",
        email: formatted.email?._errors[0] || "",
        password: formatted.password?._errors[0] || "",
        general: "",
      });
      return;
    }

    setLoading(true);
    const payload = { name: `${firstName} ${lastName}`, email, password };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setErrors((prev) => ({ ...prev, general: data.message || "Signup failed" }));
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
          {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="fname">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fname"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={!!errors.firstName}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lname">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lname"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={!!errors.lastName}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
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

        <p className="mt-6 text-center text-sm text-white/60 sm:text-left">
          Already have an account?{" "}
          <Link href="/login" className="gold-font hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
