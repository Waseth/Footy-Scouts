import Image from "next/image";
import Link from "next/link";

/* ─── Footer link columns ──────────────────────────────── */
const solutions = [
    { id: 1, label: "Tournaments", href: "/" },
    { id: 2, label: "Partners", href: "/" },
    { id: 3, label: "Subscribe", href: "/" },
];

const resources = [
    { id: 1, label: "Privacy Policy", href: "/" },
    { id: 2, label: "Terms of Service", href: "/" },
    { id: 3, label: "User Terms and Conditions", href: "/" },
];

const company = [
    { id: 1, label: "Home", href: "/" },
    { id: 2, label: "About Us", href: "/about" },
    { id: 3, label: "Register", href: "/auth/signup" },
    { id: 4, label: "Contact", href: "/contact" },
];



/* ─── Social icons (inline SVGs) ────────────────────────── */
function SocialIcon({ children, href }: { children: React.ReactNode; href: string }) {
    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-tertiary/60 text-secondary/70 transition-colors hover:border-primary hover:text-primary"
        >
            {children}
        </Link>
    );
}

/* ─── Footer ────────────────────────────────────────────── */
export default function Footer() {
    return (
        <footer className="border-t border-tertiary/30 bg-[#1C192F] text-secondary">
            {/* Main grid */}
            <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

                    {/* Column 1 — Brand */}
                    <div className="lg:col-span-1 space-y-4">
                        <img src="logo.jpeg" alt="Logo" className="h-12 w-auto" />
                        <Link href="/" className="text-white text-3xl font-bold">
                            Footy Scouts <span className="text-[#C7E646] text-sm p-2">Let the stars shine</span>
                        </Link>
                        <p className="text-sm pt-6 leading-relaxed text-secondary/70">
                            Riara Rd, Nairobi, Kenya
                        </p>
                        <p className="text-sm text-secondary/70">
                            Mail: info@footyscouts.com
                        </p>
                        <p className="text-sm text-secondary/70">
                            Tel: +254-712-345678 | +254-712-345679
                        </p>

                        {/* Social icons */}
                        <div className="flex gap-2 pt-2">
                            {/* Facebook */}
                            <SocialIcon href="https://facebook.com">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                                </svg>
                            </SocialIcon>
                            {/* LinkedIn */}
                            <SocialIcon href="https://linkedin.com">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </SocialIcon>
                            {/* Instagram */}
                            <SocialIcon href="https://instagram.com">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                            </SocialIcon>
                            {/* Twitter / X */}
                            <SocialIcon href="https://twitter.com">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </SocialIcon>
                            {/* TikTok */}
                            <SocialIcon href="https://tiktok.com">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                </svg>
                            </SocialIcon>
                        </div>
                    </div>

                    {/* Column 2 — The Company */}
                    <div>
                        <h3 className="mb-4 text-base font-bold text-secondary">Footy Scouts</h3>
                        <ul className="space-y-3">
                            {company.map((link) => (
                                <li key={link.id}>
                                    <Link href={link.href} className="text-sm text-secondary/70 transition-colors hover:text-primary">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3 — Customer Services */}
                    <div>
                        <h3 className="mb-4 text-base font-bold text-secondary">Services</h3>
                        <ul className="space-y-3">
                            {solutions.map((link) => (
                                <li key={link.id}>
                                    <Link href={link.href} className="text-sm text-secondary/70 transition-colors hover:text-primary">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3 — Our Information */}
                    <div>
                        <h3 className="mb-4 text-base font-bold text-secondary">Our Information</h3>
                        <ul className="space-y-3">
                            {resources.map((link) => (
                                <li key={link.id}>
                                    <Link href={link.href} className="text-sm text-secondary/70 transition-colors hover:text-primary">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>



                    {/* Column 5 — Download App */}
                    <div>
                        <h3 className="mb-4 text-base font-bold text-secondary">Download App</h3>
                        <a
                            href="#"
                            className="inline-flex items-center gap-3 rounded-lg border border-tertiary/60 bg-[#1C192F] px-5 py-3 text-white transition-colors hover:border-black"
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
            </div>

            {/* Bottom bar */}
            <div className="border-t border-tertiary/30">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-5 sm:flex-row lg:px-8">
                    <p className="text-sm text-secondary/60">
                        Copyright © {new Date().getFullYear()} Footy Scouts ® All rights reserved.
                    </p>

                    {/* Stats
                    <div className="flex flex-wrap justify-center gap-8">
                        {stats.map((stat) => (
                            <div key={stat.id} className="text-center">
                                <p className="text-lg font-bold text-secondary">{stat.value}</p>
                                <p className="text-xs italic text-secondary/60">{stat.label}</p>
                            </div>
                        ))}
                    </div> */}
                </div>
            </div>
        </footer>
    );
}