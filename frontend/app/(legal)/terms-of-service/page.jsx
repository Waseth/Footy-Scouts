import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Footy Scouts | Terms of Service",
  description: "The terms that govern your use of Footy Scouts",
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#1C1928]">
      <div className="bg-[#242030] py-16 text-white">
        <div className="container mx-auto px-4">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Terms of Service</h1>
          <div className="flex items-center text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span>Terms of Service</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-lg bg-white/5 p-6 text-white/80 md:p-10">
          <h2 className="gold-font mb-4 text-2xl font-bold">1. Introduction</h2>
          <p className="mb-6">
            Welcome to Footy Scouts. These Terms of Service govern your use of our website and services. By creating
            an account or using the platform, you agree to be bound by these Terms. If you disagree with any part of
            them, please do not use our services.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">2. Accounts and Roles</h2>
          <p className="mb-3">
            Footy Scouts supports several account types, each with different capabilities and visibility:
          </p>
          <ul className="mb-6 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-white">Players</strong> create a profile to be discovered by scouts, agents,
              and clubs.
            </li>
            <li>
              <strong className="text-white">Scouts and agents</strong> search, shortlist, and contact players.
              Scout accounts require verification before profiles become publicly visible.
            </li>
            <li>
              <strong className="text-white">Institutions</strong> (clubs, academies, schools, and organizations) can
              build a public presence and organize tournaments.
            </li>
          </ul>
          <p className="mb-6">
            You are responsible for maintaining the accuracy of your profile and the confidentiality of your login
            credentials, and for all activity that occurs under your account.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">3. Acceptable Use</h2>
          <p className="mb-3">By using Footy Scouts, you agree not to:</p>
          <ul className="mb-6 list-disc space-y-2 pl-6">
            <li>Provide false information about your identity, age, or football experience</li>
            <li>Impersonate a player, scout, agent, or institution you do not represent</li>
            <li>Use player contact details for purposes outside legitimate recruitment</li>
            <li>Harass, discriminate against, or misrepresent yourself to another user</li>
            <li>Attempt to circumvent scout verification or platform security measures</li>
          </ul>

          <h2 className="gold-font mb-4 text-2xl font-bold">4. Tournaments</h2>
          <p className="mb-6">
            Organizers listing a tournament on Footy Scouts are responsible for the accuracy of the tournament
            details, the fair conduct of the event, and compliance with any applicable local regulations. Footy
            Scouts is not a party to the tournament itself and is not responsible for disputes between organizers and
            participants.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">5. Subscriptions and Payments</h2>
          <p className="mb-6">
            Some features, such as premium visibility or tournament registration, may require payment. Fees are
            disclosed before you complete a purchase. Subscriptions renew automatically unless cancelled before the
            renewal date, in line with the plan details shown at checkout.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">6. Verification</h2>
          <p className="mb-6">
            Scout and institution accounts are reviewed by our team before their profiles become visible to players.
            We may request supporting documentation and may suspend or decline verification at our discretion to
            protect the integrity of the network.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">7. Content and Intellectual Property</h2>
          <p className="mb-6">
            You retain ownership of the content you upload, including profile photos and biographies, but grant
            Footy Scouts a license to display it as part of the service. You are responsible for ensuring you have
            the right to share any content you upload.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">8. Service Availability</h2>
          <p className="mb-6">
            We aim to keep Footy Scouts available at all times but do not guarantee uninterrupted access. We may
            modify, suspend, or discontinue parts of the service, with notice where reasonably possible.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">9. Limitation of Liability</h2>
          <p className="mb-6">
            Footy Scouts facilitates connections between players, scouts, agents, and clubs, but does not guarantee
            recruitment outcomes, tournament results, or the accuracy of information provided by other users. Use of
            the platform is at your own discretion.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">10. Termination</h2>
          <p className="mb-6">
            We may suspend or terminate accounts that violate these Terms. You may close your account at any time
            from your dashboard settings.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">11. Changes to These Terms</h2>
          <p className="mb-6">
            We may update these Terms from time to time. Continued use of Footy Scouts after changes take effect
            constitutes acceptance of the updated Terms.
          </p>

          <h2 className="gold-font mb-4 text-2xl font-bold">12. Contact Us</h2>
          <p>
            Questions about these Terms can be sent to <span className="text-white">legal@footyscouts.com</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
