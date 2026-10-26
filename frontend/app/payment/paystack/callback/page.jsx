"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [state, setState] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment…");
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  const [successTitle, setSuccessTitle] = useState("Payment successful");

  useEffect(() => {
    if (!reference) {
      setState("failed");
      setMessage("No payment reference provided.");
      return;
    }

    const applySuccess = (payment) => {
      setState("success");
      if (payment?.purpose === "TEAM_TOURNAMENT_ENTRY") {
        setSuccessTitle("Team registered");
        setMessage("Payment successful! Your team is now registered for the tournament.");
        setRedirectTo(payment?.team_id ? `/teams/${payment.team_id}` : "/dashboard");
      } else if (payment?.purpose === "SUBSCRIPTION") {
        setSuccessTitle("Subscription active");
        setMessage("Payment successful! Your subscription is active.");
        setRedirectTo("/dashboard");
      } else {
        setSuccessTitle("Payment successful");
        setMessage("Your payment was successful.");
        setRedirectTo("/dashboard");
      }
      setTimeout(() => router.push(redirectTo), 2500);
    };

    (async () => {
      try {
        const data = await api.verifyPaystackPayment(reference);
        const payment = data?.payment;
        const status = payment?.status;

        if (status === "COMPLETED") {
          applySuccess(payment);
        } else if (status === "FAILED" || status === "ABANDONED") {
          setState("failed");
          setMessage(payment?.failure_reason || "Payment was not successful.");
        } else {
          // Pending — retry once
          setTimeout(async () => {
            try {
              const d = await api.verifyPaystackPayment(reference);
              if (d?.payment?.status === "COMPLETED") {
                applySuccess(d.payment);
              } else {
                setState("failed");
                setMessage("Payment is still pending. Check your dashboard shortly.");
              }
            } catch {
              setState("failed");
              setMessage("Could not verify payment. Please check your dashboard.");
            }
          }, 3000);
        }
      } catch (err) {
        setState("failed");
        setMessage(err.message || "Could not verify payment.");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-16 max-w-lg">
        <div className="rounded-2xl border border-white/10 bg-[#242030] p-8 text-center">
          {state === "verifying" && (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-[#D4AF6A] animate-spin mb-4" />
              <h1 className="text-xl font-semibold text-white mb-2">Verifying payment</h1>
              <p className="text-white/60 text-sm">{message}</p>
            </>
          )}
          {state === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-4" />
              <h1 className="text-xl font-semibold text-white mb-2">{successTitle}</h1>
              <p className="text-white/60 text-sm">{message}</p>
              <p className="text-white/40 text-xs mt-4">
                Redirecting to {redirectTo}…
              </p>
            </>
          )}
          {state === "failed" && (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <h1 className="text-xl font-semibold text-white mb-2">Payment not completed</h1>
              <p className="text-white/60 text-sm">{message}</p>
              <div className="mt-6 flex justify-center gap-3">
                <a
                  href="/dashboard"
                  className="rounded-md bg-[#D4AF6A] text-[#1C1928] px-4 py-2 text-sm font-medium hover:bg-[#D4AF6A]/90"
                >
                  Back to dashboard
                </a>
                <a
                  href="/pricing"
                  className="rounded-md border border-white/20 text-white px-4 py-2 text-sm hover:bg-white/5"
                >
                  View plans
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function PaystackCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1C1928]" />}>
      <CallbackContent />
    </Suspense>
  );
}