"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LogIn, Search, ShoppingCart } from "lucide-react";


export default function Navbar() {
    return (
        <nav className="flex items-center fixed justify-between px-8 py-4 bg-[#1C192F] container mx-auto">
            {/* Logo */}
            <div className="flex items-center space-x-2">
                <Link href="/" className="text-white text-3xl font-bold">
                    <img src="logo.jpeg" alt="Logo" className="h-12 w-auto" />
                    <span className="text-[#C7E646] text-sm p-2">Let the stars shine</span>
                </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 text-white">
                <Link href="/" className="hover:text-black transition-colors">
                    Home
                </Link>
                <Link href="/search" className="hover:text-black transition-colors">
                   Search
                </Link>
                <Link href="/merch" className="hover:text-black transition-colors">
                    Merch
                </Link>
                <Link href="/tournaments" className="hover:text-black transition-colors">
                    Tournaments
                </Link>
                <Link href="/about" className="hover:text-black transition-colors">
                    About Us
                </Link>
                <Link href="/partners" className="hover:text-black transition-colors">
                    Partners
                </Link>
                <Link href="/contact" className="hover:text-black transition-colors">
                    Contact
                </Link>
                <Link href="/" className="hover:text-black transition-colors">
                    Language
                </Link>
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden">
                        <button className="text-white bg-[#1C192F] px-4 py-2 hover:text-black rounded-md" suppressHydrationWarning>
                            Menu
                        </button>
                        <ul className="flex flex-col space-y-4">
                            {[
                                { id: 1, href: "/", label: "Home" },
                                { id: 2, href: "/search", label: "Search" },
                                { id: 3, href: "/merch", label: "Merch" },
                                { id: 4, href: "/tournaments", label: "Tournaments" },
                                { id: 5, href: "/about", label: "About Us" },
                                { id: 6, href: "/contact", label: "Contact" },
                            ].map(({ href, label, id }) => (
                                <li key={id}>
                                    <Link
                                        href={href}
                                        className="block px-2 py-1 rounded hover:bg-white hover:text-black transition-colors"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
            </div>


            {/* Icons */}
            <div className="flex items-center space-x-6">
                <Search className="text-white hover:text-black w-6 h-6" />
                <ShoppingCart className="text-white hover:text-black w-6 h-6" />
                <LogIn className="text-white hover:text-black w-6 h-6" />
            </div>
        </nav>
    )
}