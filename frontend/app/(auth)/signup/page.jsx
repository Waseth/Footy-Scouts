import { Suspense } from "react";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata = {
  title: "Footy Scouts | Sign Up",
  description: "Create your Footy Scouts account",
};

export default function Signup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1C1928]" />}>
      <SignUpForm />
    </Suspense>
  );
}