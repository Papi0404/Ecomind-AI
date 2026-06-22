'use client';

import { useEffect } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Global Boundary Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-3xl text-red-500 animate-pulse">
        <AlertOctagon className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Terjadi Kesalahan Sistem</h2>
        <p className="text-xs text-gray-400 font-semibold max-w-sm leading-relaxed">
          Terjadi kegagalan pemrosesan pada halaman ini. Silakan muat ulang atau coba kembali beberapa saat lagi.
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="bg-[#2D5A27] hover:bg-[#1f3b1a] text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-[#2D5A27]/20 inline-flex items-center space-x-2"
      >
        <RefreshCw className="w-4 h-4 animate-spin-slow" />
        <span>Coba Lagi</span>
      </button>
    </div>
  );
}
