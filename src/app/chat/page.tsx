'use client';

import Sidebar from '@/components/Sidebar';
import AiAmbientBackground from '@/components/AiAmbientBackground';
import AiMessageBubble from '@/components/AiMessageBubble';
import AiThinkingBubble from '@/components/AiThinkingBubble';
import EmojiPicker from '@/components/EmojiPicker';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  pageVariants, staggerContainer, staggerItem,
  suggestionCardVariants, userBubbleVariants,
} from '@/lib/motion-variants';
import {
  MessageSquare, Plus, Pin, Trash2, Edit2, Send,
  Search, Loader2, Sparkles, Check, X, Compass,
  Leaf, ShieldCheck, FileText, Mic, Paperclip, Image, Smile,
} from 'lucide-react';

type AiState = 'idle' | 'processing' | 'done';
type ChatMode = 'chat' | 'verify' | 'summarize';

/* ── Suggestion sets per mode ─────────────────────────────────────── */
const SUGGESTIONS: Record<ChatMode, { icon: React.ReactNode; text: string }[]> = {
  chat: [
    { icon: <Leaf className="w-4 h-4 text-eco-500" />, text: 'Bagaimana cara mengurangi emisi karbon dari perjalanan harian?' },
    { icon: <Compass className="w-4 h-4 text-eco-500" />, text: 'Apa itu ekonomi sirkular dan contoh penerapannya?' },
    { icon: <Leaf className="w-4 h-4 text-eco-500" />, text: 'Apa cara terbaik mendaur ulang baterai bekas?' },
    { icon: <Compass className="w-4 h-4 text-eco-500" />, text: 'Beri saya ide resep masakan ramah lingkungan hari ini.' },
  ],
  verify: [
    { icon: <ShieldCheck className="w-4 h-4 text-eco-500" />, text: 'Bantuan langsung tunai 5 juta rupiah dibagikan di undian-berhadiah.net.' },
    { icon: <ShieldCheck className="w-4 h-4 text-eco-500" />, text: 'Warga banjir bisa klaim beras gratis 10kg lewat WhatsApp PMI pusat.' },
  ],
  summarize: [
    { icon: <FileText className="w-4 h-4 text-eco-500" />, text: 'Prosedur Pengajuan Bantuan: 1. Pemohon melengkapi formulir B-12, fotokopi KTP, KK, lalu diserahkan ke Dinas Sosial paling lambat tanggal 30 tiap bulan...' },
  ],
};

const MODE_LABELS: Record<ChatMode, string> = {
  chat: 'Diskusi Hijau',
  verify: 'Verifikasi Hoaks',
  summarize: 'Ringkas Prosedur',
};

