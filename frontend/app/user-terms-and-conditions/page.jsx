import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Footy Scouts | User Terms and Conditions",
  description: "Community and conduct rules for using Footy Scouts.",
};

export default function UserTermsPage() {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 sm:pt-32 md:pt-36 pb-20 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          User Terms &amp; Conditions
        </h1>
        <p className="text-white/50 text-sm mb-10">Last updated: 14 October 2026</p>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-xl mb-3">1. Community Standards</h2>
            <p>Footy Scouts is built on respect. Treat every user — players, scouts, clubs, organizers — the way you'd want to be treated.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">2. Player Conduct</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Only create profiles for real, verifiable people.</li>
              <li>Do not use images or videos that aren't yours.</li>
              <li>Keep your stats accurate — exaggeration harms everyone.</li>
              <li>Respond to legitimate scout inquiries with courtesy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">3. Scout &amp; Institution Conduct</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Do not contact players with commercial offers outside the platform without consent.</li>
              <li>Verify player information before making any commitments.</li>
              <li>Do not share player data with third parties without permission.</li>
              <li>Maintain professional conduct in all messaging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">4. Tournament Organizer Conduct</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate information about tournaments you host.</li>
              <li>Honour prize money and agreements you make.</li>
              <li>Handle player and team data responsibly.</li>
              <li>Do not cancel events without reasonable notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">5. Prohibited Content</h2>
            <p>Do not upload or post:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nudity, sexual content, or content involving minors inappropriately.</li>
              <li>Hate speech, harassment, or threats.</li>
              <li>Content promoting violence or illegal activity.</li>
              <li>Malware or links to malicious sites.</li>
              <li>Copyrighted material you don't own or have permission to use.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">6. Reporting</h2>
            <p>
              If you encounter behaviour that violates these terms, report it
              via the{" "}
              <a href="/contact" className="text-[#D4AF6A] hover:underline">contact page</a>.
              We review all reports.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">7. Enforcement</h2>
            <p>Violations may result in:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A warning.</li>
              <li>Content removal.</li>
              <li>Temporary suspension.</li>
              <li>Permanent account termination.</li>
            </ul>
            <p className="mt-2">Serious violations may be reported to law enforcement.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">8. Privacy Reminder</h2>
            <p>
              Never share sensitive personal information (bank details, ID
              numbers, home address) with anyone you meet on the platform
              without verifying they are who they claim to be.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-xl mb-3">9. Contact</h2>
            <p>
              Questions or reports? Email{" "}
              <a href="mailto:footyscoutsworldwide@gmail.com" className="text-[#D4AF6A] hover:underline">
                footyscoutsworldwide@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}