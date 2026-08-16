import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Footy Scouts | Privacy Policy",
  description: "How Footy Scouts collects, uses, and protects your data",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#1C1928]">
      <div className="bg-[#242030] py-16 text-white">
        <div className="container mx-auto px-4">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Privacy Policy</h1>
          <div className="flex items-center text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-lg bg-white/5 p-6 text-white/80 md:p-10">
          <h2 className="gold-font mb-4 text-2xl font-bold">1. Introduction</h2>
          <p className="mb-6">
            Footy Scouts connects players, coaches, scouts, agents, clubs, and analysts across the football
            recruitment pipeline. This Privacy Policy explains what information we collect, how we use it, and the
            choices you have when you create a profile or use our services.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">2. Information We Collect</h2>
          <p className="mb-3">We collect the following categories of information:</p>
          <ul className="mb-6 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-white">Account information:</strong> name, email address, and password used to
              register and log in.
            </li>
            <li>
              <strong className="text-white">Profile information:</strong> depending on your role, this may include
              position, nationality, date of birth, current team or school, biography, contact number, and profile
              photo (players); scouting region, agency affiliation, and verification documents (scouts); or
              institution type, location, and logo (clubs, academies, and organizations).
            </li>
            <li>
              <strong className="text-white">Tournament information:</strong> registration details for tournaments
              you organize or enter, including participant or team information.
            </li>
            <li>
              <strong className="text-white">Communications:</strong> messages you send through the platform between
              players, scouts, agents, and clubs.
            </li>
            <li>
              <strong className="text-white">Payment information:</strong> billing details processed for
              subscriptions or tournament fees, handled by our payment processor.
            </li>
            <li>
              <strong className="text-white">Usage and technical data:</strong> IP address, device and browser
              information, and how you interact with the platform.
            </li>
          </ul>

          <h2 className="gold-font mb-4 text-2xl font-bold">3. How We Use Your Information</h2>
          <ul className="mb-6 list-disc space-y-2 pl-6">
            <li>To create and display your profile to the audience appropriate for your role</li>
            <li>To verify scout and institution accounts before granting them visibility into player data</li>
            <li>To operate messaging, tournament registration, and subscription features</li>
            <li>To process payments and send related receipts</li>
            <li>To send account, security, and service notifications</li>
            <li>To maintain the safety and integrity of the platform</li>
          </ul>

          <h2 className="gold-font mb-4 text-2xl font-bold">4. Who Can See Your Information</h2>
          <p className="mb-6">
            Player profiles are visible to registered scouts, agents, and clubs, with contact details shown only if
            you choose to make them visible. Scout and institution profiles are not publicly visible until our team
            has verified the account. We do not sell your personal information to third parties.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">5. Data Retention</h2>
          <p className="mb-6">
            We retain your information for as long as your account is active, or as needed to provide the service,
            comply with legal obligations, resolve disputes, and enforce our agreements. You can request deletion of
            your account at any time.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">6. Your Choices</h2>
          <ul className="mb-6 list-disc space-y-2 pl-6">
            <li>Update or correct your profile information at any time from your dashboard</li>
            <li>Control whether your contact details are visible to scouts</li>
            <li>Request a copy or deletion of your data by contacting us</li>
            <li>Opt out of non-essential email communications</li>
          </ul>

          <h2 className="gold-font mb-4 text-2xl font-bold">7. Data Security</h2>
          <p className="mb-6">
            We use industry-standard measures, including password hashing and access controls, to protect your
            information. No method of transmission or storage is completely secure, and we cannot guarantee absolute
            security.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">8. Children's Privacy</h2>
          <p className="mb-6">
            Footy Scouts supports grassroots football and may be used by minors under the supervision of a parent,
            guardian, coach, or academy administrator. Accounts for players under 18 should be created and managed
            with appropriate consent and oversight.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">9. Changes to This Policy</h2>
          <p className="mb-6">
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting
            the updated policy on this page with a new effective date.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">10. Contact Us</h2>
          <p>
            Questions about this policy or your data can be sent to{" "}
            <span className="text-white">privacy@footyscouts.com</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
