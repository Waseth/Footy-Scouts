'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search, ShoppingCart, LogIn, User, LogOut, Bell } from 'lucide-react';
import { api } from '@/lib/api';

const GOLD = '#D4AF6A';
const DARK = '#1C1928';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
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
      } catch {}
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let mounted = true;
    const fetchCount = async () => {
      try {
        const count = await api.getUnreadNotificationCount();
        if (mounted) setUnreadCount(count);
      } catch {}
    };
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isLoggedIn, pathname]);

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

  const isActive = (href) =>
    pathname === href || pathname?.startsWith(href + '/');

  return (
    <nav
      style={{ backgroundColor: 'rgba(28, 25, 40, 0.95)' }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10"
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 sm:gap-2">
            <img
              src="/logo-modified.png"
              alt="Footy Scouts"
              className="h-8 sm:h-10 w-auto"
            />
            <span className="text-white text-base sm:text-xl font-bold hidden xs:block">
              Footy Scouts
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive(link.href) ? GOLD : 'rgba(255,255,255,0.7)',
                  fontWeight: isActive(link.href) ? 500 : 400,
                }}
                className="text-sm transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/search"
              className="text-white/70 hover:text-white transition"
              aria-label="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            {isLoggedIn && (
              <Link
                href="/notifications"
                className="relative text-white/70 hover:text-white transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span
                    style={{ backgroundColor: GOLD, color: DARK }}
                    className="absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              href="/merch"
              className="text-white/70 hover:text-white transition hidden sm:block"
              aria-label="Merch"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/dashboard"
                  style={{
                    color: GOLD,
                    borderColor: GOLD,
                    backgroundColor: 'transparent',
                  }}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-xs sm:text-sm font-medium"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white/60 hover:text-white transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  style={{
                    color: GOLD,
                    borderColor: GOLD,
                    backgroundColor: 'transparent',
                  }}
                  className="hidden sm:inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 rounded-lg border font-medium text-xs sm:text-sm"
                >
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  style={{
                    backgroundColor: GOLD,
                    color: DARK,
                  }}
                  className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm"
                >
                  Sign up
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white/70 hover:text-white transition p-1"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        style={{ backgroundColor: DARK }}
        className={`md:hidden border-b border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              style={{
                color: isActive(link.href) ? GOLD : 'rgba(255,255,255,0.7)',
                backgroundColor: isActive(link.href)
                  ? 'rgba(212, 175, 106, 0.1)'
                  : 'transparent',
              }}
              className="block px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition text-sm sm:text-base"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 sm:pt-4 border-t border-white/10 space-y-2">
            <Link
              href="/merch"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-white/70 hover:bg-white/5 transition text-sm sm:text-base"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              Merch
            </Link>

            {!isLoggedIn && (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: GOLD,
                    borderColor: GOLD,
                    backgroundColor: 'transparent',
                  }}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border font-medium transition text-sm sm:text-base"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  style={{ backgroundColor: GOLD, color: DARK }}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition text-sm sm:text-base"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}