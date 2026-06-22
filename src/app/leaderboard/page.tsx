'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  Award, 
  Flame, 
  Loader2, 
  Sparkles,
  Trophy
} from 'lucide-react';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading: boardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: api.leaderboard.get,
    enabled: !!user,
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
        <Loader2 className="w-10 h-10 text-[#2D5A27] animate-spin" />
      </div>
    );
  }

  const list = leaderboardData?.leaderboard || [];

  // Split top 3 vs 4-10
  const topThree = list.slice(0, 3);
  const remaining = list.slice(3);

  // Rearrange top 3 for classic podium look: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], rank: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], rank: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], rank: 3 });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10">
        
        {/* Page Header */}
        <section className="space-y-1">
          <h2 className="text-3xl font-extrabold text-[#1F3B1A] dark:text-white font-poppins flex items-center space-x-2">
            <Award className="w-8 h-8 text-yellow-500" />
            <span>Peringkat Eco Pahlawan</span>
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Lihat pegiat bumi lestari dengan poin tertinggi di tingkat nasional minggu ini.
          </p>
        </section>

        {boardLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-center text-xs text-gray-400 font-semibold py-12">Leaderboard masih kosong.</p>
        ) : (
          <div className="space-y-8">
            
            {/* Top 3 Podium Cards */}
            <div className="flex flex-col sm:flex-row items-end justify-center gap-6 pt-10">
              {podiumOrder.map((topUser: any) => {
                const isFirst = topUser.rank === 1;
                const isSecond = topUser.rank === 2;
                
                return (
                  <div 
                    key={topUser.id}
                    className={`
                      glass-panel p-6 rounded-[28px] text-center flex flex-col items-center justify-between w-full sm:w-56 relative
                      ${isFirst 
                        ? 'h-80 border-amber-400 shadow-amber-400/5 bg-gradient-to-t from-[#2D5A27]/20 to-amber-500/10' 
                        : 'h-64 border-[#A8E6A3]/30'
                      }
                      order-last sm:order-none
                    `}
                  >
                    {/* Crown for #1 */}
                    {isFirst && (
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce">
                        👑
                      </div>
                    )}

                    {/* Rank Badge */}
                    <span className={`
                      text-[10px] font-extrabold px-3 py-1 rounded-full text-white uppercase tracking-wider mb-2
                      ${isFirst ? 'bg-amber-500' : isSecond ? 'bg-slate-400' : 'bg-amber-700'}
                    `}>
                      Peringkat #{topUser.rank}
                    </span>

                    {/* Avatar */}
                    <div className="relative">
                      <img
                        src={topUser.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
                        alt={topUser.name}
                        className={`
                          rounded-2xl object-cover mx-auto
                          ${isFirst ? 'w-20 h-20 border-4 border-amber-400' : 'w-16 h-16 border-2 border-[#A8E6A3]'}
                        `}
                      />
                      <span className="absolute -bottom-2 -right-2 bg-[#2D5A27] text-[#FFF8E7] text-[9px] font-bold px-1.5 py-0.2 rounded">
                        LVL {topUser.level}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="mt-4">
                      <h4 className="font-extrabold text-xs truncate max-w-40">{topUser.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 flex items-center justify-center mt-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500 mr-1" />
                        <span>{topUser.streakCount} Hari Streak</span>
                      </p>
                    </div>

                    {/* EcoPoints summary */}
                    <div className="bg-[#7ED957]/20 border border-[#7ED957]/40 text-[#2D5A27] dark:text-[#A8E6A3] text-xs font-extrabold px-4 py-1.5 rounded-full mt-4 w-full">
                      {topUser.ecoPoints} EP
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Positions 4-10 Table */}
            {remaining.length > 0 && (
              <div className="glass-panel rounded-[24px] overflow-hidden">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-[#2D5A27]/5 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-4 pl-6">Posisi</th>
                      <th className="p-4">Pengguna</th>
                      <th className="p-4">Tingkat</th>
                      <th className="p-4">Daily Streak</th>
                      <th className="p-4 pr-6 text-right">Total Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                    {remaining.map((item: any, idx: number) => {
                      const pos = idx + 4;
                      const isMe = item.id === user.id;

                      return (
                        <tr 
                          key={item.id}
                          className={`
                            hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors
                            ${isMe ? 'bg-[#7ED957]/5 text-[#2D5A27] dark:text-[#7ED957]' : ''}
                          `}
                        >
                          <td className="p-4 pl-6 font-extrabold text-gray-400">#{pos}</td>
                          <td className="p-4 flex items-center space-x-3">
                            <img
                              src={item.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
                              alt={item.name}
                              className="w-8 h-8 rounded-lg object-cover border"
                            />
                            <span className="font-extrabold truncate max-w-44">{item.name}</span>
                          </td>
                          <td className="p-4">
                            <span className="bg-[#2D5A27]/10 text-[#2D5A27] dark:text-[#A8E6A3] text-[9px] font-bold px-2 py-0.5 rounded">
                              LVL {item.level}
                            </span>
                          </td>
                          <td className="p-4 flex items-center space-x-1 mt-1">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span>{item.streakCount} hari</span>
                          </td>
                          <td className="p-4 pr-6 text-right font-extrabold text-[#2D5A27] dark:text-[#A8E6A3]">
                            {item.ecoPoints} EP
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
