import Link from "next/link";

export default function AboutCTA() {
  return (
    <section className="relative z-10 overflow-hidden bg-[#242030] py-20 lg:py-28.75 min-h-screen">
      <div className="container relative mx-auto overflow-hidden px-6 lg:px-16">
        <div className="-mx-4 flex flex-wrap items-stretch">
          <div className="w-full px-4">
            <div className="mx-auto max-w-142.5 text-center">
              <h2 className="mb-2.5 text-3xl font-bold text-white md:text-[38px] md:leading-[1.44]">
                Create Your <strong className="gold-font">FREE</strong>
                <br />
                Player Or Scout Profile
              </h2>

              <p className="mx-auto mb-6 max-w-128.75 text-base leading-normal text-white/70">
                Build a profile to appear in searches and get discovered by scouts, agents,
                and clubs. Increase your visibility and connect with real opportunities
                across the football network.
              </p>

              <p className="mx-auto mb-6 max-w-128.75 text-base leading-normal text-white/70">
                Already with a club? No problem — set your status and current team. Keep
                your profile up to date and searchable while our team supports you
                throughout your football journey.
              </p>

              <Link
                href="/signup"
                className="inline-block rounded-md bg-white px-7 py-3 text-base font-medium text-black shadow-1 transition duration-300 ease-in-out hover:bg-gray-2 hover:text-body-color"
              >
                Create your Player or Scout Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative corner shapes, same treatment as the reference — just softened to gold/white */}
      <span className="pointer-events-none absolute left-0 top-0">
        <svg width="495" height="470" viewBox="0 0 495 470" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="55" cy="442" r="138" stroke="white" strokeOpacity="0.04" strokeWidth="50" />
          <circle cx="446" r="39" stroke="white" strokeOpacity="0.04" strokeWidth="20" />
          <path
            d="M245.406 137.609L233.985 94.9852L276.609 106.406L245.406 137.609Z"
            stroke="#D4AF6A"
            strokeOpacity="0.25"
            strokeWidth="12"
          />
        </svg>
      </span>
      <span className="pointer-events-none absolute bottom-0 right-0">
        <svg width="493" height="470" viewBox="0 0 493 470" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="462" cy="5" r="138" stroke="white" strokeOpacity="0.04" strokeWidth="50" />
          <circle cx="49" cy="470" r="39" stroke="white" strokeOpacity="0.04" strokeWidth="20" />
          <path
            d="M222.393 226.701L272.808 213.192L259.299 263.607L222.393 226.701Z"
            stroke="#D4AF6A"
            strokeOpacity="0.2"
            strokeWidth="13"
          />
        </svg>
      </span>
    </section>
  );
}