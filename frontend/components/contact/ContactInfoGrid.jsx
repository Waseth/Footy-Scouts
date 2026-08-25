import SectionEyebrow from "./SectionEyebrow";

const items = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    ),
    title: "Visit us",
    content: (
      <>
        ESA Springette Office Park
        <br />
        Spring Valley, Nairobi
      </>
    ),
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        />
      </svg>
    ),
    title: "Email us",
    content: (
      <a href="mailto:footyscoutsworldwide@gmail.com" className="transition-colors hover:text-[#D4AF6A]">
        footyscoutsworldwide@gmail.com
      </a>
    ),
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
        />
      </svg>
    ),
    title: "Call us",
    content: (
      <a href="tel:+254712345678" className="block transition-colors hover:text-[#D4AF6A]">
        +254 712 345 678
      </a>
    ),
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Support hours",
    content: (
      <>
        Mon–Fri: 8am – 6pm
        <br />
        Sat: 9am – 2pm EAT
      </>
    ),
  },
];

export default function ContactInfoGrid() {
  return (
    <section className="border-y border-white/8 bg-white-[0.02] p-8">
      <div className="container mx-auto px-6 py-18 sm:px-8 sm:py-22 lg:px-12 lg:py-24">
        <SectionEyebrow>Contact Information</SectionEyebrow>
        <h2 className="mb-12 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          How to reach us
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-300 hover:border-[#D4AF6A]/30 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-[#D4AF6A] transition-transform duration-300 group-hover:scale-x-100" />
              <div
                className="pointer-events-none absolute right-4 top-3 select-none text-6xl font-black leading-none text-white/[0.04]"
                aria-hidden
              >
                0{i + 1}
              </div>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF6A]/10 text-[#D4AF6A] transition-colors duration-300 group-hover:bg-[#D4AF6A] group-hover:text-[#1C1928]">
                {item.icon}
              </div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors duration-300 group-hover:text-[#D4AF6A]">
                {item.title}
              </h3>
              <div className="text-sm leading-7 text-white/60">{item.content}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}