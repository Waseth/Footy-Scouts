import AboutIntro from "@/components/about/AboutIntro";
import AboutCTA from "@/components/about/AboutCTA";
import PartnersGrid from "@/components/about/PartnersGrid";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata = {
    title: "Footy Scouts | About",
    description: "Our vision and mission at Footy Scouts",
};

export default function AboutPage() {
    return (
        <main>
            <Navbar />
            <AboutIntro />
            <AboutCTA />
            <PartnersGrid />
            <Footer />
        </main>
    );
}