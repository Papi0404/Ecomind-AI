'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Leaf, 
  TrendingDown, 
  Compass, 
  Sparkles, 
  Calendar, 
  PlusCircle, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [aiTip, setAiTip] = useState('Mengambil rekomendasi AI hijau Anda...');

  // 1. Fetch Challenges data
  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: api.challenges.list,
    enabled: !!user,
  });

  // 2. Log Progress Mutation
  const logProgressMutation = useMutation({
    mutationFn: api.challenges.log,
    onSuccess: (res) => {
      // Invalidate queries to reload updated points/XP/streaks/notifications
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Redirect if guest
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // AI recommendations heuristic based on user level/category preferences
  useEffect(() => {
    if (user) {
      const tips = [
        '🌿 Memilih makan siang nabati hari ini dapat mengurangi emisi gas rumah kaca Anda hingga 0.5 kg CO₂!',
        '🚿 Mempercepat waktu mandi Anda sebanyak 2 menit menghemat hingga 15 Liter air bersih.',
        '🚴 Menggunakan sepeda alih-alih berkendara sejauh 5 km menyerap emisi karbon seharga 1.2 kg CO₂.',
        '💡 Mematikan lampu yang tidak terpakai saat siang hari memangkas tagihan listrik & mengurangi emisi karbon.',
        '🛍️ Selalu bawa tas belanja sendiri saat belanja mingguan untuk menekan tumpukan mikroplastik.'
      ];
      const randomIndex = Math.floor(Math.random() * tips.length);
      setAiTip(tips[randomIndex]);
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-grid-pattern flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2D5A27] animate-spin" />
      </div>
    );
  }

  const userChallenges = challengesData?.userChallenges || [];
  const activeChallenges = userChallenges.filter((uc: any) => uc.status === 'ACTIVE');
  const completedChallenges = userChallenges.filter((uc: any) => uc.status === 'COMPLETED');

  // Calculate stats
  const totalCo2Saved = completedChallenges.reduce((sum: number, uc: any) => sum + uc.challenge.co2Reduction, 0);

  // Level XP Progress
  const xpNeeded = user.level * 500;
  const xpPercentage = Math.min(100, Math.floor((user.xp / xpNeeded) * 100));

  const handleLogProgress = async (ucId: string) => {
    try {
      await logProgressMutation.mutateAsync(ucId);
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat progres.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10">
        
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-[#1F3B1A] dark:text-white font-poppins">
              Halo, {user.name}! 🌿
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Selamat datang kembali. Mari catat kemajuan hijau Anda hari ini.
            </p>
          </div>

          {/* Quick Streak Card */}
          <div className="flex items-center space-x-6 bg-white dark:bg-[#122210] border border-[#A8E6A3] px-6 py-3 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2">
              <Flame className="w-6 h-6 text-orange-500 animate-bounce" />
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase">Streak</span>
                <span className="font-extrabold text-sm text-[#2D5A27] dark:text-[#A8E6A3]">{user.streakCount} Hari</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase">EcoPoints</span>
                <span className="font-extrabold text-sm text-[#2D5A27] dark:text-[#A8E6A3]">{user.ecoPoints} EP</span>
              </div>
            </div>
          </div>
        </section>

        {/* Level XP Progress Bar */}
        <section className="glass-panel p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
            <span>Level {user.level}</span>
            <span>Level {user.level + 1}</span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-[#1f301a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#7ED957] to-[#2D5A27] transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <p className="text-right text-xs text-gray-500 font-semibold">
            {user.xp} / {xpNeeded} XP untuk Naik Level ({xpPercentage}%)
          </p>
        </section>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Carbon Footprint & Stats (Grid-8) */}
          <div className="md:col-span-8 space-y-8">
            
            {/* Emissions Savings Card */}
            <div className="glass-panel p-6 rounded-3xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#7ED957]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[#2D5A27] dark:text-[#7ED957] text-xs font-extrabold uppercase font-poppins flex items-center space-x-1">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span>Reduksi Emisi</span>
                  </span>
                  <h3 className="font-bold text-lg">Total CO₂ Yang Anda Selamatkan</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-green-500">
                    {totalCo2Saved.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400 font-bold ml-1">kg CO₂</span>
                </div>
              </div>

              {/* Weekly Carbon Chart (Simulated Premium SVG Chart) */}
              <div className="pt-4 h-48 flex items-end justify-between relative">
                {/* Horizontal gridlines */}
                <div className="absolute inset-x-0 bottom-0 border-b border-gray-100 dark:border-gray-800 w-full" />
                <div className="absolute inset-x-0 bottom-16 border-b border-gray-100 dark:border-gray-800 w-full" />
                <div className="absolute inset-x-0 bottom-32 border-b border-gray-100 dark:border-gray-800 w-full" />

                {/* Bars */}
                {[
                  { day: 'Sen', amount: 0.3, active: false },
                  { day: 'Sel', amount: 0.8, active: false },
                  { day: 'Rab', amount: 0.5, active: false },
                  { day: 'Kam', amount: 1.2, active: false },
                  { day: 'Jum', amount: 1.5, active: true },
                  { day: 'Sab', amount: 0.2, active: false },
                  { day: 'Min', amount: 0.9, active: false },
                ].map((item, index) => {
                  const maxAmount = 2.0;
                  const heightPercent = Math.min(100, Math.floor((item.amount / maxAmount) * 100));
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2 z-10 flex-1">
                      <div className="group relative w-8 sm:w-12 bg-gray-100 dark:bg-gray-800 rounded-lg h-36 flex items-end">
                        <div 
                          className={`
                            w-full rounded-lg transition-all duration-500 cursor-pointer
                            ${item.active ? 'bg-gradient-to-t from-[#2D5A27] to-[#7ED957]' : 'bg-[#A8E6A3] hover:bg-[#7ED957]'}
                          `}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#2D5A27] text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.amount}kg
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Challenges list */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-[#2D5A27] dark:text-[#7ED957]" />
                  <span>Tantangan Aktif Anda</span>
                </h3>
                <Link href="/challenges" className="text-xs font-bold text-[#2D5A27] dark:text-[#A8E6A3] hover:underline">
                  Lihat Semua
                </Link>
              </div>

              {challengesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2D5A27]" />
                </div>
              ) : activeChallenges.length === 0 ? (
                <div className="text-center py-8 bg-[#2D5A27]/5 rounded-2xl space-y-3">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-500 font-medium">Anda belum mengaktifkan tantangan apapun.</p>
                  <Link href="/challenges" className="inline-block bg-[#2D5A27] text-white text-xs font-bold px-4 py-2 rounded-xl">
                    Mulai Jelajah
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeChallenges.map((uc: any) => {
                    const daysLeft = uc.challenge.durationDays - uc.progressDays;
                    const progressPercent = Math.min(100, Math.floor((uc.progressDays / uc.challenge.durationDays) * 100));
                    
                    return (
                      <div 
                        key={uc.id} 
                        className="bg-white dark:bg-[#122210] border border-[#A8E6A3]/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="bg-[#7ED957]/20 text-[#2D5A27] dark:text-[#A8E6A3] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                              {uc.challenge.category}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1" />
                              {uc.challenge.durationDays} hari
                            </span>
                          </div>
                          <h4 className="font-bold text-sm">{uc.challenge.title}</h4>
                          
                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400">
                              Progres: {uc.progressDays} / {uc.challenge.durationDays} hari ({progressPercent}%)
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <button
                          onClick={() => handleLogProgress(uc.id)}
                          disabled={logProgressMutation.isPending}
                          className="bg-[#2D5A27] hover:bg-[#1f3b1a] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-2"
                        >
                          {logProgressMutation.isPending && logProgressMutation.variables === uc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Catat Hari Ini</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* AI Advisor & Gamification Status (Grid-4) */}
          <div className="md:col-span-4 space-y-8">
            
            {/* AI Recommendation Card */}
            <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-[#2D5A27] to-[#1F3B1A] text-white space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7ED957]/15 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#7ED957]" />
                <h3 className="font-bold text-sm tracking-wide font-poppins text-[#7ED957] uppercase">Eco AI Advisor</h3>
              </div>
              <p className="text-xs leading-relaxed font-semibold text-[#FFF8E7]/90">
                {aiTip}
              </p>
              <Link 
                href="/chat" 
                className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-[#7ED957] hover:underline"
              >
                <span>Tanya AI Chatbot</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Achievements Collection Card */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Lencana Baru</span>
                </h3>
              </div>

              {/* Show default seed badges if empty, or just list user badges */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {['🌱', '⚡', '🏆', '♻️', '🌊', '🌿', '🌍', '🔥'].map((emoji, i) => (
                  <div 
                    key={i} 
                    className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-xl cursor-help relative group"
                    title={`Achievement Badge ${i+1}`}
                  >
                    <span>{emoji}</span>
                    {/* Badge details tooltip on hover */}
                    <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-[#2D5A27] text-white text-[9px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity w-24 text-center font-bold">
                      Badge Unlocked
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
