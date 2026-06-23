'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState } from 'react';
import {
  Leaf, MessageSquare, Trophy, ArrowRight, Sparkles,
  ShieldCheck, Trash2, Droplet, Zap, Users, AlertTriangle,
  CheckCircle2, BookOpen, Menu, X, Globe, Phone, FileText
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.auth.me().catch(() => ({ user: null })),
    retry: false,
  });
  const user = data?.user;

  return (
    <div className="min-h-screen bg-[#FAF6EB] text-[#111111]">

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-[#FAF6EB]/90 backdrop-blur border-b border-[#8EC3B0]/30 py-4 px-6 lg:px-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-[#1A403E] p-2 rounded-xl">
            <Leaf className="w-5 h-5 text-[#8EC3B0]" />
          </div>
          <div>
            <span className="font-extrabold text-lg font-poppins text-[#1A403E]">EcoMind AI</span>
            <span className="block text-[9px] font-bold text-[#8EC3B0] tracking-widest">KOMUNITAS & LINGKUNGAN</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-700">
          <a href="#studi-kasus" className="hover:text-[#1A403E] transition-colors">Studi Kasus</a>
          <a href="#ai-flow" className="hover:text-[#1A403E] transition-colors">Cara Kerja AI</a>
          <a href="#responsible-ai" className="hover:text-[#1A403E] transition-colors">Responsible AI</a>
          <a href="#disclosure" className="hover:text-[#1A403E] transition-colors">Disclosure</a>
        </nav>

        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <Link href="/dashboard" className="bg-[#1A403E] text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-[#122c2b] transition-all">
              <span>Dashboard</span><ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-[#1A403E] font-bold px-4 py-2 hover:underline">Masuk</Link>
              <Link href="/register" className="bg-[#1A403E] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#122c2b] transition-all">Daftar Gratis</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[#FAF6EB] border-b border-[#8EC3B0]/30 z-40 p-6 flex flex-col space-y-4 shadow-xl">
          <a href="#studi-kasus" onClick={() => setMobileMenuOpen(false)} className="font-semibold">Studi Kasus</a>
          <a href="#ai-flow" onClick={() => setMobileMenuOpen(false)} className="font-semibold">Cara Kerja AI</a>
          <a href="#responsible-ai" onClick={() => setMobileMenuOpen(false)} className="font-semibold">Responsible AI</a>
          <hr className="border-[#8EC3B0]/30" />
          <Link href={user ? "/dashboard" : "/register"} onClick={() => setMobileMenuOpen(false)} className="bg-[#1A403E] text-white text-center py-3 rounded-xl font-bold">
            {user ? "Dashboard" : "Daftar Gratis"}
          </Link>
        </div>
      )}

      {/* HERO */}
      <section className="px-6 lg:px-16 py-20 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-[#8EC3B0]/20 border border-[#8EC3B0]/40 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-[#1A403E]" />
            <span className="text-xs font-bold text-[#1A403E] uppercase tracking-wider">Prototype Lomba AI — Google x Dicoding 2026</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold font-poppins text-[#1A403E] leading-tight">
            AI untuk Komunitas yang
            <br />
            <span className="text-[#8EC3B0]">Terinformasi</span> & Bumi yang
            <br />
            <span className="text-[#8EC3B0]">Lestari</span>
          </h1>

          <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
            EcoMind AI menggabungkan dua solusi berbasis AI: membantu warga mengakses informasi publik yang valid (Studi Kasus 1) dan mendukung aksi iklim lokal yang terukur (Studi Kasus 2).
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href={user ? "/dashboard" : "/register"} className="bg-[#1A403E] text-white px-8 py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center space-x-2 hover:bg-[#122c2b] transition-all">
              <span>Coba Prototipe Sekarang</span><ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/community" className="bg-white border-2 border-[#1A403E] text-[#1A403E] px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-[#8EC3B0]/10 transition-all">
              <ShieldCheck className="w-5 h-5" /><span>Verifikasi Informasi</span>
            </Link>
          </div>
        </div>
      </section>

      {/* STUDI KASUS */}
      <section id="studi-kasus" className="px-6 lg:px-16 py-20 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[#1A403E] font-extrabold text-sm uppercase tracking-widest">Dua Studi Kasus</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-poppins text-[#1A403E]">Masalah Nyata, Solusi AI yang Fungsional</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* SK 1 */}
            <div className="bg-[#FAF6EB] border border-[#8EC3B0]/40 p-8 rounded-3xl space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#1A403E] rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#8EC3B0]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8EC3B0] uppercase tracking-widest block">Studi Kasus 1</span>
                  <h3 className="font-extrabold text-lg text-[#1A403E]">Komunitas: Akses Informasi Valid</h3>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                Banyak warga kesulitan mengakses bantuan karena informasinya tersebar, membingungkan, atau dipenuhi hoaks. EcoMind menyediakan tiga solusi berbasis Gemini AI:
              </p>

              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, label: 'Verifikator Hoaks', desc: 'Analisis klaim/rumor dengan skor kredibilitas 0–100' },
                  { icon: FileText, label: 'Peringkas Prosedur', desc: 'Sederhanakan dokumen resmi panjang menjadi langkah aksi' },
                  { icon: BookOpen, label: 'Direktori Lembaga', desc: 'PMI, Komnas HAM, KPAI — prosedur & kontak lengkap' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 bg-white p-3 rounded-xl border border-[#8EC3B0]/30">
                    <item.icon className="w-4 h-4 text-[#1A403E] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-[#1A403E] block">{item.label}</span>
                      <span className="text-[11px] text-gray-600">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-semibold">
                <span className="font-bold text-gray-700">Inspirasi:</span>
                <span>PMI · Komnas HAM · KPAI</span>
              </div>

              <Link href="/community" className="w-full block text-center bg-[#1A403E] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#122c2b] transition-all">
                Buka Pusat Komunitas →
              </Link>
            </div>

            {/* SK 2 */}
            <div className="bg-[#FAF6EB] border border-[#8EC3B0]/40 p-8 rounded-3xl space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#1A403E] rounded-2xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-[#8EC3B0]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8EC3B0] uppercase tracking-widest block">Studi Kasus 2</span>
                  <h3 className="font-extrabold text-lg text-[#1A403E]">Lingkungan: Aksi Iklim Lokal</h3>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                Generasi muda peduli lingkungan tetapi kurang alat konkret. EcoMind mengukur dampak pilihan sehari-hari dan menjadikan aksi lingkungan praktis dan terukur:
              </p>

              <div className="space-y-3">
                {[
                  { icon: Trash2, label: 'Klasifikasi Sampah AI', desc: 'Input nama sampah → Gemini → kategori + cara olah + CO₂ saved' },
                  { icon: Droplet, label: 'Tracker Konsumsi', desc: 'Catat air, listrik, plastik — hitung reduksi emisi real-time' },
                  { icon: Trophy, label: 'Tantangan & Gamifikasi', desc: 'Misi harian/mingguan dengan streak, EcoPoints, dan leaderboard' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 bg-white p-3 rounded-xl border border-[#8EC3B0]/30">
                    <item.icon className="w-4 h-4 text-[#1A403E] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-[#1A403E] block">{item.label}</span>
                      <span className="text-[11px] text-gray-600">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-semibold">
                <span className="font-bold text-gray-700">Inspirasi:</span>
                <span>WWF Indonesia · YKAN · TrashNet Dataset</span>
              </div>

              <Link href={user ? "/dashboard" : "/register"} className="w-full block text-center bg-[#1A403E] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#122c2b] transition-all">
                Coba Tracker Lingkungan →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI FLOW */}
      <section id="ai-flow" className="px-6 lg:px-16 py-20 bg-[#FAF6EB]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[#1A403E] font-extrabold text-sm uppercase tracking-widest">Cara Kerja AI</span>
            <h2 className="text-3xl font-extrabold font-poppins text-[#1A403E]">Alur Input → Proses → Output</h2>
            <p className="text-gray-700 text-sm max-w-xl mx-auto">Seluruh fitur AI menggunakan Google Gemini 1.5 Flash sebagai model inferensi utama.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Verifikasi Hoaks',
                input: 'Teks klaim/rumor dari warga',
                process: 'Gemini menganalisis pola bahasa, konsistensi fakta, dan kredibilitas klaim',
                output: 'Skor 0–100 + kategori (VALID/HOAX/TIDAK_PASTI) + rekomendasi aksi',
                color: 'bg-blue-50 border-blue-200',
              },
              {
                title: 'Klasifikasi Sampah',
                input: 'Nama atau deskripsi jenis sampah',
                process: 'Gemini mengklasifikasi berdasarkan karakteristik material dan standar pengelolaan sampah',
                output: 'Kategori (Organik/Anorganik/B3) + cara olah + estimasi CO₂ saved',
                color: 'bg-green-50 border-green-200',
              },
              {
                title: 'Peringkas Prosedur',
                input: 'Teks prosedur resmi panjang',
                process: 'Gemini mengekstrak poin krusial dan menyusun ulang ke format langkah-langkah',
                output: 'Daftar langkah aksi singkat yang siap-pakai oleh warga awam',
                color: 'bg-amber-50 border-amber-200',
              },
            ].map((flow, i) => (
              <div key={i} className={`${flow.color} border p-6 rounded-2xl space-y-4`}>
                <h4 className="font-extrabold text-sm text-[#1A403E]">{flow.title}</h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <span className="font-bold text-gray-500 uppercase text-[9px] block">Input</span>
                    <span className="text-gray-800 font-semibold">{flow.input}</span>
                  </div>
                  <div className="text-center text-gray-400 font-bold">↓ Gemini 1.5 Flash ↓</div>
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <span className="font-bold text-gray-500 uppercase text-[9px] block">Proses</span>
                    <span className="text-gray-800 font-semibold">{flow.process}</span>
                  </div>
                  <div className="text-center text-gray-400 font-bold">↓</div>
                  <div className="bg-[#1A403E] p-2 rounded-lg">
                    <span className="font-bold text-[#8EC3B0] uppercase text-[9px] block">Output</span>
                    <span className="text-white font-semibold">{flow.output}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESPONSIBLE AI */}
      <section id="responsible-ai" className="px-6 lg:px-16 py-20 bg-white">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-[#1A403E] font-extrabold text-sm uppercase tracking-widest">Penerapan Responsible AI</span>
            <h2 className="text-3xl font-extrabold font-poppins text-[#1A403E]">Risiko, Mitigasi & Peran Manusia</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                risk: 'Risiko Misinformasi',
                desc: 'AI dapat salah mengklasifikasi hoaks atau memberikan ringkasan yang tidak akurat.',
                mitigation: 'Setiap output disertai disclaimer wajib; pengguna diarahkan ke sumber resmi; skor dijabarkan dengan penjelasan transparansi.',
                icon: AlertTriangle,
                color: 'text-red-500',
              },
              {
                risk: 'Risiko Bias Data',
                desc: 'Model dapat bias terhadap terminologi hukum atau daerah tertentu.',
                mitigation: 'Data sintetis dikombinasikan dengan FAQ resmi PMI/KPAI/Komnas HAM; prompt didesain dengan instruksi eksplisit untuk netralitas.',
                icon: ShieldCheck,
                color: 'text-amber-500',
              },
              {
                risk: 'Peran Manusia',
                desc: 'AI hanya sebagai alat bantu awal — bukan penentu kebijakan atau hukum.',
                mitigation: 'Semua keputusan final tetap pada koordinator lembaga (PMI, KPAI, Komnas HAM). AI menampilkan notifikasi wajib konsultasi di setiap hasil.',
                icon: Users,
                color: 'text-[#1A403E]',
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#FAF6EB] border border-[#8EC3B0]/30 p-6 rounded-2xl space-y-3">
                <item.icon className={`w-8 h-8 ${item.color}`} />
                <h4 className="font-extrabold text-sm text-[#1A403E]">{item.risk}</h4>
                <p className="text-[11px] text-gray-600 leading-relaxed"><strong>Risiko:</strong> {item.desc}</p>
                <p className="text-[11px] text-[#1A403E] leading-relaxed font-semibold"><strong>Mitigasi:</strong> {item.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLOSURE */}
      <section id="disclosure" className="px-6 lg:px-16 py-16 bg-[#1A403E] text-white">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold font-poppins">Disclosure Tools, Model & Sumber Data</h2>
            <p className="text-[#8EC3B0] text-sm">Sesuai ketentuan lomba — transparansi penuh</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="bg-white/10 p-5 rounded-2xl space-y-2">
              <span className="text-[#8EC3B0] font-bold uppercase text-[10px] tracking-wider block">Model AI</span>
              <p className="font-semibold">Google Gemini 1.5 Flash</p>
              <p className="text-[#C4E4D9] text-xs">Via @google/generative-ai SDK. Free tier API.</p>
            </div>
            <div className="bg-white/10 p-5 rounded-2xl space-y-2">
              <span className="text-[#8EC3B0] font-bold uppercase text-[10px] tracking-wider block">Sumber Data</span>
              <ul className="text-xs text-[#C4E4D9] space-y-1">
                <li>• Data sintetis simulasi warga</li>
                <li>• FAQ resmi PMI, KPAI, Komnas HAM</li>
                <li>• Dataset TrashNet (referensi klasifikasi)</li>
                <li>• Faktor emisi publik (IPCC)</li>
              </ul>
            </div>
            <div className="bg-white/10 p-5 rounded-2xl space-y-2">
              <span className="text-[#8EC3B0] font-bold uppercase text-[10px] tracking-wider block">Tech Stack</span>
              <ul className="text-xs text-[#C4E4D9] space-y-1">
                <li>• Next.js 14 App Router</li>
                <li>• Prisma ORM + Supabase PostgreSQL</li>
                <li>• TanStack Query</li>
                <li>• Tailwind CSS</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-20 bg-[#FAF6EB]">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold font-poppins text-[#1A403E]">
            Siap Mencoba Prototipe Fungsional?
          </h2>
          <p className="text-gray-700 font-medium">
            Daftar gratis dan eksplorasi seluruh fitur AI — verifikasi hoaks, klasifikasi sampah, tracker emisi, dan tantangan lingkungan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={user ? "/dashboard" : "/register"} className="bg-[#1A403E] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#122c2b] transition-all flex items-center justify-center space-x-2">
              <span>Mulai Sekarang</span><ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/community" className="bg-white border-2 border-[#1A403E] text-[#1A403E] px-8 py-4 rounded-2xl font-bold hover:bg-[#8EC3B0]/10 transition-all">
              Lihat Demo Komunitas
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-[#8EC3B0]/30 bg-white text-center text-xs text-gray-500 font-semibold space-y-3">
        <div className="flex items-center justify-center space-x-2">
          <Leaf className="w-4 h-4 text-[#8EC3B0]" />
          <span className="font-bold text-[#1A403E]">EcoMind AI</span>
          <span>— Prototipe Lomba AI Google x Dicoding 2026</span>
        </div>
        <p>Dibuat dengan ❤️ untuk komunitas dan kelestarian bumi Indonesia.</p>
        <div className="flex justify-center space-x-6">
          <Link href="/terms" className="hover:underline">Syarat & Ketentuan</Link>
          <Link href="/terms" className="hover:underline">Kebijakan Privasi</Link>
        </div>
      </footer>
    </div>
  );
}
