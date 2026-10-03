import { Suspense } from "react";
import SignInForm from "@/components/auth/SignInForm";

export const metadata = {
  title: "Footy Scouts | Login",
  description: "Login to Footy Scouts",
};

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1C1928]" />}>
      <SignInForm />
    </Suspense>
  );
}