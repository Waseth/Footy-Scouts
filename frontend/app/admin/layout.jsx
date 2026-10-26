"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Receipt, CreditCard, Users, Image as ImageIcon,
  LogOut, ArrowLeft, Loader2, ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/payouts", label: "Payouts", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!api.isAdmin()) {
      // logged in but not admin — kick out to regular dashboard
      router.replace("/dashboard");
      return;
    }
    setIsAdmin(true);
    setChecking(false);
  }, [pathname, router]);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF6A] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white/60">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <header className="border-b border-white/10 bg-[#242030]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to site
              </Link>
              <span className="text-white/20">·</span>
              <span className="text-[#D4AF6A] font-semibold text-sm">
                Admin Console
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                    active
                      ? "text-[#D4AF6A] border-[#D4AF6A]"
                      : "text-white/60 border-transparent hover:text-white hover:border-white/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-6xl">{children}</main>
    </div>
  );
}