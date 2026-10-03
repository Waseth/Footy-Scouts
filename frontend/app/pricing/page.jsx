import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumBenefits from "@/components/PremiumBenefits";

function PricingContent({ searchParams }) {
  const reason = searchParams?.reason || "default";
  return <PremiumBenefits reason={reason} />;
}

export default function PricingPage({ searchParams }) {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="pt-24">
        <Suspense fallback={null}>
          <PricingContent searchParams={searchParams} />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

export const metadata = {
  title: "Footy Scouts | Premium",
  description: "Unlock premium features on Footy Scouts.",
};