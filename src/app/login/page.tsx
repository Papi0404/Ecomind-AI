'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Lock, Mail, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      window.location.href = redirectPath;
    } catch (err: any) {
      if (err.data?.unverified) {
        // Redirection to Verify OTP page
        window.location.href = `/verify-otp?email=${encodeURIComponent(err.data.email)}`;
      } else {
        setError(err.message || 'Email atau password salah.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#7ED957]/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="w-full max-w-md glass-panel p-8 rounded-[28px] shadow-2xl relative z-10 space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-[#7ED957] p-3 rounded-2xl shadow-md">
            <Leaf className="w-8 h-8 text-[#2D5A27]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1F3B1A] dark:text-white font-poppins">
            Selamat Datang di EcoMind
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Masuk untuk melanjutkan aksi pelestarian bumi.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-[#7ED957] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Kata Sandi
              </label>
              <Link 
                href="/forgot-password" 
                className="text-xs font-bold text-[#2D5A27] dark:text-[#A8E6A3] hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-[#7ED957] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D5A27] hover:bg-[#1f3b1a] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#2D5A27]/20 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk Sekarang</span>
            )}
          </button>
        </form>

        {/* Footer Redirect */}
        <p className="text-center text-xs text-gray-500 font-semibold">
          Belum memiliki akun?{' '}
          <Link 
            href="/register" 
            className="text-[#2D5A27] dark:text-[#A8E6A3] font-bold hover:underline"
          >
            Daftar Gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
