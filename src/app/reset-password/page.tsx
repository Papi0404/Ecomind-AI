'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Lock, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';

import { Suspense } from 'react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.auth.resetPassword({ email, otp, newPassword });
      setSuccess('Password berhasil diatur ulang. Silakan login kembali.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyetel ulang password. Periksa kode OTP Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#8EC3B0]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-[28px] shadow-2xl relative z-10 space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-[#8EC3B0] p-3 rounded-2xl shadow-md">
            <Lock className="w-8 h-8 text-[#1A403E]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1A403E] font-poppins">
            Setel Ulang Password
          </h2>
          <p className="text-xs text-gray-700 font-medium leading-relaxed">
            Masukkan kode OTP 6-digit dan password baru untuk akun <br />
            <strong className="text-gray-900">{email}</strong>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-700 text-xs font-semibold px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Kode OTP 6 Digit
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-white border border-gray-300 rounded-xl py-3 text-center text-xl font-bold tracking-[4px] text-gray-900 outline-none focus:border-[#8EC3B0] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Password Baru
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 outline-none focus:border-[#8EC3B0] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6 || newPassword.length < 6}
            className="w-full bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1A403E]/20 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memperbarui Password...</span>
              </>
            ) : (
              <span>Simpan Password Baru</span>
            )}
          </button>
        </form>

        {/* Footer Redirect */}
        <p className="text-center text-xs text-gray-500 font-semibold">
          Kembali ke{' '}
          <Link 
            href="/login" 
            className="text-[#1A403E] font-bold hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-grid-pattern flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1A403E] animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
