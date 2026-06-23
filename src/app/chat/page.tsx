'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Pin, 
  Trash2, 
  Edit2, 
  Send, 
  Search, 
  Loader2, 
  Sparkles,
  Check,
  X,
  Compass,
  Leaf,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Chat Mode: 'chat' | 'verify' | 'summarize'
  const [chatMode, setChatMode] = useState<'chat' | 'verify' | 'summarize'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Chats List
  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: api.chat.list,
    enabled: !!user,
  });

  // 2. Fetch Selected Chat Messages
  const { data: currentChatData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedChatId],
    queryFn: () => api.chat.get(selectedChatId!),
    enabled: !!selectedChatId,
  });

  // 3. Create Chat Mutation
  const createChatMutation = useMutation({
    mutationFn: api.chat.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      setSelectedChatId(res.chat.id);
    },
  });

  // 4. Send Message Mutation (Standard Chat)
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) => 
      api.chat.send(chatId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] }); // update EcoPoints
    },
  });

  // 5. Verify Claim / Summarize Custom Mutations to feed results directly into Chat history
  const customAiMutation = useMutation({
    mutationFn: async ({ content, mode }: { content: string; mode: 'verify' | 'summarize' }) => {
      // First, log user message in local DB (standard message creation)
      // Since our server schema links messages to a Chat, we send the content to the Chat first
      await api.chat.send(selectedChatId!, `[Mode ${mode === 'verify' ? 'Verifikasi' : 'Ringkasan'}]: ${content}`);
      
      let aiResponseText = '';
      if (mode === 'verify') {
        const verifyData = await api.community.verify(content);
        aiResponseText = `**🔍 Hasil Verifikasi AI**\n\n**Kategori:** ${verifyData.category}\n**Skor Kredibilitas:** ${verifyData.score}/100\n\n**Analisis:**\n${verifyData.analysis}\n\n**Rekomendasi Aksi:**\n${verifyData.recommendations.map((r: string) => `• ${r}`).join('\n')}\n\n*Peringatan: Analisis bersifat prediktif. Selalu konfirmasi dengan koordinator lembaga publik terkait.*`;
      } else {
        const summarizeData = await api.community.summarize(content);
        aiResponseText = `**📄 Ringkasan Prosedur AI**\n\n${summarizeData.summary}`;
      }

      // Then save the AI result message into the chat database
      return api.chat.send(selectedChatId!, aiResponseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal memproses permintaan AI.');
    }
  });

  // 6. Update Chat (Rename or Pin) Mutation
  const updateChatMutation = useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body: any }) => 
      api.chat.update(chatId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  // 7. Delete Chat Mutation
  const deleteChatMutation = useMutation({
    mutationFn: api.chat.delete,
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
    },
  });

  // Scroll to bottom of message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatData, customAiMutation.isPending, sendMessageMutation.isPending]);

  // Auth Protection
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

  const chats = chatsData?.chats || [];
  const filteredChats = chats.filter((c: any) => 
    c.title.toLowerCase().includes(chatSearch.toLowerCase())
  );
  const currentMessages = currentChatData?.chat?.messages || [];

  const handleCreateChat = () => {
    createChatMutation.mutate();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatId) return;
    if (sendMessageMutation.isPending || customAiMutation.isPending) return;

    const content = messageInput;
    setMessageInput('');

    try {
      if (chatMode === 'chat') {
        await sendMessageMutation.mutateAsync({ chatId: selectedChatId, content });
      } else {
        await customAiMutation.mutateAsync({ content, mode: chatMode });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pesan.');
    }
  };

  const handleStartRename = (chatId: string, title: string) => {
    setRenamingId(chatId);
    setRenameValue(title);
  };

  const handleSaveRename = (chatId: string) => {
    if (renameValue.trim()) {
      updateChatMutation.mutate({ chatId, body: { title: renameValue } });
    }
    setRenamingId(null);
  };

  const handleTogglePin = (chatId: string, isPinned: boolean) => {
    updateChatMutation.mutate({ chatId, body: { isPinned: !isPinned } });
  };

  const handleDeleteChat = (chatId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus obrolan ini?')) {
      deleteChatMutation.mutate(chatId);
    }
  };

  const selectSuggestion = async (text: string) => {
    let chatId = selectedChatId;
    if (!chatId) {
      const res = await createChatMutation.mutateAsync();
      chatId = res.chat.id;
    }
    if (chatMode === 'chat') {
      sendMessageMutation.mutate({ chatId: chatId!, content: text });
    } else {
      customAiMutation.mutate({ content: text, mode: chatMode });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Chat Component Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden lg:h-screen pt-16 lg:pt-0">
        
        {/* Left Side: Conversations Sidebar list */}
        <div className="w-full lg:w-80 border-r border-[#8EC3B0]/30 bg-white/60 flex flex-col h-64 lg:h-full">
          {/* Header Controls */}
          <div className="p-4 space-y-3">
            <button
              onClick={handleCreateChat}
              disabled={createChatMutation.isPending}
              className="w-full bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-sm"
            >
              {createChatMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Plus className="w-4 h-4 text-white" />
              )}
              <span>Percakapan Baru</span>
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari obrolan..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0]"
              />
            </div>
          </div>

          {/* List items scroll container */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {chatsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#1A403E]" />
              </div>
            ) : filteredChats.length === 0 ? (
              <p className="text-center text-xs text-gray-400 font-semibold py-6">Tidak ada obrolan.</p>
            ) : (
              filteredChats.map((chat: any) => {
                const isSelected = selectedChatId === chat.id;
                const isRenaming = renamingId === chat.id;

                return (
                  <div
                    key={chat.id}
                    className={`
                      group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs font-bold
                      ${isSelected 
                        ? 'bg-[#8EC3B0]/20 text-[#1A403E] border border-[#8EC3B0]/40' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => !isRenaming && setSelectedChatId(chat.id)}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden flex-1 mr-2">
                      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${chat.isPinned ? 'text-amber-500' : 'text-gray-400'}`} />
                      {isRenaming ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(chat.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white border border-[#8EC3B0] rounded px-1.5 py-0.5 outline-none font-semibold text-gray-900"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate">{chat.title}</span>
                      )}
                    </div>

                    {/* Inline actions (appear on hover) */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isRenaming ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSaveRename(chat.id); }}
                          className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTogglePin(chat.id, chat.isPinned); }}
                            className={`p-0.5 rounded hover:bg-gray-200 ${chat.isPinned ? 'text-amber-500' : 'text-gray-400'}`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartRename(chat.id, chat.title); }}
                            className="p-0.5 text-gray-400 hover:text-blue-500 rounded hover:bg-gray-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                            className="p-0.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Main Chat Frame */}
        <div className="flex-1 flex flex-col h-[500px] lg:h-full bg-white relative">
          
          {/* Active Chat Header with Mode Selector */}
          <div className="p-4 border-b border-[#8EC3B0]/30 bg-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
            <div>
              <h3 className="font-extrabold text-sm text-[#1A403E] font-poppins">
                {selectedChatId 
                  ? chats.find((c: any) => c.id === selectedChatId)?.title || 'Detail Chat'
                  : 'Asisten EcoMind AI'
                }
              </h3>
              <span className="text-[10px] text-gray-500 font-semibold uppercase">Asisten Multi-Studi Kasus</span>
            </div>

            {/* Chat Mode Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setChatMode('chat')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all flex items-center space-x-1 ${
                  chatMode === 'chat' ? 'bg-[#1A403E] text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Leaf className="w-3 h-3" />
                <span>Diskusi Umum/Hijau</span>
              </button>
              <button
                onClick={() => setChatMode('verify')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all flex items-center space-x-1 ${
                  chatMode === 'verify' ? 'bg-[#1A403E] text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Verifikasi Hoaks</span>
              </button>
              <button
                onClick={() => setChatMode('summarize')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all flex items-center space-x-1 ${
                  chatMode === 'summarize' ? 'bg-[#1A403E] text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Ringkas Prosedur</span>
              </button>
            </div>
          </div>

          {/* Messages list area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            {!selectedChatId ? (
              /* Empty state suggestion cards */
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#8EC3B0]/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#1A403E]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold font-poppins text-[#1A403E]">
                    Tanya AI & Asisten Verifikasi Warga
                  </h2>
                  <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                    Ajukan pertanyaan seputar lingkungan hidup, minta verifikasi rumor keliru (misinformasi), atau ringkas tata cara layanan administrasi komunitas.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 w-full">
                  {chatMode === 'chat' && [
                    'Bagaimana cara mengurangi emisi karbon dari perjalanan harian?',
                    'Apa cara terbaik mendaur ulang baterai bekas?',
                    'Beri saya ide resep masakan ramah lingkungan hari ini.',
                    'Apa itu ekonomi sirkular dan contoh penerapannya?'
                  ].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => selectSuggestion(text)}
                      className="text-left bg-white border border-gray-200 p-3.5 rounded-2xl hover:border-[#8EC3B0] transition-all text-xs font-semibold text-gray-900 flex items-start space-x-2 shadow-sm"
                    >
                      <Compass className="w-4 h-4 text-[#1A403E] mr-1 flex-shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </button>
                  ))}

                  {chatMode === 'verify' && [
                    'Bantuan langsung tunai 5 juta rupiah dibagikan di link undian-berhadiah.net secara gratis.',
                    'Warga desa yang terkena banjir bisa klaim beras gratis 10kg lewat WhatsApp PMI pusat.',
                  ].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => selectSuggestion(text)}
                      className="text-left bg-white border border-gray-200 p-3.5 rounded-2xl hover:border-[#8EC3B0] transition-all text-xs font-semibold text-gray-900 flex items-start space-x-2 shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#1A403E] mr-1 flex-shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </button>
                  ))}

                  {chatMode === 'summarize' && [
                    'Prosedur Pengajuan Bantuan: 1. Pemohon melengkapi dokumen formulir B-12, fotokopi KTP, KK, lalu diserahkan ke Dinas Sosial di jam kerja paling lambat tanggal 30 tiap bulannya...',
                  ].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => selectSuggestion(text)}
                      className="text-left bg-white border border-gray-200 p-3.5 rounded-2xl hover:border-[#8EC3B0] transition-all text-xs font-semibold text-gray-900 flex items-start space-x-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-[#1A403E] mr-1 flex-shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : messagesLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A403E]" />
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-gray-500 font-semibold">
                Kirim pesan untuk memulai obrolan atau verifikasi.
              </div>
            ) : (
              <div className="space-y-4">
                {currentMessages.map((msg: any) => {
                  const isAI = msg.role === 'assistant';
                  return (
                    <div
                      key={msg.id}
                      className={`
                        flex ${isAI ? 'justify-start' : 'justify-end'}
                      `}
                    >
                      <div className={`
                        max-w-[80%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed shadow-sm
                        ${isAI 
                          ? 'bg-white border border-[#8EC3B0]/30 text-gray-900' 
                          : 'bg-[#1A403E] text-white'
                        }
                      `}>
                        <div className="whitespace-pre-line">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(sendMessageMutation.isPending || customAiMutation.isPending) && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#8EC3B0]/30 rounded-[20px] px-4 py-3 flex items-center space-x-2 shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1A403E]" />
                      <span className="text-[10px] text-gray-400 font-bold">EcoMind AI sedang memproses jawaban...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Form input field area */}
          {selectedChatId && (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#8EC3B0]/30 bg-white/80">
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    chatMode === 'chat' ? 'Tanyakan seputar lingkungan hidup...' :
                    chatMode === 'verify' ? 'Tempel desas-desus / klaim hoaks untuk diverifikasi...' :
                    'Tempel tata cara layanan publik panjang untuk diringkas...'
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-2xl py-3.5 pl-4 pr-14 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0] transition-all"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendMessageMutation.isPending || customAiMutation.isPending}
                  className="absolute right-2 top-2 bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow-md shadow-[#1A403E]/10"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-[9px] text-center text-gray-500 font-bold mt-1.5">
                Model: Google Gemini 1.5 Flash. Penilaian akhir keabsahan data tetap berada pada pihak koordinator instansi resmi terkait.
              </p>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
