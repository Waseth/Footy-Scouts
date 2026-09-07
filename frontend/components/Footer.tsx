'use client';

import Link from 'next/link';
import Image from 'next/image';

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

function SocialIcon({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-[#D4AF6A] hover:text-[#D4AF6A]"
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#1C1928]">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.jpeg" alt="Logo" className="h-10 w-auto" />
              <span className="text-white text-xl font-bold">Footy Scouts</span>
            </Link>
            <p className="text-sm text-white/40">
              A football recruitment network for players, scouts, and clubs.
            </p>
            <p className="text-sm text-white/30">
              Riara Rd, Nairobi, Kenya
            </p>
            <p className="text-sm text-white/30">
              Tel: +254-712-345678
            </p>
            <div className="flex gap-2 pt-2">
              <SocialIcon href="https://facebook.com">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://linkedin.com">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://instagram.com">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://twitter.com">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Footy Scouts</h3>
            <ul className="space-y-2">
              {company.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              {solutions.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {resources.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h3 className="text-white font-semibold mb-4">Download App</h3>
            <a
              href="#"
              className="inline-flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:border-[#D4AF6A]/50 hover:bg-white/10"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.4l2.458 1.42c.542.314.542 1.232 0 1.546l-2.149 1.243-2.543-2.543 2.234-2.666zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-wider opacity-80">Android App on</span>
                <span className="text-base font-semibold">GOOGLE PLAY</span>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/30">
              Copyright © {new Date().getFullYear()} Footy Scouts. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy-policy" className="text-sm text-white/30 hover:text-white transition">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-white/30 hover:text-white transition">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}