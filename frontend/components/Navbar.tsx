'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search, ShoppingCart, LogIn, User, LogOut } from 'lucide-react';
import { api } from '@/lib/api';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserRole(user.role);
      } catch (e) {
        // Invalid user data
      }
    }
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setIsLoggedIn(false);
    setUserRole(null);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/players', label: 'Players' },
    { href: '/scouts', label: 'Scouts' },
    { href: '/tournaments', label: 'Tournaments' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1C1928]/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Footy Scouts" className="h-10 w-auto" />
            <span className="text-white text-xl font-bold hidden sm:block">Footy Scouts</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition ${
                  isActive(link.href)
                    ? 'text-[#D4AF6A] font-medium'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <Link href="/search" className="text-white/70 hover:text-white transition">
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/merch" className="text-white/70 hover:text-white transition hidden sm:block">
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#D4AF6A]/10 text-[#D4AF6A] hover:bg-[#D4AF6A]/20 transition text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white/60 hover:text-white transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF6A] text-[#1C1928] font-medium hover:bg-[#D4AF6A]/90 transition text-sm"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white/70 hover:text-white transition"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden bg-[#1C1928] border-b border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container mx-auto px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2.5 rounded-lg transition ${
                isActive(link.href)
                  ? 'bg-[#D4AF6A]/10 text-[#D4AF6A] font-medium'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10">
            <Link
              href="/merch"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition"
            >
              <ShoppingCart className="w-5 h-5" />
              Merch
            </Link>
            {!isLoggedIn && (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#D4AF6A] text-[#1C1928] font-medium hover:bg-[#D4AF6A]/90 transition mt-2"
              >
                <LogIn className="w-5 h-5" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}