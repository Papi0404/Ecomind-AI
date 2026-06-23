'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  ShieldAlert,
  Loader2,
  FileText,
  Search,
  ExternalLink,
  Phone,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BookOpen
} from 'lucide-react';

export default function CommunityPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Tab State: 'verify' | 'summarize' | 'directory'
  const [activeTab, setActiveTab] = useState<'verify' | 'summarize' | 'directory'>('verify');

  // Verify Claim State
  const [claimInput, setClaimInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // Summarize State
  const [procedureInput, setProcedureInput] = useState('');
  const [summaryResult, setSummaryResult] = useState<string>('');

  // Search in Directory
  const [directorySearch, setDirectorySearch] = useState('');

  // 1. Verify Claim Mutation
  const verifyMutation = useMutation({
    mutationFn: api.community.verify,
    onSuccess: (data) => {
      setVerifyResult(data);
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal memverifikasi klaim.');
    }
  });

  // 2. Summarize Mutation
  const summarizeMutation = useMutation({
    mutationFn: api.community.summarize,
    onSuccess: (data) => {
      setSummaryResult(data.summary);
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal meringkas prosedur.');
    }
  });

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-grid-pattern flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1A403E] animate-spin" />
      </div>
    );
  }

  // Organizations Directory Data (Palang Merah Indonesia, Komnas HAM, KPAI)
  const directoryData = [
    {
      name: 'Palang Merah Indonesia (PMI)',
      category: 'Bantuan Kemanusiaan & Bencana',
      phone: '021-7992325',
      website: 'https://pmi.or.id',
      description: 'Layanan penanggulangan bencana, donor darah, dan bantuan medis darurat untuk warga terdampak krisis.',
      procedures: [
        'Hubungi call center darurat atau datang ke markas PMI kabupaten/kota terdekat.',
        'Sampaikan detail lokasi kejadian, jumlah korban, dan jenis bantuan darurat yang mendesak.',
        'Sediakan kartu identitas (KTP) pelapor untuk verifikasi data jika diperlukan.'
      ],
      checklist: ['KTP Pelapor', 'Detail Kronologi Kejadian / Kebutuhan Darurat', 'Dokumentasi Lokasi (foto/video jika ada)']
    },
    {
      name: 'Komisi Nasional Hak Asasi Manusia (Komnas HAM)',
      category: 'Perlindungan Hak & Hukum',
      phone: '021-3925230',
      website: 'https://komnasham.go.id',
      description: 'Menerima aduan warga terkait pelanggaran hak asasi manusia oleh lembaga atau pihak manapun di Indonesia.',
      procedures: [
        'Unduh formulir pengaduan resmi di situs resmi Komnas HAM.',
        'Isi kronologi pelanggaran hak secara runtut dengan menyebutkan pihak teradu.',
        'Kirim berkas via pos, email pengaduan, atau serahkan langsung ke kantor sekretariat Komnas HAM.'
      ],
      checklist: ['KTP / Identitas Diri Pengadu', 'Formulir Pengaduan terisi lengkap', 'Bukti-bukti Pelanggaran (foto, dokumen surat, atau saksi)']
    },
    {
      name: 'Komisi Perlindungan Anak Indonesia (KPAI)',
      category: 'Perlindungan Anak & Keluarga',
      phone: '021-31901556',
      website: 'https://kpai.go.id',
      description: 'Lembaga negara independen untuk pengawasan, perlindungan anak dari kekerasan, eksploitasi, dan diskriminasi.',
      procedures: [
        'Aduan dapat diajukan secara online melalui formulir Pengaduan Online KPAI.',
        'Ceritakan kronologi ancaman atau kekerasan yang dialami anak secara rahasia dan aman.',
        'Tim KPAI akan menganalisis aduan dan melakukan mediasi atau rujukan hukum ke pihak berwenang.'
      ],
      checklist: ['KTP Orang Tua/Pelapor', 'Akta Kelahiran Anak (jika ada)', 'Bukti Fisik/Medis/Digital terkait kekerasan anak']
    }
  ];

  const filteredDirectory = directoryData.filter(org =>
    org.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
    org.category.toLowerCase().includes(directorySearch.toLowerCase())
  );

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInput.trim()) return;
    verifyMutation.mutate(claimInput);
  };

  const handleSummarize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedureInput.trim()) return;
    summarizeMutation.mutate(procedureInput);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10">
        
        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-gray-900 font-poppins flex items-center space-x-2">
              <ShieldAlert className="w-8 h-8 text-[#8EC3B0]" />
              <span className="text-gray-900">Pusat Informasi & Verifikasi Komunitas</span>
            </h2>
            <p className="text-sm text-gray-700 font-medium">
              Temukan layanan publik terpercaya, ringkas prosedur yang rumit, dan verifikasi hoaks yang beredar di sekitar Anda.
            </p>
          </div>
        </section>

        {/* Responsible AI Notice */}
        <div className="bg-[#FAF6EB] border border-[#8EC3B0]/60 p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-800 leading-relaxed">
            <strong className="text-gray-900 block mb-0.5">Strategi Responsible AI & Penilaian Manusia:</strong>
            Meskipun sistem menggunakan AI untuk menyaring klaim awal dan meringkas teks, seluruh informasi harus selalu disilang dengan koordinator resmi PMI, Komnas HAM, atau KPAI. Penilaian final tetap menjadi tanggung jawab penuh para ahli manusia di lembaga terkait.
          </div>
        </div>

        {/* Tab Controls */}
        <section className="flex space-x-2 border-b border-[#8EC3B0]/30 pb-px">
          <button
            onClick={() => setActiveTab('verify')}
            className={`
              px-6 py-3 text-xs font-bold transition-all border-b-2
              ${activeTab === 'verify'
                ? 'border-[#1A403E] text-gray-900 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
              }
            `}
          >
            Pemeriksa Kebenaran (Verifier)
          </button>
          <button
            onClick={() => setActiveTab('summarize')}
            className={`
              px-6 py-3 text-xs font-bold transition-all border-b-2
              ${activeTab === 'summarize'
                ? 'border-[#1A403E] text-gray-900 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
              }
            `}
          >
            Peringkas Prosedur
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`
              px-6 py-3 text-xs font-bold transition-all border-b-2
              ${activeTab === 'directory'
                ? 'border-[#1A403E] text-gray-900 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
              }
            `}
          >
            Direktori Lembaga Publik
          </button>
        </section>

        {/* Tab Content Panels */}
        <div className="space-y-6">
          
          {/* TAB 1: VERIFIER */}
          {activeTab === 'verify' && (
            <div className="grid md:grid-cols-12 gap-8">
              
              {/* Form Input */}
              <div className="md:col-span-6 space-y-4">
                <form onSubmit={handleVerify} className="glass-panel p-6 rounded-3xl space-y-4">
                  <h3 className="font-extrabold text-base text-gray-900">Periksa Kredibilitas Informasi</h3>
                  <p className="text-xs text-gray-700">
                    Tempel pesan berantai WhatsApp, rumor medsos, atau berita bantuan sosial untuk dianalisis oleh AI.
                  </p>

                  <div className="space-y-2">
                    <textarea
                      value={claimInput}
                      onChange={(e) => setClaimInput(e.target.value)}
                      placeholder="Contoh: 'Bantuan langsung tunai 5 juta rupiah dari pemerintah dibagikan lewat tautan link ini gratis...'"
                      rows={6}
                      className="w-full bg-white border border-gray-300 rounded-2xl py-3 px-4 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0] focus:ring-1 focus:ring-[#8EC3B0]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyMutation.isPending || !claimInput.trim()}
                    className="w-full bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl shadow-md flex items-center justify-center space-x-2"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Menganalisis Klaim...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Periksa Validitas</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Analysis Result Display */}
              <div className="md:col-span-6">
                {verifyMutation.isPending && (
                  <div className="glass-panel p-8 rounded-3xl h-full flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#8EC3B0]" />
                    <p className="text-xs text-gray-900 font-semibold">Gemini AI sedang memindai pola misinformasi, kredibilitas sumber, dan tata bahasa klaim...</p>
                  </div>
                )}

                {!verifyResult && !verifyMutation.isPending && (
                  <div className="glass-panel p-8 rounded-3xl h-full flex flex-col items-center justify-center text-center space-y-4">
                    <HelpCircle className="w-12 h-12 text-[#8EC3B0] opacity-80" />
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">Belum Ada Hasil Analisis</h4>
                      <p className="text-xs text-gray-700 max-w-xs mx-auto mt-1">
                        Ketik atau tempel teks klaim di sebelah kiri untuk melihat hasil penilaian skor kredibilitas.
                      </p>
                    </div>
                  </div>
                )}

                {verifyResult && !verifyMutation.isPending && (
                  <div className="glass-panel p-6 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900">Hasil Analisis Validitas</h4>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase">Powered by Gemini AI</span>
                      </div>
                      
                      {/* Category Badge */}
                      <span className={`
                        text-[10px] font-extrabold px-3 py-1 rounded-full uppercase
                        ${verifyResult.category === 'VALID' ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                        ${verifyResult.category === 'HOAX' ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' : ''}
                        ${verifyResult.category === 'TIDAK_PASTI' ? 'bg-amber-100 text-amber-700 border border-amber-200' : ''}
                      `}>
                        {verifyResult.category === 'VALID' && '✓ Valid'}
                        {verifyResult.category === 'HOAX' && '⚠️ HOAX'}
                        {verifyResult.category === 'TIDAK_PASTI' && '? Perlu Verifikasi'}
                      </span>
                    </div>

                    {/* Progress Gauge */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-900">
                        <span>Skor Kredibilitas</span>
                        <span className={`
                          ${verifyResult.score >= 70 ? 'text-green-600' : ''}
                          ${verifyResult.score < 70 && verifyResult.score >= 40 ? 'text-amber-600' : ''}
                          ${verifyResult.score < 40 ? 'text-red-600' : ''}
                        `}>
                          {verifyResult.score} / 100
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            verifyResult.score >= 70 ? 'bg-green-500' :
                            verifyResult.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${verifyResult.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Analysis Content */}
                    <div className="space-y-1 bg-white border border-gray-200 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-700 uppercase">Analisis AI:</span>
                      <p className="text-xs text-gray-900 font-medium leading-relaxed">
                        {verifyResult.analysis}
                      </p>
                    </div>

                    {/* Actionable recommendations */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-gray-700 uppercase block">Rekomendasi Aksi:</span>
                      <ul className="text-xs text-gray-800 space-y-2">
                        {verifyResult.recommendations?.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-[#8EC3B0] flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Human confirmation warning */}
                    <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-[10px] text-red-800 font-bold leading-relaxed flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>
                        Peringatan: Analisis di atas bersifat prediktif. Laporkan klaim mencurigakan ke instansi resmi setempat sebelum mengambil tindakan finansial atau hukum.
                      </span>
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 2: SUMMARIZER */}
          {activeTab === 'summarize' && (
            <div className="grid md:grid-cols-12 gap-8">
              
              {/* Text Input area */}
              <div className="md:col-span-6 space-y-4">
                <form onSubmit={handleSummarize} className="glass-panel p-6 rounded-3xl space-y-4">
                  <h3 className="font-extrabold text-base text-gray-900">Sederhanakan Prosedur Resmi</h3>
                  <p className="text-xs text-gray-700">
                    Salin teks peraturan pemerintah, pengumuman lembaga, atau tata cara administrasi yang panjang agar diringkas menjadi daftar langkah siap-pakai.
                  </p>

                  <div className="space-y-2">
                    <textarea
                      value={procedureInput}
                      onChange={(e) => setProcedureInput(e.target.value)}
                      placeholder="Tempel teks prosedur panjang di sini..."
                      rows={8}
                      className="w-full bg-white border border-gray-300 rounded-2xl py-3 px-4 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0] focus:ring-1 focus:ring-[#8EC3B0]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={summarizeMutation.isPending || !procedureInput.trim()}
                    className="w-full bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl shadow-md flex items-center justify-center space-x-2"
                  >
                    {summarizeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Meringkas Berkas...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Ringkas Teks</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Summary Display */}
              <div className="md:col-span-6">
                {summarizeMutation.isPending && (
                  <div className="glass-panel p-8 rounded-3xl h-full flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#8EC3B0]" />
                    <p className="text-xs text-gray-900 font-semibold">Gemini AI sedang membaca tata bahasa hukum, memilah syarat berkas, dan menyusun langkah krusial...</p>
                  </div>
                )}

                {!summaryResult && !summarizeMutation.isPending && (
                  <div className="glass-panel p-8 rounded-3xl h-full flex flex-col items-center justify-center text-center space-y-4">
                    <BookOpen className="w-12 h-12 text-[#8EC3B0] opacity-80" />
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">Belum Ada Ringkasan</h4>
                      <p className="text-xs text-gray-700 max-w-xs mx-auto mt-1">
                        Salin naskah prosedur panjang di sebelah kiri untuk melihat rangkuman langkah yang mudah dibaca.
                      </p>
                    </div>
                  </div>
                )}

                {summaryResult && !summarizeMutation.isPending && (
                  <div className="glass-panel p-6 rounded-3xl space-y-4 h-full">
                    <div className="border-b border-gray-200 pb-3">
                      <h4 className="font-extrabold text-sm text-gray-900">Langkah Sederhana Terverifikasi</h4>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase">Diubah ke Langkah Aksi</span>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl text-xs text-gray-900 leading-relaxed font-semibold whitespace-pre-wrap">
                      {summaryResult}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 3: PUBLIC DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-6">
              
              {/* Directory search control */}
              <div className="max-w-md relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama lembaga atau kebutuhan bantuan..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0]"
                />
              </div>

              {/* Directory Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {filteredDirectory.map((org, index) => (
                  <div key={index} className="glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-[#8EC3B0] transition-all">
                    <div className="space-y-3">
                      <div>
                        <span className="bg-[#C4E4D9] text-[#1A403E] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                          {org.category}
                        </span>
                        <h4 className="font-extrabold text-sm text-gray-900 mt-2">{org.name}</h4>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                        {org.description}
                      </p>

                      <div className="w-full h-px bg-gray-200" />

                      {/* Procedures list */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-700 uppercase">Cara Menghubungi:</span>
                        <ul className="text-[11px] text-gray-700 space-y-1 list-decimal list-inside font-medium">
                          {org.procedures.map((p, i) => (
                            <li key={i} className="leading-relaxed">{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="w-full h-px bg-gray-200" />

                      {/* Document checklist */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-700 uppercase">Dokumen Syarat Wajib:</span>
                        <div className="grid grid-cols-1 gap-1">
                          {org.checklist.map((c, i) => (
                            <div key={i} className="flex items-center space-x-1.5 text-[11px] text-gray-700 font-semibold">
                              <CheckSquare className="w-3.5 h-3.5 text-[#8EC3B0]" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <a
                        href={`tel:${org.phone}`}
                        className="text-xs font-bold text-gray-900 hover:text-gray-700 flex items-center space-x-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#8EC3B0]" />
                        <span>{org.phone}</span>
                      </a>
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#1A403E] text-white hover:bg-[#122c2b] text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <span>Situs Resmi</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}

                {filteredDirectory.length === 0 && (
                  <p className="col-span-3 text-center text-xs text-gray-400 font-semibold py-8">
                    Tidak ada lembaga publik yang cocok dengan kata kunci pencarian Anda.
                  </p>
                )}
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}
