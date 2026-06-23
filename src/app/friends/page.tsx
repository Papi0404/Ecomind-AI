'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  Send,
  MessageSquare,
  Loader2,
  Flame,
  UserCheck,
  Clock
} from 'lucide-react';

export default function FriendsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // Search input and selected friend state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Query current friends, pending sent and pending received
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.friends.list(),
    enabled: !!user,
    refetchInterval: 5000, // Refresh friend list every 5 seconds for status updates
  });

  // 2. Query search users
  const { data: searchResults, refetch: searchUsers } = useQuery({
    queryKey: ['searchUsers', searchTerm],
    queryFn: () => api.friends.list(searchTerm),
    enabled: !!user && searchTerm.trim().length > 0,
  });

  // 3. Query chat messages with the selected friend
  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', selectedFriend?.id],
    queryFn: () => api.friends.chat(selectedFriend.id),
    enabled: !!user && !!selectedFriend,
    refetchInterval: 2000, // Polling chat messages every 2 seconds
  });

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: api.friends.add,
    onSuccess: (data) => {
      alert(data.message || 'Permintaan pertemanan dikirim.');
      setSearchTerm('');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal mengirim permintaan pertemanan.');
    }
  });

  const acceptRequestMutation = useMutation({
    mutationFn: api.friends.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal menerima pertemanan.');
    }
  });

  const deleteFriendMutation = useMutation({
    mutationFn: api.friends.decline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      if (selectedFriend) {
        setSelectedFriend(null);
      }
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal menghapus pertemanan.');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ friendId, content }: { friendId: string; content: string }) =>
      api.friends.sendDm(friendId, content),
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['chat', selectedFriend?.id] });
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal mengirim pesan.');
    }
  });

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatData?.messages]);

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

  const friends = friendsData?.friends || [];
  const pendingSent = friendsData?.pendingSent || [];
  const pendingReceived = friendsData?.pendingReceived || [];

  const handleAddFriend = (email: string) => {
    sendRequestMutation.mutate(email);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedFriend) return;
    sendMessageMutation.mutate({
      friendId: selectedFriend.id,
      content: messageInput.trim(),
    });
  };

  // Helper to format online/offline status
  const formatOnlineStatus = (lastActiveAtStr: string | null) => {
    if (!lastActiveAtStr) return 'Offline';
    const lastActive = new Date(lastActiveAtStr);
    const diffMs = new Date().getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 3) {
      return <span className="text-green-600 font-extrabold flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" /> Online</span>;
    } else if (diffMins < 60) {
      return <span className="text-gray-500 font-medium flex items-center"><Clock className="w-3 h-3 mr-1" /> Offline {diffMins}m lalu</span>;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return <span className="text-gray-500 font-medium flex items-center"><Clock className="w-3 h-3 mr-1" /> Offline {diffHours}j lalu</span>;
      }
      return <span className="text-gray-400 font-medium">Offline</span>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-hidden lg:h-screen pt-20 lg:pt-10 flex flex-col space-y-6">
        
        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-gray-900 font-poppins flex items-center space-x-2">
              <Users className="w-8 h-8 text-[#8EC3B0]" />
              <span className="text-gray-900">Teman & Direct Message</span>
            </h2>
            <p className="text-sm text-gray-700 font-medium">
              Kelola daftar teman, pantau daily streak mereka, dan kirim pesan secara langsung.
            </p>
          </div>
        </section>

        {/* Workspace Body Grid */}
        <div className="grid lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* LEFT SIDEBAR: Friends list and Add Friend (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4 min-h-0">
            
            {/* Search / Add Friend Panel */}
            <div className="glass-panel p-4 rounded-2xl space-y-3 flex-shrink-0">
              <span className="text-[10px] font-bold text-gray-700 uppercase">Cari & Tambah Teman</span>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ketik email atau nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0]"
                />
              </div>

              {/* Search Results */}
              {searchTerm.trim().length > 0 && searchResults && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-100 shadow-sm">
                  {searchResults.users?.map((resUser: any) => (
                    <div key={resUser.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={resUser.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
                          alt={resUser.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900">{resUser.name}</p>
                          <p className="text-[9px] text-gray-500 font-medium">{resUser.email}</p>
                        </div>
                      </div>

                      {resUser.friendshipStatus === 'NONE' && (
                        <button
                          onClick={() => handleAddFriend(resUser.email)}
                          className="p-1.5 bg-[#1A403E] text-white rounded-lg hover:bg-[#122c2b]"
                          title="Tambah Teman"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {resUser.friendshipStatus === 'PENDING' && (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Tertunda
                        </span>
                      )}
                      {resUser.friendshipStatus === 'ACCEPTED' && (
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          Teman
                        </span>
                      )}
                    </div>
                  ))}
                  {searchResults.users?.length === 0 && (
                    <p className="text-[10px] text-gray-400 font-semibold p-3 text-center">Pengguna tidak ditemukan.</p>
                  )}
                </div>
              )}
            </div>

            {/* Pending Requests Received */}
            {pendingReceived.length > 0 && (
              <div className="glass-panel p-4 rounded-2xl space-y-3 flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-700 uppercase block">Permintaan Pertemanan Masuk</span>
                <div className="space-y-2">
                  {pendingReceived.map((req: any) => (
                    <div key={req.friendshipId} className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <img
                          src={req.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
                          alt={req.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 truncate">{req.name}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => acceptRequestMutation.mutate(req.friendshipId)}
                          className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-md"
                          title="Terima"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteFriendMutation.mutate(req.friendshipId)}
                          className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-md"
                          title="Tolak"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends Directory List */}
            <div className="glass-panel p-4 rounded-2xl flex-1 flex flex-col min-h-0">
              <span className="text-[10px] font-bold text-gray-700 uppercase block mb-3">Daftar Teman ({friends.length})</span>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {friendsLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-[#8EC3B0]" />
                  </div>
                )}

                {friends.map((friend: any) => {
                  const isSelected = selectedFriend?.id === friend.id;
                  return (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedFriend(friend)}
                      className={`
                        p-3 rounded-xl flex items-center justify-between border cursor-pointer transition-all
                        ${isSelected
                          ? 'bg-[#8EC3B0]/20 border-[#8EC3B0]'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <img
                          src={friend.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
                          alt={friend.name}
                          className="w-9 h-9 rounded-xl object-cover border border-gray-100"
                        />
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{friend.name}</h4>
                          <div className="text-[9px] mt-0.5">
                            {formatOnlineStatus(friend.lastActiveAt)}
                          </div>
                        </div>
                      </div>

                      {/* Streak badge */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <span className="bg-[#FAF6EB] border border-gray-200 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Lvl {friend.level}
                        </span>
                        {friend.streakCount > 0 && (
                          <div className="flex items-center text-orange-500 font-extrabold text-xs" title="Daily Streak">
                            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                            <span className="text-[10px]">{friend.streakCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!friendsLoading && friends.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs font-medium space-y-2">
                    <UserCheck className="w-8 h-8 mx-auto text-gray-300" />
                    <p>Belum ada teman terdaftar.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT CHAT AREA (8 cols) */}
          <div className="lg:col-span-8 glass-panel rounded-3xl flex flex-col justify-between overflow-hidden min-h-0">
            
            {selectedFriend ? (
              <>
                {/* Chat Top Banner */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedFriend.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
                      alt={selectedFriend.name}
                      className="w-9 h-9 rounded-xl object-cover border"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{selectedFriend.name}</h4>
                      <p className="text-[10px] mt-0.5">
                        {formatOnlineStatus(selectedFriend.lastActiveAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menghapus pertemanan dengan ${selectedFriend.name}?`)) {
                        deleteFriendMutation.mutate(selectedFriend.friendshipId);
                      }
                    }}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold border border-red-200 px-3 py-1.5 rounded-lg bg-red-50/50 hover:bg-red-50"
                  >
                    Hapus Pertemanan
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/50">
                  {chatLoading && (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-[#8EC3B0]" />
                    </div>
                  )}

                  {!chatLoading && chatData?.messages?.map((msg: any) => {
                    const isSelf = msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm font-semibold
                            ${isSelf
                              ? 'bg-[#1A403E] text-white rounded-tr-none'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                            }
                          `}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <span className={`text-[8px] block text-right mt-1 opacity-70`}>
                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {!chatLoading && chatData?.messages?.length === 0 && (
                    <div className="text-center py-20 text-gray-400 text-xs font-semibold">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      Belum ada obrolan. Mulai percakapan sekarang!
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Textbox Area */}
                <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4 flex items-center space-x-3 flex-shrink-0">
                  <input
                    type="text"
                    placeholder={`Kirim pesan ke ${selectedFriend.name}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0] focus:ring-1 focus:ring-[#8EC3B0]"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="bg-[#1A403E] hover:bg-[#122c2b] text-white p-3 rounded-xl shadow-md transition-all flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <MessageSquare className="w-16 h-16 text-[#8EC3B0] opacity-80 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Belum Ada Teman Terpilih</h4>
                  <p className="text-xs text-gray-700 max-w-xs mx-auto mt-1">
                    Silakan pilih teman di bilah kiri untuk membuka ruang obrolan direct message pribadi.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
