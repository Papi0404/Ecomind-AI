'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  MessageSquare, 
  Trophy, 
  LineChart, 
  ArrowRight, 
  Sparkles, 
  CheckCircle,
  Menu,
  X,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is logged in
  const { data } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.auth.me().catch(() => ({ user: null })),
    retry: false,
  });
  
  const user = data?.user;

  // Custom animations helper
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern relative">
      {/* Decorative Background Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#7ED957]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-80 right-10 w-[450px] h-[450px] bg-[#A8E6A3]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 py-4 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-[#7ED957] p-2 rounded-xl">
            <Leaf className="w-6 h-6 text-[#2D5A27]" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider font-poppins text-[#2D5A27] dark:text-[#7ED957]">
              EcoMind AI
            </span>
            <span className="block text-[10px] font-bold text-[#A8E6A3] tracking-widest leading-none">SUSTAINABILITY</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
          <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-[#2D5A27] dark:hover:text-[#7ED957] transition-all">Fitur</a>
          <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-[#2D5A27] dark:hover:text-[#7ED957] transition-all">Cara Kerja</a>
          <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-[#2D5A27] dark:hover:text-[#7ED957] transition-all">Testimoni</a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <Link 
              href="/dashboard" 
              className="bg-[#2D5A27] hover:bg-[#1f3b1a] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-[#2D5A27]/10 flex items-center space-x-2 transition-all"
            >
              <span>Dashboard Saya</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-[#2D5A27] dark:text-[#A8E6A3] hover:text-[#1f3b1a] px-4 py-2 font-semibold transition-all"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                className="bg-[#2D5A27] hover:bg-[#1f3b1a] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-[#2D5A27]/10 transition-all"
              >
                Daftar Gratis
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu icon */}
        <button className="md:hidden p-1 text-gray-700 dark:text-gray-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[#FFF8E7] dark:bg-[#0B130A] border-b border-gray-200 dark:border-[#2D5A27] z-40 p-6 flex flex-col space-y-4 shadow-xl">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold">Fitur</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold">Cara Kerja</a>
          <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold">Testimoni</a>
          <hr className="border-gray-200 dark:border-gray-800" />
          {user ? (
            <Link 
              href="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="bg-[#2D5A27] text-white text-center py-3 rounded-xl font-bold"
            >
              Dashboard Saya
            </Link>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#2D5A27] dark:text-[#A8E6A3] text-center py-2 font-bold"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#2D5A27] text-white text-center py-3 rounded-xl font-bold"
              >
                Daftar Gratis
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 2. Hero Section */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Hero Content */}
        <motion.div 
          className="lg:col-span-7 space-y-6"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center space-x-2 bg-[#A8E6A3]/20 dark:bg-[#7ED957]/10 border border-[#7ED957]/30 px-3.5 py-1.5 rounded-full"
          >
            <Sparkles className="w-4 h-4 text-[#2D5A27] dark:text-[#7ED957]" />
            <span className="text-xs font-bold text-[#2D5A27] dark:text-[#7ED957] tracking-wide font-poppins uppercase">
              AI Lingkungan #1 di Indonesia
            </span>
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-4xl lg:text-6xl font-extrabold tracking-tight text-[#1F3B1A] dark:text-white leading-[1.15]"
          >
            AI untuk Masa Depan <br />
            <span className="text-[#2D5A27] dark:text-[#7ED957] bg-clip-text relative">
              Lingkungan
            </span> yang Lebih Baik
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-xl font-medium leading-relaxed"
          >
            EcoMind AI memadukan kecerdasan buatan, tantangan interaktif ramah lingkungan, dan pelacakan jejak karbon real-time untuk memandu perjalanan gaya hidup hijau Anda secara konsisten.
          </motion.p>

          {/* Action Buttons */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Link 
              href={user ? "/dashboard" : "/register"} 
              className="bg-[#2D5A27] hover:bg-[#1f3b1a] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-[#2D5A27]/20 flex items-center justify-center space-x-3 transition-all"
            >
              <span>Mulai Sekarang</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href={user ? "/chat" : "/login"} 
              className="glass-panel hover:bg-[#A8E6A3]/10 px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all"
            >
              <MessageSquare className="w-5 h-5 text-[#2D5A27] dark:text-[#7ED957]" />
              <span className="text-gray-700 dark:text-white">Coba Demo AI</span>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            variants={fadeInUp}
            className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/40?img=1" className="w-9 h-9 rounded-full border-2 border-[#FFF8E7] object-cover" />
              <img src="https://i.pravatar.cc/40?img=2" className="w-9 h-9 rounded-full border-2 border-[#FFF8E7] object-cover" />
              <img src="https://i.pravatar.cc/40?img=3" className="w-9 h-9 rounded-full border-2 border-[#FFF8E7] object-cover" />
              <img src="https://i.pravatar.cc/40?img=4" className="w-9 h-9 rounded-full border-2 border-[#FFF8E7] object-cover" />
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Dipercaya oleh <strong className="text-gray-700 dark:text-gray-200">50.000+</strong> pegiat bumi lestari.
            </span>
          </motion.div>
        </motion.div>

        {/* Right Hero Visual Cards */}
        <motion.div 
          className="lg:col-span-5 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.8 } }}
        >
          {/* Main Simulated AI Chat Card */}
          <div className="glass-panel p-6 rounded-[24px] space-y-4 shadow-xl relative z-10">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#7ED957]/20 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#2D5A27]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">EcoMind Assistant</h3>
                  <span className="text-[10px] text-green-500 font-semibold flex items-center space-x-1">
                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="bg-[#2D5A27]/5 dark:bg-[#7ED957]/5 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-[#2D5A27] dark:text-[#A8E6A3] font-medium">
                Jejak karbon Anda minggu ini **turun 18%** 🌿 Tetap pertahankan kebiasaan berjalan kaki Anda!
              </div>
              <div className="bg-gray-100 dark:bg-[#1f301a]/30 p-3 rounded-2xl ml-8 text-right font-medium">
                Bagaimana cara termudah mendaur ulang botol plastik di rumah?
              </div>
              <div className="bg-[#2D5A27] text-white p-3.5 rounded-2xl mr-8 shadow-md shadow-[#2D5A27]/10">
                Pilah botol, bersihkan sisa air, remas untuk mengurangi volume, lalu serahkan ke bank sampah terdekat untuk ditukar poin! ♻️
              </div>
            </div>
          </div>

          {/* Floaters Cards */}
          <div className="absolute -bottom-8 -left-8 bg-white dark:bg-[#122210] border border-[#A8E6A3] p-4 rounded-2xl shadow-xl z-20 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#7ED957]/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#2D5A27]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold">Tantangan Diselesaikan</p>
              <h4 className="font-bold text-sm text-[#2D5A27] dark:text-[#A8E6A3]">180,240+ Aksi</h4>
            </div>
          </div>

          <div className="absolute -top-6 -right-6 bg-white dark:bg-[#122210] border border-[#A8E6A3] p-4 rounded-2xl shadow-xl z-20 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#7ED957]/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#2D5A27]" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold">CO₂ Terserap</p>
              <h4 className="font-bold text-sm text-green-500">2.4 Juta kg</h4>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Features Section */}
      <section className="px-6 lg:px-12 py-20 bg-white/50 dark:bg-black/20" id="features">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[#2D5A27] dark:text-[#7ED957] font-extrabold text-sm uppercase font-poppins">✦ Fitur Utama</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1F3B1A] dark:text-white">
              Semua Alat untuk Memandu Kebiasaan Hijau Anda
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Platform modern kami menggabungkan kecerdasan buatan dengan gamifikasi interaktif untuk memberikan dampak nyata bagi bumi.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feat 1 */}
            <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-[#7ED957] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#7ED957]/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#2D5A27] dark:text-[#7ED957]" />
              </div>
              <h3 className="font-bold text-lg">AI Chat Khusus Lingkungan</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Konsultasikan jejak karbon, penghematan air, atau regulasi sampah. AI dibatasi khusus topik keberlanjutan untuk menjaga akurasi solusi.
              </p>
            </div>
            
            {/* Feat 2 */}
            <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-[#7ED957] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#A8E6A3]/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#2D5A27] dark:text-[#7ED957]" />
              </div>
              <h3 className="font-bold text-lg">Tantangan & Gamifikasi</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tingkatkan level dengan misi harian/mingguan seperti bersepeda atau diet nabati. Dapatkan EcoPoints dan kumpulkan lencana langka.
              </p>
            </div>

            {/* Feat 3 */}
            <div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-[#7ED957] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <LineChart className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-lg">Pelacak Jejak Karbon</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Catat kebiasaan harian Anda dan amati grafik pengurangan emisi CO₂ mingguan di dashboard modern Anda secara real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="bg-[#2D5A27] text-white p-8 lg:p-16 rounded-[40px] shadow-2xl relative overflow-hidden text-center space-y-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7ED957]/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl lg:text-5xl font-extrabold max-w-2xl mx-auto leading-tight">
            Siap Memulai Langkah Hijau Anda Hari Ini?
          </h2>
          <p className="text-lg text-[#A8E6A3] max-w-xl mx-auto font-medium">
            Daftarkan diri Anda sekarang gratis, kumpulkan EcoPoints pertama Anda, dan jadilah pahlawan lingkungan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href={user ? "/dashboard" : "/register"} 
              className="bg-[#7ED957] text-[#2D5A27] px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-[#8ee867] transition-all"
            >
              Daftar Sekarang
            </Link>
            <Link 
              href="/login" 
              className="border border-white/20 hover:bg-white/10 px-8 py-4 rounded-2xl font-bold transition-all"
            >
              Masuk ke Akun
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 font-semibold space-y-2">
        <div className="flex items-center justify-center space-x-2 pb-4">
          <Leaf className="w-5 h-5 text-[#7ED957]" />
          <span className="font-bold text-gray-600 dark:text-gray-300">EcoMind AI</span>
        </div>
        <p>© 2026 EcoMind AI. Dibuat dengan 🌿 untuk kelestarian bumi.</p>
        <div className="flex justify-center space-x-6 pt-2">
          <Link href="/terms" className="hover:underline">Syarat & Ketentuan</Link>
          <Link href="/terms" className="hover:underline">Kebijakan Privasi</Link>
        </div>
      </footer>
    </div>
  );
}
