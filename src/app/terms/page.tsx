'use client';

import Link from 'next/link';
import { ArrowLeft, Leaf, ShieldAlert } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-grid-pattern py-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-xs font-bold text-[#2D5A27] dark:text-[#A8E6A3] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Brand Header */}
        <div className="flex items-center space-x-3 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="bg-[#7ED957] p-2 rounded-xl">
            <Leaf className="w-6 h-6 text-[#2D5A27]" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl font-poppins text-[#2D5A27] dark:text-[#7ED957]">
              EcoMind AI
            </h1>
            <span className="text-xs font-semibold text-gray-400">Legalitas & Privasi</span>
          </div>
        </div>

        {/* Content Document */}
        <div className="glass-panel p-8 rounded-[28px] space-y-8 text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-base font-extrabold font-poppins text-[#1F3B1A] dark:text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-green-500" />
              <span>Syarat dan Ketentuan Penggunaan</span>
            </h2>
            <p>
              Selamat datang di EcoMind AI. Dengan mengakses dan menggunakan platform ini, Anda setuju untuk tunduk pada syarat dan ketentuan berikut. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda disarankan untuk tidak melanjutkan penggunaan layanan kami.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Layanan ini hanya diperuntukkan bagi individu berusia minimal 13 tahun untuk aktivitas pribadi non-komersial.</li>
              <li>Anda bertanggung jawab menjaga kerahasiaan kredensial login (Email dan Kata Sandi) serta aktivitas di bawah akun Anda.</li>
              <li>Penggunaan AI dibatasi khusus untuk topik-topik lingkungan, daur ulang, dan kelestarian hidup. Segala upaya memanipulasi prompt atau penyalahgunaan API akan mengakibatkan penangguhan akun.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold font-poppins text-[#1F3B1A] dark:text-white">
              Kebijakan Privasi Data Pengguna
            </h2>
            <p>
              EcoMind AI berkomitmen penuh melindungi kerahasiaan informasi pribadi Anda. Dokumen ini menjelaskan pengumpulan, penggunaan, dan perlindungan data yang disimpan dalam sistem kami:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Pengumpulan Data:</strong> Kami mengumpulkan nama, email, catatan jejak karbon, lencana progress, serta unggahan bukti foto tantangan.</li>
              <li><strong>Penggunaan Informasi:</strong> Data digunakan untuk menghitung perolehan EcoPoints harian, tingkat level (XP), leaderboard global, serta melatih asisten AI mengingat konteks percakapan Anda (AI Memory).</li>
              <li><strong>Keamanan Data:</strong> Password Anda diamankan sepenuhnya menggunakan algoritma hash satu arah (bcrypt), serta cookie sesi dilindungi dengan enkripsi JWT menggunakan parameter HttpOnly dan Secure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold font-poppins text-[#1F3B1A] dark:text-white">
              Hubungi Kami
            </h2>
            <p>
              Jika Anda memiliki pertanyaan tentang kebijakan hukum ini, silakan hubungi tim administrasi kami melalui formulir kontak laporan di halaman Pengaturan Akun Anda.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
