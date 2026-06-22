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
  Leaf
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

  // 4. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) => 
      api.chat.send(chatId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] }); // update EcoPoints
    },
  });

  // 5. Update Chat (Rename or Pin) Mutation
  const updateChatMutation = useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body: any }) => 
      api.chat.update(chatId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  // 6. Delete Chat Mutation
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
  }, [currentChatData]);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-grid-pattern flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2D5A27] animate-spin" />
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
    if (!messageInput.trim() || !selectedChatId || sendMessageMutation.isPending) return;

    const content = messageInput;
    setMessageInput('');

    try {
      await sendMessageMutation.mutateAsync({ chatId: selectedChatId, content });
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
    sendMessageMutation.mutate({ chatId: chatId!, content: text });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Chat Component Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden lg:h-screen pt-16 lg:pt-0">
        
        {/* Left Side: Conversations Sidebar list (Grid-4 equivalent) */}
        <div className="w-full lg:w-80 border-r border-[#A8E6A3]/30 bg-white/40 dark:bg-black/10 flex flex-col h-64 lg:h-full">
          {/* Header Controls */}
          <div className="p-4 space-y-3">
            <button
              onClick={handleCreateChat}
              disabled={createChatMutation.isPending}
              className="w-full bg-[#2D5A27] hover:bg-[#1f3b1a] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-sm"
            >
              {createChatMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
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
                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:border-[#7ED957]"
              />
            </div>
          </div>

          {/* List items scroll container */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {chatsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#2D5A27]" />
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
                        ? 'bg-[#A8E6A3]/30 text-[#2D5A27] dark:bg-[#7ED957]/10 dark:text-[#7ED957]' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40'
                      }
                    `}
                    onClick={() => !isRenaming && setSelectedChatId(chat.id)}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden flex-1 mr-2">
                      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${chat.isPinned ? 'text-amber-500' : ''}`} />
                      {isRenaming ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(chat.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white border border-[#7ED957] rounded px-1.5 py-0.5 outline-none font-semibold"
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
                            className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${chat.isPinned ? 'text-amber-500' : 'text-gray-400'}`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartRename(chat.id, chat.title); }}
                            className="p-0.5 text-gray-400 hover:text-blue-500 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                            className="p-0.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
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
        <div className="flex-1 flex flex-col h-[500px] lg:h-full bg-white dark:bg-[#0b120a]/40 relative">
          
          {/* Active Chat Header */}
          <div className="p-4 border-b border-[#A8E6A3]/30 bg-white/80 dark:bg-[#122210]/60 flex items-center justify-between z-10">
            <div>
              <h3 className="font-extrabold text-sm text-[#2D5A27] dark:text-[#7ED957] font-poppins">
                {selectedChatId 
                  ? chats.find((c: any) => c.id === selectedChatId)?.title || 'Detail Chat'
                  : 'Asisten EcoMind AI'
                }
              </h3>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Eco-sustainability Chatbot</span>
            </div>
            
            {/* EcoPoints Bonus notification indicator */}
            <div className="bg-[#7ED957]/20 border border-[#7ED957]/40 text-[#2D5A27] dark:text-[#A8E6A3] text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[#2D5A27]" />
              <span>Dapatkan +5 EP per tanya-jawab</span>
            </div>
          </div>

          {/* Messages list area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!selectedChatId ? (
              /* Empty state suggestion cards */
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#7ED957]/20 flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-[#2D5A27]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold font-poppins text-[#2D5A27] dark:text-[#7ED957]">
                    Tanya Tentang Gaya Hidup Hijau
                  </h2>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    AI kami dilatih secara khusus untuk isu lingkungan hidup. Kami akan menolak dengan sopan topik di luar keberlanjutan bumi.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 w-full">
                  {[
                    'Bagaimana cara mengurangi emisi karbon dari perjalanan harian?',
                    'Apa cara terbaik mendaur ulang baterai bekas?',
                    'Beri saya ide resep masakan ramah lingkungan hari ini.',
                    'Apa itu ekonomi sirkular dan contoh penerapannya?'
                  ].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => selectSuggestion(text)}
                      className="text-left bg-white dark:bg-[#122210] border border-gray-200 dark:border-gray-800 p-3.5 rounded-2xl hover:border-[#7ED957] transition-all text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-start space-x-2"
                    >
                      <Compass className="w-4 h-4 text-[#2D5A27] mr-1 flex-shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : messagesLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-gray-400 font-semibold">
                Kirim pesan untuk memulai obrolan hijau.
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
                        max-w-[80%] rounded-[20px] p-4 text-xs font-medium leading-relaxed
                        ${isAI 
                          ? 'bg-[#2D5A27]/5 border border-[#A8E6A3]/30 text-gray-800 dark:text-[#E8F5E9]' 
                          : 'bg-[#2D5A27] text-white shadow-md'
                        }
                      `}>
                        {/* Render simple markdown replacements (like lists and bold tags) */}
                        <div className="whitespace-pre-line">
                          {msg.content
                            .replace(/\*\*(.*?)\*\*/g, '$1') // remove simple bold syntax for readability
                            .replace(/-\s(.*)/g, '• $1')     // convert simple markdown lists
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-[#2D5A27]/5 border border-[#A8E6A3]/30 rounded-[20px] px-4 py-3 flex items-center space-x-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D5A27]" />
                      <span className="text-[10px] text-gray-400 font-bold">Eco AI sedang merespon...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Form input field area */}
          {selectedChatId && (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#A8E6A3]/30 bg-white/80 dark:bg-[#122210]/60">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik pertanyaan lingkungan Anda disini..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-2xl py-3.5 pl-4 pr-14 text-xs font-semibold outline-none focus:border-[#7ED957] transition-all"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="absolute right-2 top-2 bg-[#2D5A27] hover:bg-[#1f3b1a] disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow-md shadow-[#2D5A27]/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[9px] text-center text-gray-400 font-bold mt-1.5">
                Pesan diproses menggunakan Google Gemini 1.5 Flash. Jawaban dibatasi untuk isu keberlanjutan bumi.
              </p>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