const MODE_PLACEHOLDER: Record<ChatMode, string> = {
  chat: 'Tanyakan seputar lingkungan hidup…',
  verify: 'Tempel klaim / rumor untuk diverifikasi…',
  summarize: 'Tempel tata cara layanan publik untuk diringkas…',
};

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>('chat');
  const [aiState, setAiState] = useState<AiState>('idle');
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 2000;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  /* ── Data fetching ─────────────────────────────────────────────────── */
  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: api.chat.list,
    enabled: !!user,
  });

  const { data: currentChatData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedChatId],
    queryFn: () => api.chat.get(selectedChatId!),
    enabled: !!selectedChatId,
  });

  /* ── Mutations ─────────────────────────────────────────────────────── */
  const createChatMutation = useMutation({
    mutationFn: api.chat.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setSelectedChatId(res.chat.id);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({
      chatId,
      content,
      fileUrl,
      fileName,
      fileType,
    }: {
      chatId: string;
      content: string;
      fileUrl?: string | null;
      fileName?: string | null;
      fileType?: string | null;
    }) => api.chat.send(chatId, content, fileUrl, fileName, fileType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      setAiState('done');
      setTimeout(() => setAiState('idle'), 1800);
    },
    onError: () => setAiState('idle'),
  });

  const customAiMutation = useMutation({
    mutationFn: async ({ content, mode }: { content: string; mode: 'verify' | 'summarize' }) => {
      await api.chat.send(selectedChatId!, `[Mode ${mode === 'verify' ? 'Verifikasi' : 'Ringkasan'}]: ${content}`);
      let aiText = '';
      if (mode === 'verify') {
        const d = await api.community.verify(content);
        aiText = `**🔍 Hasil Verifikasi AI**\n\n**Kategori:** ${d.category}\n**Skor:** ${d.score}/100\n\n**Analisis:**\n${d.analysis}\n\n**Rekomendasi:**\n${d.recommendations.map((r: string) => `• ${r}`).join('\n')}`;
      } else {
        const d = await api.community.summarize(content);
        aiText = `**📄 Ringkasan Prosedur AI**\n\n${d.summary}`;
      }
      return api.chat.send(selectedChatId!, aiText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      setAiState('done');
      setTimeout(() => setAiState('idle'), 1800);
    },
    onError: () => setAiState('idle'),
  });

  const updateChatMutation = useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body: Record<string, unknown> }) =>
      api.chat.update(chatId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chats'] }),
  });

  const deleteChatMutation = useMutation({
    mutationFn: api.chat.delete,
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      if (selectedChatId === chatId) setSelectedChatId(null);
    },
  });

  /* ── Effects ───────────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatData, aiState]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  /* ── Auto-resize textarea ──────────────────────────────────────────── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS);
    setMessageInput(val);
    setCharCount(val.length);
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const isPending = sendMessageMutation.isPending || customAiMutation.isPending || uploadingFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran berkas maksimal adalah 5MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !selectedChatId || isPending) return;
    
    setUploadingFile(true);
    setAiState('processing');
    
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type', 'proof'); // Used as a general attachment upload type
        
        const uploadRes = await api.profile.upload(formData);
        fileUrl = uploadRes.url;
        fileName = selectedFile.name;
        fileType = selectedFile.type;
      }

      const content = messageInput.trim() || `Mengirim berkas: ${fileName}`;
      setMessageInput('');
      setSelectedFile(null);
      setCharCount(0);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      if (chatMode === 'chat') {
        await sendMessageMutation.mutateAsync({ 
          chatId: selectedChatId, 
          content,
          fileUrl,
          fileName,
          fileType
        });
      } else {
        // AI custom mutations
        await customAiMutation.mutateAsync({ content, mode: chatMode });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal mengirim pesan.');
      setAiState('idle');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const selectSuggestion = async (text: string) => {
    let chatId = selectedChatId;
    if (!chatId) {
      const res = await createChatMutation.mutateAsync();
      chatId = res.chat.id;
    }
    setMessageInput('');
    setAiState('processing');
    try {
      if (chatMode === 'chat') await sendMessageMutation.mutateAsync({ chatId: chatId!, content: text });
      else await customAiMutation.mutateAsync({ content: text, mode: chatMode });
    } catch { setAiState('idle'); }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-grid-pattern flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-eco-200 border-t-eco-500 animate-spin" />
          <span className="text-xs text-gray-500 font-semibold">Memuat EcoMind AI…</span>
        </div>
      </div>
    );
  }

  const chats = chatsData?.chats || [];
  const filteredChats = chats.filter((c: { title: string }) =>
    c.title.toLowerCase().includes(chatSearch.toLowerCase())
  );
  const currentMessages: Array<{ id: string; role: string; content: string; createdAt?: string }> =
    currentChatData?.chat?.messages || [];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[var(--bg-main)]">
      <Sidebar />

      <motion.div
        className="flex-1 flex flex-col lg:flex-row overflow-hidden lg:h-screen pt-16 lg:pt-0"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Left: Conversation list ──────────────────────────────── */}
        <div className="w-full lg:w-72 border-r border-eco-100/40 bg-white/70 dark:bg-eco-700/40 backdrop-blur flex flex-col h-64 lg:h-full shrink-0">
          <div className="p-4 space-y-3 border-b border-eco-100/30">
            {/* Logo mark + title */}
            <div className="flex items-center gap-2 pb-1">
              <motion.div
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-eco-200 to-eco-500 flex items-center justify-center shadow-md"
                initial={{ rotate: -15, scale: 0.7, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
              <span className="font-poppins font-black text-sm text-eco-500">EcoMind AI</span>
            </div>

            <motion.button
              onClick={() => createChatMutation.mutate()}
              disabled={createChatMutation.isPending}
              className="w-full bg-eco-500 hover:bg-eco-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-send-idle hover:shadow-send-glow transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              {createChatMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Plus className="w-4 h-4" />}
              Percakapan Baru
            </motion.button>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari obrolan…"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-gray-800 outline-none focus:border-eco-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
            {chatsLoading ? (
              <div className="space-y-2 p-2">
                {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
              </div>
            ) : filteredChats.length === 0 ? (
              <p className="text-center text-xs text-gray-400 font-semibold py-8">Belum ada obrolan.</p>
            ) : (
              <AnimatePresence>
                {filteredChats.map((chat: { id: string; title: string; isPinned: boolean }, idx: number) => {
                  const isSelected = selectedChatId === chat.id;
                  const isRenaming = renamingId === chat.id;
                  return (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs font-bold ${isSelected ? 'bg-eco-100 text-eco-500 border border-eco-200/60' : 'text-gray-600 hover:bg-gray-100'}`}
                      onClick={() => !isRenaming && setSelectedChatId(chat.id)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${chat.isPinned ? 'text-amber-500' : 'text-gray-400'}`} />
                        {isRenaming ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (updateChatMutation.mutate({ chatId: chat.id, body: { title: renameValue } }), setRenamingId(null))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white border border-eco-200 rounded px-1.5 py-0.5 text-xs outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">{chat.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isRenaming ? (
                          <button onClick={(e) => { e.stopPropagation(); updateChatMutation.mutate({ chatId: chat.id, body: { title: renameValue } }); setRenamingId(null); }} className="p-0.5 text-green-600 hover:bg-green-100 rounded">
                            <Check className="w-3 h-3" />
                          </button>
                        ) : (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); updateChatMutation.mutate({ chatId: chat.id, body: { isPinned: !chat.isPinned } }); }} className={`p-0.5 rounded hover:bg-gray-200 ${chat.isPinned ? 'text-amber-500' : 'text-gray-400'}`}><Pin className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setRenamingId(chat.id); setRenameValue(chat.title); }} className="p-0.5 text-gray-400 hover:text-blue-500 rounded hover:bg-gray-200"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Hapus obrolan ini?')) deleteChatMutation.mutate(chat.id); }} className="p-0.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200"><Trash2 className="w-3 h-3" /></button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── Right: Main chat area ────────────────────────────────── */}
        <div className="flex-1 flex flex-col h-[500px] lg:h-full relative overflow-hidden">
          {/* Ambient background reacts to AI state */}
          <AiAmbientBackground aiState={aiState} />

          {/* Header + mode switcher */}
          <div className="relative z-10 px-6 py-4 border-b border-eco-100/40 bg-white/75 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-poppins font-extrabold text-sm text-eco-500">
                {selectedChatId
                  ? chats.find((c: { id: string; title: string }) => c.id === selectedChatId)?.title || 'Obrolan'
                  : 'Asisten EcoMind AI'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${aiState === 'processing' ? 'bg-amber-400 animate-pulse' : aiState === 'done' ? 'bg-green-400' : 'bg-eco-200'}`} />
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                  {aiState === 'processing' ? 'Memproses…' : aiState === 'done' ? 'Selesai' : 'Siap'}
                </span>
              </div>
            </div>

            {/* Mode pills */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/80 gap-0.5">
              {(['chat', 'verify', 'summarize'] as ChatMode[]).map((mode) => (
                <motion.button
                  key={mode}
                  onClick={() => setChatMode(mode)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all ${chatMode === mode ? 'bg-eco-500 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {MODE_LABELS[mode]}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/40">
            {!selectedChatId ? (
              /* Empty state */
              <motion.div
                className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-lg mx-auto"
                variants={pageVariants} initial="hidden" animate="visible"
              >
                {/* Geometric AI illustration */}
                <div className="relative">
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-eco-100 to-eco-500/20 flex items-center justify-center shadow-glow-eco"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    <Sparkles className="w-9 h-9 text-eco-500" />
                  </motion.div>
                  <span className="ai-dot absolute -top-1 -right-1" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-poppins font-extrabold text-eco-500">
                    Saya siap membantu!
                  </h2>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Ajukan pertanyaan lingkungan, verifikasi rumor/hoaks, atau ringkas tata cara layanan publik.
                  </p>
                </div>

                <motion.div
                  className="grid sm:grid-cols-2 gap-3 w-full"
                  variants={staggerContainer} initial="hidden" animate="visible"
                >
                  {SUGGESTIONS[chatMode].map((s, i) => (
                    <motion.button
                      key={i}
                      variants={suggestionCardVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => selectSuggestion(s.text)}
                      className="text-left bg-white border border-gray-200 p-4 rounded-2xl text-xs font-semibold text-gray-800 flex items-start gap-2.5 shadow-sm hover:border-eco-200 transition-colors"
                    >
                      <span className="shrink-0 mt-0.5">{s.icon}</span>
                      <span>{s.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            ) : messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className="skeleton h-14 w-56 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 font-semibold">
                Kirim pesan untuk memulai.
              </div>
            ) : (
              <motion.div
                className="space-y-4"
                variants={staggerContainer} initial="hidden" animate="visible"
              >
                {currentMessages.map((msg, idx) => {
                  const isAI = msg.role === 'assistant';
                  const isLatest = isAI && idx === currentMessages.length - 1;
                  const ts = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : undefined;

                  if (isAI) {
                    return (
                      <AiMessageBubble
                        key={msg.id}
                        content={msg.content}
                        isLatest={isLatest}
                        timestamp={ts}
                      />
                    );
                  }

                  const fileUrl = (msg as any).fileUrl;
                  const fileName = (msg as any).fileName;
                  const fileType = (msg as any).fileType;

                  return (
                    <motion.div
                      key={msg.id}
                      className="flex justify-end"
                      variants={userBubbleVariants}
                    >
                      <div className="max-w-[78%] space-y-1">
                        <div className="bg-eco-500 text-white rounded-[1.25rem_1.25rem_0.25rem_1.25rem] px-4 py-3 text-xs font-medium leading-relaxed shadow-md">
                          {msg.content}
                          
                          {fileUrl && (
                            <div className="mt-2 pt-2 border-t border-white/20">
                              {fileType?.startsWith('image/') ? (
                                <div className="rounded-lg overflow-hidden border border-white/15 bg-black/10">
                                  <img 
                                    src={fileUrl} 
                                    alt={fileName || "Gambar lampiran"} 
                                    className="object-cover max-h-48 w-full cursor-zoom-in hover:scale-105 transition-transform" 
                                    onClick={() => window.open(fileUrl, '_blank')}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 transition-colors p-2.5 rounded-xl border border-white/10">
                                  <FileText className="w-6 h-6 text-eco-100 shrink-0" />
                                  <div className="overflow-hidden flex-1 min-w-0">
                                    <p className="text-[10px] font-bold truncate text-white">{fileName || "Unduh Berkas"}</p>
                                    <a 
                                      href={fileUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[9px] font-semibold text-eco-200 hover:text-white underline cursor-pointer"
                                    >
                                      Buka / Unduh Berkas
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {ts && <p className="text-[10px] text-gray-400 font-medium text-right pr-1">{ts}</p>}
                      </div>
                    </motion.div>
                  );
                })}

                {/* AI thinking shimmer */}
                <AnimatePresence>
                  {aiState === 'processing' && <AiThinkingBubble />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </div>

          {/* ── Input area ───────────────────────────────────────────── */}
          {selectedChatId && (
            <div className="relative z-10 px-6 py-4 border-t border-eco-100/40 bg-white/80 backdrop-blur">
              {/* Attachment Preview */}
              {selectedFile && (
                <div className="flex items-center justify-between bg-eco-50/80 border border-eco-200/60 p-2.5 rounded-xl mb-3 text-xs font-bold text-gray-800">
                  <div className="flex items-center gap-2">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image className="w-4 h-4 text-eco-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-eco-500" />
                    )}
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="relative">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.gif,.pdf,.docx"
                  className="hidden"
                />

                <textarea
                  ref={textareaRef}
                  placeholder={MODE_PLACEHOLDER[chatMode]}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="chat-textarea w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-4 pr-32 text-xs font-medium text-gray-800 outline-none resize-none"
                />

                {/* Char count */}
                <span className={`absolute left-4 bottom-3 text-[10px] font-semibold ${charCount > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-gray-300'}`}>
                  {charCount}/{MAX_CHARS}
                </span>

                <div className="absolute right-12 bottom-2.5 flex items-center gap-1">
                  {/* Upload file icon */}
                  {chatMode === 'chat' && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Lampirkan Gambar, PDF, atau DOCX"
                      className="p-2 text-gray-400 hover:text-eco-500 transition-colors animate-pulse"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  )}

                  {/* Emoji Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Pilih Emoji"
                      className={`p-2 transition rounded-lg ${showEmojiPicker ? 'text-eco-600 bg-eco-50' : 'text-gray-400 hover:text-eco-500'}`}
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    {showEmojiPicker && (
                      <EmojiPicker
                        onEmojiSelect={(emoji) => {
                          setMessageInput(prev => prev + emoji);
                          setCharCount(prev => prev + emoji.length);
                        }}
                        onClose={() => setShowEmojiPicker(false)}
                        position="top"
                      />
                    )}
                  </div>

                  {/* Voice icon placeholder */}
                  <button
                    type="button"
                    title="Voice input (segera hadir)"
                    className="p-2 text-gray-300 hover:text-eco-200 transition-colors"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                {/* Glowing send button */}
                <motion.button
                  type="submit"
                  disabled={(!messageInput.trim() && !selectedFile) || isPending}
                  className="send-btn absolute right-2 bottom-2 p-2.5 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  whileHover={!isPending ? { scale: 1.1 } : {}}
                  whileTap={!isPending ? { scale: 0.92 } : {}}
                  animate={aiState === 'processing' ? { boxShadow: ['0 0 8px rgba(142,195,176,0.3)', '0 0 28px rgba(142,195,176,0.75)', '0 0 8px rgba(142,195,176,0.3)'] } : {}}
                  transition={aiState === 'processing' ? { repeat: Infinity, duration: 1.5 } : {}}
                >
                  {isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </motion.button>
              </form>

              <p className="text-[9px] text-center text-gray-400 font-medium mt-2">
                Model: Google Gemini 1.5 Flash · Shift+Enter untuk baris baru · Verifikasi fakta kritis pada sumber resmi.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
