'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Trophy,
  Users,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
  Star,
  Eye
} from 'lucide-react';
import { api } from '@/lib/api';  // ✅ Remove type imports
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);  // ✅ Remove type annotation
  const [subscription, setSubscription] = useState(null);  // ✅ Remove type annotation
  const [stats, setStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await api.getMe();
        setUser(userData);
        setIsAdmin(userData.role === 'ADMIN');

        try {
          const subData = await api.getMySubscription();
          setSubscription(subData.subscription);
        } catch (e) {
          // No subscription yet
        }

        if (userData.role === 'ADMIN') {
          const adminStats = await api.getAdminDashboard();
          setStats(adminStats);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await api.logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1928] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1928]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-white/60 mt-1">
            {isAdmin ? 'Admin Dashboard' : `${user?.role || 'User'} Dashboard`}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Role</p>
                <p className="text-white font-semibold text-lg">{user?.role || '—'}</p>
              </div>
              <User className="text-[#D4AF6A] w-8 h-8" />
            </div>
          </div>

          <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Plan</p>
                <p className="text-white font-semibold text-lg">
                  {subscription?.plan || 'FREE'}
                </p>
              </div>
              <Star className={`w-8 h-8 ${subscription?.is_premium ? 'text-[#D4AF6A]' : 'text-white/30'}`} />
            </div>
          </div>

          <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Status</p>
                <p className="text-white font-semibold text-lg">
                  {user?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <ShieldCheck className={`w-8 h-8 ${user?.is_active ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>

          <div className="bg-[#242030] rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Verified</p>
                <p className="text-white font-semibold text-lg">
                  {user?.is_verified ? 'Yes' : 'No'}
                </p>
              </div>
              <Eye className={`w-8 h-8 ${user?.is_verified ? 'text-green-500' : 'text-yellow-500'}`} />
            </div>
          </div>
        </div>

        {/* Role-specific Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {user?.role === 'PLAYER' && (
            <>
              <Link href="/players/profile" className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 transition-all">
                <div className="flex items-center gap-4">
                  <User className="text-[#D4AF6A] w-8 h-8" />
                  <div>
                    <h3 className="text-white font-semibold">My Profile</h3>
                    <p className="text-white/60 text-sm">View and edit your player profile</p>
                  </div>
                </div>
              </Link>
              <Link href="/search" className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 transition-all">
                <div className="flex items-center gap-4">
                  <Users className="text-[#D4AF6A] w-8 h-8" />
                  <div>
                    <h3 className="text-white font-semibold">Find Scouts</h3>
                    <p className="text-white/60 text-sm">Search for scouts and agents</p>
                  </div>
                </div>
              </Link>
              <Link href="/tournaments" className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 transition-all">
                <div className="flex items-center gap-4">
                  <Calendar className="text-[#D4AF6A] w-8 h-8" />
                  <div>
                    <h3 className="text-white font-semibold">Tournaments</h3>
                    <p className="text-white/60 text-sm">Browse and register for tournaments</p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {user?.role === 'SCOUT' && (
            <>
              <Link href="/scouts/profile" className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 transition-all">
                <div className="flex items-center gap-4">
                  <User className="text-[#D4AF6A] w-8 h-8" />
                  <div>
                    <h3 className="text-white font-semibold">My Profile</h3>
                    <p className="text-white/60 text-sm">View and edit your scout profile</p>
                  </div>
                </div>
              </Link>
              <Link href="/search" className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 transition-all">
                <div className="flex items-center gap-4">
                  <Users className="text-[#D4AF6A] w-8 h-8" />
                  <div>
                    <h3 className="text-white font-semibold">Find Players</h3>
                    <p className="text-white/60 text-sm">Search for talented players</p>
                  </div>
                </div>
              </Link>
              <Link href="/tournaments" className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 transition-all">
                <div className="flex items-center gap-4">
                  <Trophy className="text-[#D4AF6A] w-8 h-8" />
                  <div>
                    <h3 className="text-white font-semibold">Tournaments</h3>
                    <p className="text-white/60 text-sm">Discover talent at tournaments</p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {isAdmin && (
            <Link href="/admin" className="bg-[#242030] rounded-lg p-6 border border-white/10 hover:border-[#D4AF6A]/50 transition-all">
              <div className="flex items-center gap-4">
                <Settings className="text-[#D4AF6A] w-8 h-8" />
                <div>
                  <h3 className="text-white font-semibold">Admin Panel</h3>
                  <p className="text-white/60 text-sm">Manage users, approvals, and content</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Admin Stats */}
        {isAdmin && stats && (
          <div className="bg-[#242030] rounded-lg p-6 border border-white/10 mb-8">
            <h2 className="text-white font-semibold text-lg mb-4">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/60 text-sm">Total Users</p>
                <p className="text-white font-bold text-2xl">{stats.users?.total || 0}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Players</p>
                <p className="text-white font-bold text-2xl">{stats.users?.players || 0}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Scouts</p>
                <p className="text-white font-bold text-2xl">{stats.users?.scouts || 0}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Tournaments</p>
                <p className="text-white font-bold text-2xl">{stats.tournaments || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <Footer />
    </div>
  );
}