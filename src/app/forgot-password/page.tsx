'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Mail, AlertTriangle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.auth.forgotPassword({ email });
      // Redirect to Reset Password
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses permintaan lupa password.');
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
            <Leaf className="w-8 h-8 text-[#1A403E]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1A403E] font-poppins">
            Lupa Password
          </h2>
          <p className="text-sm text-gray-700 font-medium leading-relaxed">
            Masukkan alamat email terdaftar Anda untuk menerima kode pemulihan password.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Forgot Password Form */}
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
                className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-12 pr-4 text-sm font-medium text-gray-900 outline-none focus:border-[#8EC3B0] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1A403E]/20 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Kirim Kode Pemulihan</span>
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
