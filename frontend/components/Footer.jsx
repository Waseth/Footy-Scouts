'use client';

import Link from 'next/link';

const solutions = [
  { id: 1, label: "Tournaments", href: "/tournaments" },
  { id: 2, label: "Partners", href: "/partners" },
  { id: 3, label: "Subscribe", href: "/subscribe" },
];

const resources = [
  { id: 1, label: "Privacy Policy", href: "/privacy-policy" },
  { id: 2, label: "Terms of Service", href: "/terms-of-service" },
  { id: 3, label: "User Terms and Conditions", href: "/user-terms-and-conditions" },
];

const company = [
  { id: 1, label: "Home", href: "/" },
  { id: 2, label: "About Us", href: "/about" },
  { id: 3, label: "Register", href: "/signup" },
  { id: 4, label: "Contact", href: "/contact" },
];

const developers = [
  { name: "Emmanuel Waseth", href: "https://github.com/Waseth" },
  { name: "Jeremy Akanle", href: "https://github.com/jere-eee" },
];

function GithubIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function SocialIcon({ children, href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-[#D4AF6A] hover:text-[#D4AF6A]"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#1C1928]">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        {/* ── Link columns ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3 md:space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-modified.png" alt="Logo" className="h-8 w-auto md:h-10" />
              <span className="text-white text-lg md:text-xl font-bold">Footy Scouts</span>
            </Link>
            <p className="text-xs md:text-sm text-white/40">
              A football recruitment network for players, scouts, and clubs.
            </p>
            <p className="text-xs md:text-sm text-white/30">
              Nairobi, Kenya
            </p>
            <p className="text-xs md:text-sm text-white/30">
              Tel: +254-757-283949
            </p>
            <div className="flex gap-2 pt-1 md:pt-2">
              <SocialIcon href="https://www.instagram.com/footyscouts.official/" label="Instagram">
                <svg className="h-3 w-3 md:h-4 md:w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4">Footy Scouts</h3>
            <ul className="space-y-1.5 md:space-y-2">
              {company.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="text-xs md:text-sm text-white/40 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4">Services</h3>
            <ul className="space-y-1.5 md:space-y-2">
              {solutions.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="text-xs md:text-sm text-white/40 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4">Resources</h3>
            <ul className="space-y-1.5 md:space-y-2">
              {resources.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="text-xs md:text-sm text-white/40 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Developed by ── */}
        <div className="mt-12 md:mt-16 pt-10 md:pt-12 border-t border-white/10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF6A] mb-6 md:mb-8">
            Developed by
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10">
            {developers.map((dev) => (
              <a
                key={dev.href}
                href={dev.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#242030] px-6 md:px-8 py-4 md:py-5 transition-all hover:border-[#D4AF6A]/60 hover:bg-[#D4AF6A]/5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#D4AF6A]/10"
              >
                <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#D4AF6A]/15 text-[#D4AF6A] transition-colors group-hover:bg-[#D4AF6A] group-hover:text-[#1C1928]">
                  <GithubIcon className="w-6 h-6 md:w-7 md:h-7" />
                </span>
                <div className="text-left">
                  <p className="text-base md:text-lg font-bold text-white group-hover:text-[#D4AF6A] transition-colors">
                    {dev.name}
                  </p>
                  <p className="text-xs md:text-sm text-white/40">Full-stack developer</p>
                </div>
              </a>
            ))}
          </div>

          {/* Copyright — centered under the developer cards */}
          <p className="mt-10 md:mt-12 text-center text-xs md:text-sm text-white/30">
            Copyright © {new Date().getFullYear()} Footy Scouts. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}