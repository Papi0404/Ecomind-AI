'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Loader2, 
  Sparkles, 
  Award, 
  Flame, 
  Trophy,
  MailOpen,
  X
} from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  
  // Modal/Popup state
  const [selectedNotif, setSelectedNotif] = useState<any>(null);

  // 1. Fetch Notifications list
  const { data: notificationsData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.list,
    enabled: !!user,
  });

  // 2. Mark All or Single as Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (body?: { id: string }) => api.notifications.markRead(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
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

  const list = notificationsData?.notifications || [];
  const unreadCount = list.filter((n: any) => !n.isRead).length;

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markReadMutation.mutate(undefined);
    }
  };

  const handleNotificationClick = (item: any) => {
    setSelectedNotif(item);
    if (!item.isRead) {
      markReadMutation.mutate({ id: item.id });
    }
  };

  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('level') || t.includes('naik')) return <Sparkles className="w-5 h-5 text-yellow-500" />;
    if (t.includes('lencana') || t.includes('badge')) return <Award className="w-5 h-5 text-blue-500" />;
    if (t.includes('tantangan') || t.includes('selesai')) return <Trophy className="w-5 h-5 text-green-500" />;
    if (t.includes('streak')) return <Flame className="w-5 h-5 text-orange-500 animate-pulse" />;
    return <Bell className="w-5 h-5 text-[#1A403E]" />;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10">
        
        {/* Page Header */}
        <section className="flex items-center justify-between border-b border-[#8EC3B0]/30 pb-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-gray-900 font-poppins flex items-center space-x-2">
              <Bell className="w-8 h-8 text-[#8EC3B0]" />
              <span>Kotak Masuk Notifikasi</span>
            </h2>
            <p className="text-sm text-gray-700 font-medium">
              Pantau laporan perkembangan pencapaian, kenaikan tingkat, dan lencana baru Anda.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markReadMutation.isPending}
              className="bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </section>

        {/* Notifications Listing */}
        <section className="max-w-3xl space-y-4">
          {notifLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#1A403E]" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-16 bg-[#8EC3B0]/10 rounded-[24px] space-y-3">
              <MailOpen className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500 font-medium">Kotak masuk Anda masih bersih. Tidak ada notifikasi baru.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`
                    p-4 rounded-2xl border transition-all flex items-start space-x-4 cursor-pointer card-lift
                    ${item.isRead 
                      ? 'bg-white/40 border-gray-100 opacity-70' 
                      : 'bg-white border-[#8EC3B0]/60 shadow-sm relative font-semibold'
                    }
                  `}
                >
                  {/* Unread indicators */}
                  {!item.isRead && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}

                  {/* Icon wrapper */}
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(item.title)}
                  </div>

                  {/* Notification Copy details */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    <h4 className="font-extrabold text-xs text-gray-900">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed truncate">
                      {item.content}
                    </p>
                    <span className="text-[9px] text-gray-400 font-bold block pt-1">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Pop-up / Modal Notification Detail */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#8EC3B0]/40 rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 relative animate-bounce-in">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedNotif(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-[#8EC3B0]/15 flex items-center justify-center flex-shrink-0">
                {getNotificationIcon(selectedNotif.title)}
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider">Detail Notifikasi</span>
                <h3 className="font-extrabold text-sm text-gray-900 leading-tight">
                  {selectedNotif.title}
                </h3>
              </div>
            </div>

            <div className="bg-[#FAF6EB] p-4 rounded-2xl border border-[#8EC3B0]/15">
              <p className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                {selectedNotif.content}
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
              <span>Waktu: {new Date(selectedNotif.createdAt).toLocaleDateString('id-ID', { 
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit' 
              })}</span>
            </div>

            <button
              onClick={() => setSelectedNotif(null)}
              className="w-full bg-[#1A403E] hover:bg-[#122c2b] text-white font-extrabold text-xs py-2.5 rounded-xl transition shadow-md"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
