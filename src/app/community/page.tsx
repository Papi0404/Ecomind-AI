'use client';
import { useRef } from 'react';
import EmojiPicker from '@/components/EmojiPicker';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  BookOpen,
  Users,
  MessageSquare,
  Plus,
  Send,
  X,
  Paperclip,
  Image,
  Trash2,
  Smile,
} from 'lucide-react';

export default function CommunityPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Tab State: 'verify' | 'summarize' | 'directory' | 'groups'
  const [activeTab, setActiveTab] = useState<'verify' | 'summarize' | 'directory' | 'groups'>('verify');

  // Verify Claim State
  const [claimInput, setClaimInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // Summarize State
  const [procedureInput, setProcedureInput] = useState('');
  const [summaryResult, setSummaryResult] = useState<string>('');

  // Search in Directory
  const [directorySearch, setDirectorySearch] = useState('');

  // Group Chat States
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupMessageInput, setGroupMessageInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Lingkungan');
  const [groupFile, setGroupFile] = useState<File | null>(null);
  const [groupUploadingFile, setGroupUploadingFile] = useState(false);
  const [showGroupEmojiPicker, setShowGroupEmojiPicker] = useState(false);
  const [showChatEmojiPicker, setShowChatEmojiPicker] = useState(false);
  const groupFileInputRef = useRef<HTMLInputElement>(null);
  const groupMessagesEndRef = useRef<HTMLDivElement>(null);

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

  // ── Date formatting helper for WhatsApp-style calendar separators ──
  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDate.getTime() === today.getTime()) return 'Hari ini';
    if (msgDate.getTime() === yesterday.getTime()) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Group Queries & Mutations
  const { data: groupsData, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['community-groups'],
    queryFn: api.groups.list,
    enabled: activeTab === 'groups',
  });

  const { data: groupMsgsData, isLoading: groupMsgsLoading, refetch: refetchGroupMsgs } = useQuery({
    queryKey: ['group-messages', selectedGroupId],
    queryFn: () => api.groups.getMessages(selectedGroupId!),
    enabled: !!selectedGroupId,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const joinMutation = useMutation({
    mutationFn: (groupId: string) => api.groups.join(groupId),
    onSuccess: () => refetchGroups(),
    onError: (err: any) => alert(err.message || 'Gagal bergabung.'),
  });

  const leaveMutation = useMutation({
    mutationFn: (groupId: string) => api.groups.leave(groupId),
    onSuccess: () => { refetchGroups(); setSelectedGroupId(null); },
    onError: (err: any) => alert(err.message || 'Gagal keluar dari grup.'),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => api.groups.delete(groupId),
    onSuccess: () => { refetchGroups(); setSelectedGroupId(null); },
    onError: (err: any) => alert(err.message || 'Gagal menghapus grup.'),
  });

  const createGroupMutation = useMutation({
    mutationFn: (body: { name: string; description?: string; category: string }) =>
      api.groups.create(body),
    onSuccess: () => {
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      refetchGroups();
    },
    onError: (err: any) => alert(err.message || 'Gagal membuat grup.'),
  });

  const sendGroupMessageMutation = useMutation({
    mutationFn: (payload: { groupId: string; content: string; fileUrl?: string | null; fileName?: string | null; fileType?: string | null }) =>
      api.groups.sendMessage(payload.groupId, { content: payload.content, fileUrl: payload.fileUrl, fileName: payload.fileName, fileType: payload.fileType }),
    onSuccess: () => refetchGroupMsgs(),
    onError: (err: any) => alert(err.message || 'Gagal mengirim pesan.'),
  });

  // Scroll to bottom on new group messages
  useEffect(() => {
    groupMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMsgsData]);

  // Auto-refetch messages when group is selected
  useEffect(() => {
    if (selectedGroupId) refetchGroupMsgs();
  }, [selectedGroupId]);

  const handleGroupSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupMessageInput.trim() && !groupFile) return;
    if (!selectedGroupId) return;

    setGroupUploadingFile(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (groupFile) {
        const formData = new FormData();
        formData.append('file', groupFile);
        formData.append('type', 'proof');
        const uploadRes = await api.profile.upload(formData);
        fileUrl = uploadRes.url;
        fileName = groupFile.name;
        fileType = groupFile.type;
      }

      const content = groupMessageInput.trim() || `Mengirim berkas: ${fileName}`;
      setGroupMessageInput('');
      setGroupFile(null);
      await sendGroupMessageMutation.mutateAsync({ groupId: selectedGroupId, content, fileUrl, fileName, fileType });
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan.');
    } finally {
      setGroupUploadingFile(false);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroupMutation.mutate({ name: newGroupName.trim(), description: newGroupDesc.trim() || undefined, category: newGroupCategory });
  };

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
          <button
            onClick={() => setActiveTab('groups')}
            className={`
              px-6 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5
              ${activeTab === 'groups'
                ? 'border-[#1A403E] text-gray-900 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
              }
            `}
          >
            <Users className="w-3.5 h-3.5" />
            Grup Komunitas
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

          {/* TAB 4: GRUP KOMUNITAS */}
          {activeTab === 'groups' && (
            <div className="space-y-4">

              {/* Create Group Modal */}
              {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-gray-900">Buat Grup Baru</h3>
                      <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={handleCreateGroup} className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Nama Grup *</label>
                        <input
                          type="text"
                          value={newGroupName}
                          onChange={e => setNewGroupName(e.target.value)}
                          placeholder="Contoh: EcoWarrior Jakarta"
                          maxLength={50}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#8EC3B0] focus:ring-2 focus:ring-[#8EC3B0]/20 transition"
                          required
                        />
                        <p className="text-[10px] text-gray-400 mt-0.5">Nama yang sama diperbolehkan — setiap grup memiliki ID unik</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Deskripsi</label>
                        <textarea
                          value={newGroupDesc}
                          onChange={e => setNewGroupDesc(e.target.value)}
                          placeholder="Apa tujuan grup ini?"
                          maxLength={200}
                          rows={3}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#8EC3B0] resize-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Kategori</label>
                        <select
                          value={newGroupCategory}
                          onChange={e => setNewGroupCategory(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#8EC3B0] transition bg-white"
                        >
                          {['Lingkungan', 'Energi Terbarukan', 'Daur Ulang', 'Pertanian', 'Konservasi', 'Edukasi', 'Teknologi Hijau', 'Lainnya'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={createGroupMutation.isPending || !newGroupName.trim()}
                        className="w-full py-2.5 bg-[#1A403E] text-white text-xs font-bold rounded-xl hover:bg-[#2a5a57] transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {createGroupMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Buat Grup
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[620px]">

                {/* LEFT: Group List */}
                <div className="lg:col-span-4 flex flex-col h-full glass-panel rounded-2xl overflow-hidden border border-[#8EC3B0]/20">
                  {/* Header */}
                  <div className="p-3 border-b border-[#8EC3B0]/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#8EC3B0]" /> Grup
                      </h3>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1A403E] text-white text-[10px] font-bold rounded-lg hover:bg-[#2a5a57] transition"
                      >
                        <Plus className="w-3 h-3" /> Buat
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        value={groupSearch}
                        onChange={e => setGroupSearch(e.target.value)}
                        placeholder="Cari grup..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 pl-7 text-[11px] font-medium outline-none focus:border-[#8EC3B0] transition"
                      />
                      <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Group List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[#8EC3B0]/10">
                    {groupsLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-[#8EC3B0] animate-spin" />
                      </div>
                    ) : (groupsData?.groups ?? []).filter((g: any) =>
                        g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
                        g.category.toLowerCase().includes(groupSearch.toLowerCase())
                      ).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <Users className="w-10 h-10 text-gray-200 mb-2" />
                        <p className="text-xs text-gray-400 font-semibold">Belum ada grup.</p>
                        <p className="text-[10px] text-gray-300">Klik &quot;Buat&quot; untuk membuat grup pertama!</p>
                      </div>
                    ) : (
                      (groupsData?.groups ?? [])
                        .filter((g: any) =>
                          g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
                          g.category.toLowerCase().includes(groupSearch.toLowerCase())
                        )
                        .map((g: any) => (
                          <div
                            key={g.id}
                            onClick={() => { if (g.isMember) setSelectedGroupId(g.id); }}
                            className={`p-3 flex flex-col gap-1 transition cursor-pointer
                              ${selectedGroupId === g.id ? 'bg-[#8EC3B0]/15 border-l-2 border-[#1A403E]' : 'hover:bg-gray-50 border-l-2 border-transparent'}
                            `}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{g.name}</p>
                                <p className="text-[10px] text-[#8EC3B0] font-semibold">{g.category}</p>
                              </div>
                              <span className="text-[9px] font-semibold text-gray-400 shrink-0">{g.memberCount} anggota</span>
                            </div>
                            {g.description && (
                              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{g.description}</p>
                            )}
                            {g.memberNames && g.memberNames.length > 0 && (
                              <p className="text-[9px] text-gray-400 font-medium truncate">
                                <Users className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
                                {g.memberNames.join(', ')}
                              </p>
                            )}
                            <div className="flex gap-1.5 mt-1">
                              {g.isMember ? (
                                <button
                                  onClick={e => { e.stopPropagation(); leaveMutation.mutate(g.id); }}
                                  disabled={leaveMutation.isPending}
                                  className="text-[9px] font-bold px-2 py-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition"
                                >
                                  Keluar
                                </button>
                              ) : (
                                <button
                                  onClick={e => { e.stopPropagation(); joinMutation.mutate(g.id); }}
                                  disabled={joinMutation.isPending}
                                  className="text-[9px] font-bold px-2 py-1 rounded-md bg-[#8EC3B0]/20 text-[#1A403E] hover:bg-[#8EC3B0]/40 transition"
                                >
                                  Bergabung
                                </button>
                              )}
                              {g.isMember && (
                                <button
                                  onClick={e => { e.stopPropagation(); setSelectedGroupId(g.id); }}
                                  className="text-[9px] font-bold px-2 py-1 rounded-md bg-[#1A403E]/10 text-[#1A403E] hover:bg-[#1A403E]/20 transition flex items-center gap-0.5"
                                >
                                  <MessageSquare className="w-2.5 h-2.5" /> Chat
                                </button>
                              )}
                              {(g.creatorId === user.id || (user as any).role === 'ADMIN') && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (confirm(`Hapus grup "${g.name}"? Semua pesan akan ikut terhapus.`)) {
                                      deleteGroupMutation.mutate(g.id);
                                    }
                                  }}
                                  disabled={deleteGroupMutation.isPending}
                                  title="Hapus Grup"
                                  className="text-[9px] font-bold px-2 py-1 rounded-md bg-red-50 text-red-400 hover:bg-red-100 transition flex items-center gap-0.5"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* RIGHT: Chat Window */}
                <div className="lg:col-span-8 flex flex-col h-full glass-panel rounded-2xl overflow-hidden border border-[#8EC3B0]/20">
                  {!selectedGroupId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-[#8EC3B0]/15 flex items-center justify-center">
                        <MessageSquare className="w-7 h-7 text-[#8EC3B0]" />
                      </div>
                      <p className="text-sm font-bold text-gray-700">Pilih Grup untuk Mulai Chat</p>
                      <p className="text-xs text-gray-400">Bergabunglah ke grup dan klik &quot;Chat&quot; untuk memulai percakapan komunitas.</p>
                    </div>
                  ) : (() => {
                    const activeGroup = (groupsData?.groups ?? []).find((g: any) => g.id === selectedGroupId);
                    const messages: any[] = groupMsgsData?.messages ?? [];
                    const isSending = sendGroupMessageMutation.isPending || groupUploadingFile;
                    const isCreatorOrAdmin = activeGroup?.creatorId === user.id || (user as any).role === 'ADMIN';

                    // ── Color palette for sender names (WhatsApp-style) ──
                    const senderColors = [
                      '#1A403E', '#D97706', '#7C3AED', '#059669',
                      '#DC2626', '#2563EB', '#DB2777', '#EA580C',
                      '#4F46E5', '#0D9488', '#9333EA', '#C026D3',
                    ];
                    const getSenderColor = (senderId: string) => {
                      let hash = 0;
                      for (let i = 0; i < senderId.length; i++) hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
                      return senderColors[Math.abs(hash) % senderColors.length];
                    };

                    return (
                      <>
                        {/* Chat Header */}
                        <div className="px-4 py-3 border-b border-[#8EC3B0]/20 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8EC3B0] to-[#1A403E] flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md">
                            {activeGroup?.name?.[0]?.toUpperCase() ?? 'G'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold text-gray-900 truncate">{activeGroup?.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium truncate">
                              {activeGroup?.memberNames?.join(', ') || `${activeGroup?.memberCount} anggota`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {isCreatorOrAdmin && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus grup "${activeGroup?.name}"? Semua pesan dan anggota akan dihapus permanen.`)) {
                                    deleteGroupMutation.mutate(selectedGroupId!);
                                  }
                                }}
                                disabled={deleteGroupMutation.isPending}
                                title="Hapus Grup"
                                className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                              >
                                {deleteGroupMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedGroupId(null)}
                              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Messages Area — WhatsApp Style with Calendar Separators */}
                        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M0 20h40M20 0v40\' stroke=\'%238EC3B0\' stroke-width=\'.3\' opacity=\'.08\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\'url(%23p)\' width=\'200\' height=\'200\'/%3E%3C/svg%3E")', backgroundColor: '#f8faf9' }}>
                          {groupMsgsLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <Loader2 className="w-6 h-6 text-[#8EC3B0] animate-spin" />
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                              <div className="w-14 h-14 rounded-full bg-[#8EC3B0]/10 flex items-center justify-center">
                                <MessageSquare className="w-7 h-7 text-[#8EC3B0]" />
                              </div>
                              <p className="text-xs text-gray-400 font-semibold">Belum ada pesan. Jadilah yang pertama!</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {messages.map((msg: any, idx: number) => {
                                const isMe = msg.senderId === user.id;
                                const ts = msg.createdAt
                                  ? new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                  : '';

                                // ── Calendar date separator ──
                                const currentDateLabel = msg.createdAt ? formatDateSeparator(msg.createdAt) : '';
                                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                const prevDateLabel = prevMsg?.createdAt ? formatDateSeparator(prevMsg.createdAt) : '';
                                const showDateSeparator = currentDateLabel !== prevDateLabel;

                                // ── Show sender name for consecutive messages from same user ──
                                const showSenderName = !isMe && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId || showDateSeparator);
                                const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId || (idx < messages.length - 1 && formatDateSeparator(messages[idx + 1]?.createdAt) !== currentDateLabel));

                                return (
                                  <div key={msg.id}>
                                    {/* Date separator */}
                                    {showDateSeparator && (
                                      <div className="flex items-center justify-center my-3">
                                        <div className="bg-white/90 backdrop-blur-sm shadow-sm border border-[#8EC3B0]/15 px-4 py-1.5 rounded-full">
                                          <span className="text-[10px] font-bold text-gray-500">{currentDateLabel}</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Message bubble */}
                                    <div className={`flex items-end gap-1.5 mb-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                      {/* Avatar (only on last consecutive message from same sender) */}
                                      {!isMe ? (
                                        showAvatar ? (
                                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8EC3B0] to-[#1A403E] flex items-center justify-center text-white text-[9px] font-extrabold shrink-0 shadow-sm">
                                            {msg.sender?.name?.[0]?.toUpperCase() ?? '?'}
                                          </div>
                                        ) : (
                                          <div className="w-7 shrink-0" />
                                        )
                                      ) : null}

                                      {/* Bubble */}
                                      <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-xl px-3 py-1.5 shadow-sm relative ${
                                          isMe
                                            ? 'bg-[#1A403E] text-white rounded-br-[4px]'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-[4px]'
                                        }`}>
                                          {/* Sender name — small, colored, WhatsApp style */}
                                          {showSenderName && (
                                            <p
                                              className="text-[10px] font-bold mb-0.5 leading-tight"
                                              style={{ color: isMe ? '#8EC3B0' : getSenderColor(msg.senderId) }}
                                            >
                                              {msg.sender?.name ?? 'Unknown'}
                                            </p>
                                          )}

                                          {/* Message content — bigger text */}
                                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                            {msg.content}
                                          </p>

                                          {/* File attachment */}
                                          {msg.fileUrl && (
                                            <div className={`mt-1.5 pt-1.5 border-t ${isMe ? 'border-white/20' : 'border-gray-100'}`}>
                                              {msg.fileType?.startsWith('image/') ? (
                                                <img
                                                  src={msg.fileUrl}
                                                  alt={msg.fileName || 'Gambar'}
                                                  className="rounded-lg max-h-48 w-auto cursor-zoom-in hover:opacity-90 transition"
                                                  onClick={() => window.open(msg.fileUrl, '_blank')}
                                                />
                                              ) : (
                                                <div className={`flex items-center gap-2 p-2 rounded-lg ${isMe ? 'bg-white/10' : 'bg-gray-50'}`}>
                                                  <FileText className="w-4 h-4 shrink-0" />
                                                  <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold underline truncate">
                                                    {msg.fileName || 'Unduh Berkas'}
                                                  </a>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Timestamp inline (WA style) */}
                                          <div className={`flex justify-end mt-0.5 ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                                            <span className="text-[9px] font-medium">{ts}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div ref={groupMessagesEndRef} />
                        </div>

                        {/* File Preview */}
                        {groupFile && (
                          <div className="mx-4 mb-1 flex items-center justify-between bg-[#8EC3B0]/10 border border-[#8EC3B0]/30 p-2 rounded-xl text-xs font-bold text-gray-700">
                            <div className="flex items-center gap-2">
                              {groupFile.type.startsWith('image/') ? <Image className="w-3.5 h-3.5 text-[#8EC3B0]" /> : <FileText className="w-3.5 h-3.5 text-[#8EC3B0]" />}
                              <span className="truncate max-w-[200px]">{groupFile.name}</span>
                            </div>
                            <button onClick={() => setGroupFile(null)} className="p-0.5 text-gray-400 hover:text-red-500 rounded-full">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Message Input */}
                        <div className="px-4 py-3 border-t border-[#8EC3B0]/20 relative">
                          <form onSubmit={handleGroupSend} className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={groupFileInputRef}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f && f.size > 5 * 1024 * 1024) { alert('Maks 5MB'); return; }
                                if (f) setGroupFile(f);
                              }}
                              accept=".png,.jpg,.jpeg,.gif,.pdf,.docx"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => groupFileInputRef.current?.click()}
                              title="Lampirkan berkas"
                              className="p-2 text-gray-400 hover:text-[#1A403E] transition shrink-0"
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>
                            
                            {/* Emoji Picker Button and Menu */}
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowGroupEmojiPicker(!showGroupEmojiPicker)}
                                title="Pilih Emoji"
                                className={`p-2 transition rounded-lg ${showGroupEmojiPicker ? 'text-[#1A403E] bg-[#8EC3B0]/20' : 'text-gray-400 hover:text-[#1A403E]'}`}
                              >
                                <Smile className="w-4 h-4" />
                              </button>
                              {showGroupEmojiPicker && (
                                <EmojiPicker
                                  onEmojiSelect={(emoji) => setGroupMessageInput(prev => prev + emoji)}
                                  onClose={() => setShowGroupEmojiPicker(false)}
                                  position="top"
                                />
                              )}
                            </div>

                            <input
                              value={groupMessageInput}
                              onChange={e => setGroupMessageInput(e.target.value.slice(0, 1000))}
                              placeholder="Tulis pesan untuk grup..."
                              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#8EC3B0] focus:ring-2 focus:ring-[#8EC3B0]/20 transition"
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGroupSend(e as any); } }}
                              disabled={isSending}
                            />
                            <button
                              type="submit"
                              disabled={(!groupMessageInput.trim() && !groupFile) || isSending}
                              className="p-2.5 bg-[#1A403E] text-white rounded-xl hover:bg-[#2a5a57] transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                          </form>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
