'use client';

import Link from 'next/link';
import { Leaf, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col items-center justify-center p-6 text-center space-y-6">
      {/* Decorative Orbs */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#7ED957]/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="bg-[#7ED957] p-4 rounded-3xl relative z-10 shadow-lg shadow-[#7ED957]/10 animate-bounce">
        <Leaf className="w-12 h-12 text-[#2D5A27]" />
      </div>

      <div className="space-y-2 relative z-10">
        <h1 className="text-6xl font-extrabold font-poppins text-[#2D5A27]">404</h1>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-gray-400 font-semibold max-w-sm leading-relaxed">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan. Mari kembali ke bumi lestari.
        </p>
      </div>

      <Link
        href="/"
        className="bg-[#2D5A27] hover:bg-[#1f3b1a] text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-[#2D5A27]/20 inline-flex items-center space-x-2 relative z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>
    </div>
  );
}
