'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Calendar, 
  TrendingDown, 
  CheckCircle2, 
  Loader2, 
  Play,
  Award,
  Sparkles
} from 'lucide-react';

export default function ChallengesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // 1. Fetch Challenges
  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: api.challenges.list,
    enabled: !!user,
  });

  // 2. Start Challenge Mutation
  const startChallengeMutation = useMutation({
    mutationFn: api.challenges.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });

  // 3. Log Progress Mutation
  const logProgressMutation = useMutation({
    mutationFn: api.challenges.log,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
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
        <Loader2 className="w-10 h-10 text-[#2D5A27] animate-spin" />
      </div>
    );
  }

  const challenges = challengesData?.challenges || [];
  const userChallenges = challengesData?.userChallenges || [];

  // Filter daily vs weekly based on seed records
  const dailyChallenges = challenges.filter((c: any) => !c.isWeekly);
  const weeklyChallenges = challenges.filter((c: any) => c.isWeekly);
  
  const currentChallenges = activeTab === 'daily' ? dailyChallenges : weeklyChallenges;

  const handleStartChallenge = async (challengeId: string) => {
    try {
      await startChallengeMutation.mutateAsync(challengeId);
    } catch (err: any) {
      alert(err.message || 'Gagal memulai tantangan.');
    }
  };

  const handleLogProgress = async (userChallengeId: string) => {
    try {
      await logProgressMutation.mutateAsync(userChallengeId);
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
        
        {/* Page Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-[#1F3B1A] dark:text-white font-poppins flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span>Tantangan Aksi Hijau</span>
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Ikuti misi harian atau mingguan, kumpulkan EcoPoints, dan kurangi emisi CO₂ bumi.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white dark:bg-[#122210] border border-[#A8E6A3] px-4 py-2 rounded-xl text-xs font-bold text-[#2D5A27] dark:text-[#A8E6A3]">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>Misi Selesai: {userChallenges.filter((uc: any) => uc.status === 'COMPLETED').length} Misi</span>
          </div>
        </section>

        {/* Tab Buttons */}
        <section className="flex space-x-2 border-b border-[#A8E6A3]/30 pb-px">
          <button
            onClick={() => setActiveTab('daily')}
            className={`
              px-6 py-3 text-xs font-bold transition-all border-b-2
              ${activeTab === 'daily'
                ? 'border-[#2D5A27] text-[#2D5A27] dark:border-[#7ED957] dark:text-[#7ED957]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
              }
            `}
          >
            Tantangan Harian
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`
              px-6 py-3 text-xs font-bold transition-all border-b-2
              ${activeTab === 'weekly'
                ? 'border-[#2D5A27] text-[#2D5A27] dark:border-[#7ED957] dark:text-[#7ED957]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
              }
            `}
          >
            Tantangan Mingguan
          </button>
        </section>

        {/* Challenges List Grid */}
        <section className="grid md:grid-cols-2 gap-6">
          {challengesLoading ? (
            <div className="col-span-2 flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
            </div>
          ) : currentChallenges.length === 0 ? (
            <p className="col-span-2 text-center text-xs text-gray-400 font-semibold py-12">Tidak ada tantangan dalam kategori ini.</p>
          ) : (
            currentChallenges.map((challenge: any) => {
              // Find if user has a tracker for this challenge
              const userTracker = userChallenges.find((uc: any) => uc.challengeId === challenge.id);
              const isStarted = !!userTracker;
              const isActive = userTracker?.status === 'ACTIVE';
              const isCompleted = userTracker?.status === 'COMPLETED';
              
              const progressPercent = userTracker 
                ? Math.min(100, Math.floor((userTracker.progressDays / challenge.durationDays) * 100))
                : 0;

              return (
                <div 
                  key={challenge.id} 
                  className="glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-6 hover:border-[#7ED957] transition-all"
                >
                  <div className="space-y-4">
                    {/* Header Tags */}
                    <div className="flex items-center justify-between">
                      <span className="bg-[#7ED957]/20 text-[#2D5A27] dark:text-[#A8E6A3] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                        {challenge.category}
                      </span>
                      <div className="flex items-center space-x-3 text-[10px] text-gray-400 font-semibold">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          {challenge.durationDays} Hari
                        </span>
                        <span className="flex items-center text-green-500">
                          <TrendingDown className="w-3.5 h-3.5 mr-1" />
                          -{challenge.co2Reduction}kg CO₂
                        </span>
                      </div>
                    </div>

                    {/* Copy details */}
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm">{challenge.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                        {challenge.description}
                      </p>
                    </div>

                    {/* Progress details if started */}
                    {isStarted && (
                      <div className="space-y-1.5 pt-2">
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                          <span>Progress: {userTracker.progressDays} / {challenge.durationDays} Hari</span>
                          <span>{progressPercent}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/80 pt-4">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-yellow-600 dark:text-yellow-400">
                      <Award className="w-4 h-4" />
                      <span>+{challenge.pointsReward} EP</span>
                    </div>

                    {/* Action Button */}
                    {!isStarted ? (
                      <button
                        onClick={() => handleStartChallenge(challenge.id)}
                        disabled={startChallengeMutation.isPending}
                        className="bg-[#2D5A27] hover:bg-[#1f3b1a] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md shadow-[#2D5A27]/10"
                      >
                        {startChallengeMutation.isPending && startChallengeMutation.variables === challenge.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-white" />
                        )}
                        <span>Ikuti Misi</span>
                      </button>
                    ) : isActive ? (
                      <button
                        onClick={() => handleLogProgress(userTracker.id)}
                        disabled={logProgressMutation.isPending}
                        className="bg-[#7ED957] hover:bg-[#8ee867] text-[#2D5A27] text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md shadow-[#7ED957]/15"
                      >
                        {logProgressMutation.isPending && logProgressMutation.variables === userTracker.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Catat Hari Ini</span>
                      </button>
                    ) : isCompleted ? (
                      <div className="text-green-500 text-xs font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tantangan Selesai</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </section>

      </main>
    </div>
  );
}
