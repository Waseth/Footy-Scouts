// frontend/app/blog/page.jsx
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Footy Scouts | Blog",
  description: "Stories, tips, and news from the Footy Scouts network.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl text-center">
        <span className="text-[#D4AF6A] mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em]">
          Footy Scouts Blog
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
          Stories from the <span className="text-[#D4AF6A]">network</span>
        </h1>
        <p className="text-white/60 max-w-xl mx-auto mb-8">
          Player journeys, scouting insights, and the behind-the-scenes of grassroots
          football. First posts coming soon.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-[#D4AF6A] text-[#1C1928] px-6 py-3 font-medium hover:bg-[#c9a45f] transition"
        >
          Back to home
        </Link>
      </div>
      <Footer />
    </div>
  );
}