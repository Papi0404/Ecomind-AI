'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Leaf, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

import { Suspense } from 'react';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp } = useAuth();
  
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Resend OTP State
  const [countdown, setCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      window.location.href = '/register';
    }
  }, [email]);

  // Countdown clock effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendMessage('');
    setLoading(true);

    try {
      await verifyOtp({ email, otp });
    } catch (err: any) {
      setError(err.message || 'OTP verifikasi gagal atau kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendMessage('');
    setResendLoading(true);

    try {
      await api.auth.resendOtp({ email });
      setResendMessage('Kode OTP baru telah dikirim ke email Anda.');
      setCountdown(60); // lock resend for 60 seconds
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#8EC3B0]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-[28px] shadow-2xl relative z-10 space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-[#8EC3B0] p-3 rounded-2xl shadow-md">
            <ShieldCheck className="w-8 h-8 text-[#1A403E]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1A403E] font-poppins">
            Verifikasi Akun
          </h2>
          <p className="text-xs text-gray-700 font-medium leading-relaxed">
            Masukkan 6 digit kode OTP yang telah dikirim ke email <br />
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

        {/* Resend Success Message */}
        {resendMessage && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-700 text-xs font-semibold px-4 py-3 rounded-xl">
            {resendMessage}
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block text-center">
              Kode OTP 6 Digit
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-white border border-gray-300 rounded-xl py-4 text-center text-3xl font-extrabold tracking-[10px] text-gray-900 outline-none focus:border-[#8EC3B0] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1A403E]/20 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <span>Verifikasi & Aktifkan</span>
            )}
          </button>
        </form>

        {/* Resend Action */}
        <div className="text-center text-xs text-gray-500 font-semibold">
          Tidak menerima kode?{' '}
          {countdown > 0 ? (
            <span className="text-gray-400">
              Kirim ulang dalam <strong className="text-gray-700">{countdown}s</strong>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[#1A403E] font-bold hover:underline inline-flex items-center space-x-1"
            >
              {resendLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              <span>Kirim Ulang</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-grid-pattern flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1A403E] animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
