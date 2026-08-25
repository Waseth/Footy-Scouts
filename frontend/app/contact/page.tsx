import SectionEyebrow from "@/components/contact/SectionEyebrow";
import ContactForm from "@/components/contact/ContactForm";
import ContactInfoGrid from "@/components/contact/ContactInfoGrid";

export const metadata = {
  title: "Footy Scouts | Contact",
  description: "Get in touch with the Footy Scouts team",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      <section className="bg-[#1C1928] p-8">
        <div className="container mx-auto px-6 py-18 sm:px-8 sm:py-22 lg:px-12 lg:py-24">
          <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-24">
            <div className="lg:sticky lg:top-24">
              <SectionEyebrow>Send us a message</SectionEyebrow>

              <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                We&apos;d love to
                <br />
                hear from you.
              </h1>

              <p className="mb-10 max-w-md text-sm leading-8 text-white/60 sm:text-base">
                Whether you&apos;re a player looking to get scouted, a scout with a
                question about verification, or a club wanting to list a tournament —
                fill out the form and our team will get back to you.
              </p>

              <div className="flex items-center gap-4 rounded-3xl bg-white/5 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF6A] text-[#1C1928]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                </div>

                <div>
                  <p className="mb-0.5 text-[10px] uppercase tracking-[0.18em] text-white/45">
                    Prefer to talk?
                  </p>
                  <a
                    href="tel:+254712345678"
                    className="gold-font text-sm font-semibold tracking-wide transition-colors hover:text-white"
                  >
                    +254 712 345 678
                  </a>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      <ContactInfoGrid />
    </div>
  );
}