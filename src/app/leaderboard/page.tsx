'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Award, Flame, Loader2, Trophy, Leaf, TrendingDown } from 'lucide-react';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const { data: leaderboardData, isLoading: boardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: api.leaderboard.get,
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#1A403E] animate-spin" /></div>;
  }

  const list = leaderboardData?.leaderboard || [];
  const topThree = list.slice(0, 3);
  const remaining = list.slice(3);

  const podiumOrder: any[] = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], rank: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], rank: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], rank: 3 });

  const podiumStyles: Record<number, { height: string; badge: string; ring: string }> = {
    1: { height: 'h-80', badge: 'bg-amber-500', ring: 'border-amber-400' },
    2: { height: 'h-64', badge: 'bg-gray-400', ring: 'border-gray-300' },
    3: { height: 'h-56', badge: 'bg-amber-700', ring: 'border-amber-600' },
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10">

        {/* Header */}
        <section className="space-y-1">
          <h2 className="text-3xl font-extrabold text-gray-900 font-poppins flex items-center space-x-2">
            <Award className="w-8 h-8 text-yellow-500" />
            <span>Peringkat Eco Pahlawan</span>
          </h2>
          <p className="text-sm text-gray-700 font-medium">
            Pengguna dengan EcoPoints & reduksi CO₂ terbanyak minggu ini. Selesaikan tantangan untuk naik peringkat!
          </p>
        </section>

        {boardLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#1A403E]" /></div>
        ) : list.length === 0 ? (
          <p className="text-center text-xs text-gray-400 font-semibold py-12">Leaderboard masih kosong.</p>
        ) : (
          <div className="space-y-10">

            {/* Top 3 Podium */}
            <div className="flex flex-col sm:flex-row items-end justify-center gap-4 pt-10">
              {podiumOrder.map((topUser: any) => {
                const s = podiumStyles[topUser.rank];
                return (
                  <div key={topUser.id}
                    className={`glass-panel ${s.height} border-2 ${s.ring} p-6 rounded-[28px] text-center flex flex-col items-center justify-between w-full sm:w-52 relative`}>
                    {topUser.rank === 1 && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl animate-bounce">👑</div>
                    )}

                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full text-white uppercase tracking-wider ${s.badge}`}>
                      #{topUser.rank}
                    </span>

                    <div className="relative">
                      <img src={topUser.avatarUrl || 'https://i.pravatar.cc/150?img=12'} alt={topUser.name}
                        className={`rounded-2xl object-cover mx-auto border-2 ${s.ring} ${topUser.rank === 1 ? 'w-20 h-20' : 'w-16 h-16'}`} />
                      <span className="absolute -bottom-2 -right-2 bg-[#1A403E] text-[#8EC3B0] text-[9px] font-bold px-1.5 py-0.5 rounded">
                        LVL {topUser.level}
                      </span>
                    </div>

                    <div className="space-y-1 w-full">
                      <h4 className="font-extrabold text-xs truncate">{topUser.name}</h4>
                      <div className="flex items-center justify-center text-[10px] text-orange-500 font-bold">
                        <Flame className="w-3 h-3 mr-0.5" />{topUser.streakCount}d
                      </div>
                      <div className="bg-[#8EC3B0]/20 border border-[#8EC3B0]/40 text-[#1A403E] text-xs font-extrabold px-3 py-1 rounded-full">
                        {topUser.ecoPoints} EP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rank 4–10 Table */}
            {remaining.length > 0 && (
              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-[#1A403E]/5 text-gray-600 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-4 pl-6">Posisi</th>
                      <th className="p-4">Pengguna</th>
                      <th className="p-4">Level</th>
                      <th className="p-4">Streak</th>
                      <th className="p-4">CO₂ Saved</th>
                      <th className="p-4 pr-6 text-right">EcoPoints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {remaining.map((item: any, idx: number) => {
                      const pos = idx + 4;
                      const isMe = item.id === user.id;
                      const co2Est = (item.ecoPoints * 0.02).toFixed(1);
                      return (
                        <tr key={item.id}
                          className={`hover:bg-gray-50 transition-colors ${isMe ? 'bg-[#8EC3B0]/10' : ''}`}>
                          <td className="p-4 pl-6 font-extrabold text-gray-400">#{pos}</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <img src={item.avatarUrl || 'https://i.pravatar.cc/150?img=12'} alt={item.name}
                                className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                              <span className="font-extrabold text-gray-900 truncate max-w-40">
                                {item.name}{isMe && <span className="ml-1 text-[#8EC3B0]">(Anda)</span>}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-[#8EC3B0]/20 text-[#1A403E] text-[9px] font-bold px-2 py-0.5 rounded">LVL {item.level}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-1 text-orange-500 font-bold">
                              <Flame className="w-3.5 h-3.5" /><span>{item.streakCount} hari</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-1 text-green-600 font-bold">
                              <TrendingDown className="w-3.5 h-3.5" /><span>{co2Est} kg</span>
                            </div>
                          </td>
                          <td className="p-4 pr-6 text-right font-extrabold text-[#1A403E]">{item.ecoPoints} EP</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <div className="bg-[#FAF6EB] border border-[#8EC3B0]/40 p-4 rounded-2xl text-xs text-gray-700 font-semibold flex items-start space-x-2">
          <Leaf className="w-4 h-4 text-[#8EC3B0] flex-shrink-0 mt-0.5" />
          <span>Estimasi CO₂ saved dihitung berdasarkan EcoPoints yang dikumpulkan dari tantangan lingkungan yang diselesaikan.</span>
        </div>
      </main>
    </div>
  );
}
