import { Suspense } from "react";
import NewPassword from "@/components/auth/NewPassword";

export const metadata = {
  title: "Footy Scouts | New Password",
  description: "Set a new Footy Scouts password",
};

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="p-16 text-white/60">Loading...</div>}>
      <NewPassword />
    </Suspense>
  );
}
