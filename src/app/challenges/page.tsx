'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Trophy, Flame, Calendar, TrendingDown, CheckCircle2,
  Loader2, Play, Award, Sparkles, Leaf, Droplet, Zap, Trash2, Car, Utensils, Filter
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  Water: Droplet,
  Energy: Zap,
  Waste: Trash2,
  Transport: Car,
  Food: Utensils,
  default: Leaf,
};

const CATEGORY_COLORS: Record<string, string> = {
  Water: 'bg-blue-100 text-blue-700',
  Energy: 'bg-yellow-100 text-yellow-700',
  Waste: 'bg-green-100 text-green-700',
  Transport: 'bg-purple-100 text-purple-700',
  Food: 'bg-orange-100 text-orange-700',
};

function co2Equivalency(kg: number): string {
  if (kg < 0.5) return `Setara menghemat ${Math.round(kg * 20)} menit lampu 100W`;
  if (kg < 2) return `Setara menanam ${(kg * 1.2).toFixed(1)} pohon muda`;
  return `Setara tidak berkendara sejauh ${(kg * 5).toFixed(0)} km`;
}

export default function ChallengesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: api.challenges.list,
    enabled: !!user,
  });

  const startChallengeMutation = useMutation({
    mutationFn: api.challenges.start,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges'] }); },
  });

  const logProgressMutation = useMutation({
    mutationFn: api.challenges.log,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      setCelebrateId(vars as string);
      setTimeout(() => setCelebrateId(null), 3000);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#1A403E] animate-spin" /></div>;
  }

  const challenges = challengesData?.challenges || [];
  const userChallenges = challengesData?.userChallenges || [];
  const completedCount = userChallenges.filter((uc: any) => uc.status === 'COMPLETED').length;

  const dailyChallenges = challenges.filter((c: any) => !c.isWeekly);
  const weeklyChallenges = challenges.filter((c: any) => c.isWeekly);
  let currentChallenges = activeTab === 'daily' ? dailyChallenges : weeklyChallenges;
  if (categoryFilter !== 'all') currentChallenges = currentChallenges.filter((c: any) => c.category === categoryFilter);

  const categories: string[] = ['all', ...Array.from(new Set<string>(challenges.map((c: any) => c.category as string)))];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto lg:h-screen pt-20 lg:pt-10">

        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-gray-900 font-poppins flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span>Tantangan Aksi Iklim</span>
            </h2>
            <p className="text-sm text-gray-700 font-medium">
              Studi Kasus 2 — Ikuti misi harian & mingguan untuk mengurangi emisi CO₂ secara nyata dan terukur.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white border border-[#8EC3B0] px-4 py-2 rounded-xl text-xs font-bold text-[#1A403E] flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Streak: {user.streakCount} Hari</span>
            </div>
            <div className="bg-white border border-[#8EC3B0] px-4 py-2 rounded-xl text-xs font-bold text-[#1A403E] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>{completedCount} Misi Selesai</span>
            </div>
          </div>
        </section>

        {/* Tabs + Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex border-b border-[#8EC3B0]/30 pb-px space-x-1">
            {(['daily', 'weekly'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${activeTab === tab ? 'border-[#1A403E] text-[#1A403E]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {tab === 'daily' ? 'Tantangan Harian' : 'Tantangan Mingguan'}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {categories.map((cat: string) => {
              const Icon = cat === 'all' ? Leaf : (CATEGORY_ICONS[cat] || Leaf);
              return (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${categoryFilter === cat ? 'bg-[#1A403E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Icon className="w-3 h-3" />
                  <span>{cat === 'all' ? 'Semua' : cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Challenges Grid */}
        <section className="grid md:grid-cols-2 gap-6">
          {challengesLoading ? (
            <div className="col-span-2 flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1A403E]" /></div>
          ) : currentChallenges.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs text-gray-400 font-semibold">
              Tidak ada tantangan dalam kategori ini.
            </div>
          ) : currentChallenges.map((challenge: any) => {
            const userTracker = userChallenges.find((uc: any) => uc.challengeId === challenge.id);
            const isActive = userTracker?.status === 'ACTIVE';
            const isCompleted = userTracker?.status === 'COMPLETED';
            const progressPercent = userTracker ? Math.min(100, Math.floor((userTracker.progressDays / challenge.durationDays) * 100)) : 0;
            const Icon = CATEGORY_ICONS[challenge.category] || Leaf;
            const catColor = CATEGORY_COLORS[challenge.category] || 'bg-gray-100 text-gray-700';
            const isCelebrating = celebrateId === userTracker?.id;

            return (
              <div key={challenge.id}
                className={`glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-5 transition-all hover:border-[#8EC3B0] ${isCelebrating ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}>
                {isCelebrating && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs font-bold text-green-700 flex items-center space-x-2">
                    <span>🎉</span><span>Progres dicatat! Streak diperbarui. Teman dapat melihat pencapaian Anda.</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${catColor.split(' ')[0]}`}>
                        <Icon className={`w-4 h-4 ${catColor.split(' ')[1]}`} />
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${catColor}`}>
                        {challenge.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-semibold">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{challenge.durationDays}H</span>
                      <span className="flex items-center text-green-600 font-bold"><TrendingDown className="w-3 h-3 mr-1" />-{challenge.co2Reduction}kg CO₂</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">{challenge.title}</h4>
                    <p className="text-[11px] text-gray-600 leading-relaxed mt-1">{challenge.description}</p>
                  </div>

                  {/* CO₂ equivalency */}
                  <div className="bg-[#FAF6EB] border border-[#8EC3B0]/30 px-3 py-2 rounded-xl text-[10px] text-[#1A403E] font-semibold flex items-center space-x-1.5">
                    <Leaf className="w-3 h-3 text-[#8EC3B0] flex-shrink-0" />
                    <span>{co2Equivalency(challenge.co2Reduction)}</span>
                  </div>

                  {userTracker && (
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#8EC3B0] to-[#1A403E] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                        <span>{userTracker.progressDays} / {challenge.durationDays} hari</span>
                        <span>{progressPercent}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center space-x-1 text-xs font-bold text-yellow-600">
                    <Award className="w-4 h-4" />
                    <span>+{challenge.pointsReward} EP</span>
                  </div>

                  {!userTracker ? (
                    <button onClick={() => startChallengeMutation.mutate(challenge.id)}
                      disabled={startChallengeMutation.isPending}
                      className="bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5">
                      {startChallengeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      <span>Ikuti Misi</span>
                    </button>
                  ) : isActive ? (
                    <button onClick={() => logProgressMutation.mutate(userTracker.id)}
                      disabled={logProgressMutation.isPending}
                      className="bg-[#8EC3B0] hover:bg-[#7ab3a0] text-[#1A403E] text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5">
                      {logProgressMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Catat Hari Ini</span>
                    </button>
                  ) : isCompleted ? (
                    <div className="text-green-600 text-xs font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" /><span>Selesai ✓</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>

        {/* Studi Kasus 2 Info Box */}
        <div className="bg-[#1A403E] text-white p-6 rounded-2xl space-y-3">
          <h3 className="font-extrabold text-sm flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-[#8EC3B0]" /><span>Studi Kasus 2 — Mendukung Aksi Iklim Lokal</span>
          </h3>
          <p className="text-xs text-[#C4E4D9] leading-relaxed">
            Setiap tantangan yang diselesaikan dicatat sebagai aksi nyata pengurangan emisi. Streak Anda diperbarui otomatis dan dapat dilihat oleh teman di feed sosial. Gabungkan dengan Tracker Konsumsi di Dashboard untuk melihat total dampak lingkungan Anda.
          </p>
        </div>
      </main>
    </div>
  );
}
