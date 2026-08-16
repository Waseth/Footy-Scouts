import { Suspense } from "react";
import Verification from "@/components/auth/Verification";

export const metadata = {
  title: "Footy Scouts | Verify Email",
  description: "Verify your Footy Scouts account",
};

export default function Verify() {
  return (
    <Suspense>
      <Verification />
    </Suspense>
  );
}
