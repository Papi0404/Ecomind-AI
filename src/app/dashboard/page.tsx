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
  CheckCircle2, 
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  Droplet,
  Trash2,
  Phone,
  Share2,
  MessageSquare,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [aiTip, setAiTip] = useState('Mengambil rekomendasi AI hijau Anda...');

  // Resource Tracking client states (Studi Kasus 2)
  const [waterSaved, setWaterSaved] = useState(15); // in Liters
  const [plasticAvoided, setPlasticAvoided] = useState(6); // items
  const [energySaved, setEnergySaved] = useState(2.5); // kWh

  // Waste Classifier Simulator (Studi Kasus 2)
  const [wasteInput, setWasteInput] = useState('');
  const [wasteResult, setWasteResult] = useState<any>(null);

  // Quick Claim Verifier (Studi Kasus 1)
  const [quickClaim, setQuickClaim] = useState('');
  const [quickVerifyResult, setQuickVerifyResult] = useState<any>(null);

  // 1. Fetch Challenges data
  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: api.challenges.list,
    enabled: !!user,
  });

  // 2. Fetch friends list for Social feed
  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.friends.list(),
    enabled: !!user,
  });

  // 3. Log Progress Mutation
  const logProgressMutation = useMutation({
    mutationFn: api.challenges.log,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  // 4. Waste Classification Mutation
  const classifyMutation = useMutation({
    mutationFn: api.community.classifyWaste,
    onSuccess: (data) => {
      setWasteResult(data);
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal mengklasifikasikan sampah.');
    }
  });

  // 5. Quick Claim Verification Mutation
  const quickVerifyMutation = useMutation({
    mutationFn: api.community.verify,
    onSuccess: (data) => {
      setQuickVerifyResult(data);
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal memverifikasi klaim.');
    }
  });

  // Redirect if guest
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // AI recommendations heuristic
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
        <Loader2 className="w-10 h-10 text-[#1A403E] animate-spin" />
      </div>
    );
  }

  const userChallenges = challengesData?.userChallenges || [];
  const activeChallenges = userChallenges.filter((uc: any) => uc.status === 'ACTIVE');
  const completedChallenges = userChallenges.filter((uc: any) => uc.status === 'COMPLETED');

  // Calculate base CO2 saved from challenges
  const challengeCo2Saved = completedChallenges.reduce((sum: number, uc: any) => sum + uc.challenge.co2Reduction, 0);

  // Dynamic tracker CO2 saving computation
  // Water: 0.05kg CO2 per liter, Plastic: 0.15kg CO2 per item, Energy: 0.85kg CO2 per kWh
  const trackerCo2Saved = (waterSaved * 0.05) + (plasticAvoided * 0.15) + (energySaved * 0.85);
  const totalCo2Saved = challengeCo2Saved + trackerCo2Saved;

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

  const handleClassify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteInput.trim()) return;
    classifyMutation.mutate(wasteInput);
  };

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClaim.trim()) return;
    quickVerifyMutation.mutate(quickClaim);
  };

  const friends = friendsData?.friends || [];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10">
        
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-gray-900 font-poppins">
              Halo, {user.name}! 🌿
            </h2>
            <p className="text-sm text-gray-700 font-medium">
              Selamat datang di EcoMind AI. Mari bersama mengawal informasi publik dan menjaga kelestarian bumi.
            </p>
          </div>

          {/* Quick Streak Card */}
          <div className="flex items-center space-x-6 bg-white border border-[#8EC3B0] px-6 py-3 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2">
              <Flame className="w-6 h-6 text-orange-500 animate-bounce" />
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">Streak Saya</span>
                <span className="font-extrabold text-sm text-[#1A403E]">{user.streakCount} Hari</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase">EcoPoints</span>
                <span className="font-extrabold text-sm text-[#1A403E]">{user.ecoPoints} EP</span>
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
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#8EC3B0] to-[#1A403E] transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <p className="text-right text-xs text-gray-900 font-bold">
            {user.xp} / {xpNeeded} XP untuk Naik Level ({xpPercentage}%)
          </p>
        </section>

        {/* DOUBLE CASE STUDIES HUB */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* COLUMN 1: Studi Kasus 1 (Pusat Komunitas & Verifikasi) */}
          <div className="md:col-span-6 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-[#8EC3B0]/30">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#8EC3B0]" />
                <span>Pusat Layanan & Verifikasi (Studi Kasus 1)</span>
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                Bantu warga mengakses informasi publik tervalid. Gunakan verifikator hoaks atau ringkas pengumuman di bawah ini.
              </p>

              {/* Quick Claim Verifier Form */}
              <form onSubmit={handleQuickVerify} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Verifikator Hoaks Cepat</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Masukkan klaim bantuan atau berita..."
                    value={quickClaim}
                    onChange={(e) => setQuickClaim(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl py-2 pl-3 pr-10 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0]"
                  />
                  <button
                    type="submit"
                    disabled={quickVerifyMutation.isPending || !quickClaim.trim()}
                    className="absolute right-1.5 top-1.5 p-1 bg-[#1A403E] text-white rounded-lg hover:bg-[#122c2b] disabled:opacity-50"
                  >
                    {quickVerifyMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {quickVerifyResult && (
                  <div className="pt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-gray-700">Hasil:</span>
                      <span className={`
                        px-2 py-0.5 rounded text-[10px] uppercase
                        ${quickVerifyResult.category === 'VALID' ? 'bg-green-100 text-green-700' : ''}
                        ${quickVerifyResult.category === 'HOAX' ? 'bg-red-100 text-red-700' : ''}
                        ${quickVerifyResult.category === 'TIDAK_PASTI' ? 'bg-amber-100 text-amber-700' : ''}
                      `}>
                        {quickVerifyResult.category}
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold leading-relaxed">
                      {quickVerifyResult.analysis.slice(0, 100)}...
                    </p>
                    <Link href="/community" className="text-[10px] text-[#1A403E] font-bold hover:underline block pt-1">
                      Lihat detail analisis & rekomendasi &rarr;
                    </Link>
                  </div>
                )}
              </form>

              {/* Public Services Hotline Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Kontak Bantuan Darurat Resmi</span>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="tel:0217992325"
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-center flex flex-col items-center space-y-1"
                  >
                    <Phone className="w-4 h-4 text-red-500" />
                    <span className="text-[10px] font-extrabold text-gray-900">PMI</span>
                  </a>
                  <a
                    href="tel:0213925230"
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-center flex flex-col items-center space-y-1"
                  >
                    <Phone className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-extrabold text-gray-900">Komnas HAM</span>
                  </a>
                  <a
                    href="tel:02131901556"
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-center flex flex-col items-center space-y-1"
                  >
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-extrabold text-gray-900">KPAI</span>
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/community"
                  className="w-full bg-[#1A403E] text-white hover:bg-[#122c2b] text-xs font-bold py-2.5 rounded-xl shadow flex items-center justify-center space-x-1.5"
                >
                  <span>Buka Pusat Komunitas</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Studi Kasus 2 (Konsumsi & Daur Ulang Mandiri) */}
          <div className="md:col-span-6 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-6 border border-[#8EC3B0]/30">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-[#8EC3B0]" />
                <span>Konsumsi Mandiri & Sampah (Studi Kasus 2)</span>
              </h3>

              {/* Resource consumption tracker inputs */}
              <div className="grid grid-cols-3 gap-3">
                
                {/* Water Saving */}
                <div className="bg-white border border-gray-200 p-3 rounded-2xl text-center space-y-1">
                  <Droplet className="w-5 h-5 text-blue-500 mx-auto" />
                  <span className="text-[9px] text-gray-400 font-bold block">Air Hemat</span>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="font-extrabold text-xs text-gray-900">{waterSaved}L</span>
                    <button
                      onClick={() => setWaterSaved(prev => prev + 5)}
                      className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded font-extrabold"
                    >
                      +5L
                    </button>
                  </div>
                </div>

                {/* Plastic Avoided */}
                <div className="bg-white border border-gray-200 p-3 rounded-2xl text-center space-y-1">
                  <Trash2 className="w-5 h-5 text-green-500 mx-auto" />
                  <span className="text-[9px] text-gray-400 font-bold block">Plastik Kurang</span>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="font-extrabold text-xs text-gray-900">{plasticAvoided}x</span>
                    <button
                      onClick={() => setPlasticAvoided(prev => prev + 1)}
                      className="text-[10px] bg-green-50 text-green-600 px-1 rounded font-extrabold"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Energy Saved */}
                <div className="bg-white border border-gray-200 p-3 rounded-2xl text-center space-y-1">
                  <Zap className="w-5 h-5 text-yellow-500 mx-auto" />
                  <span className="text-[9px] text-gray-400 font-bold block">Listrik Hemat</span>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="font-extrabold text-xs text-gray-900">{energySaved}kWh</span>
                    <button
                      onClick={() => setEnergySaved(prev => prev + 0.5)}
                      className="text-[9px] bg-yellow-50 text-yellow-600 px-1 rounded font-extrabold"
                    >
                      +0.5
                    </button>
                  </div>
                </div>

              </div>

              {/* Dynamic Emission Reductions result */}
              <div className="bg-[#FAF6EB] p-4 rounded-2xl flex items-center justify-between border border-[#8EC3B0]/30">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Emisi Karbon Tereduksi</span>
                  <span className="text-xs text-gray-900 font-bold">Simulasi Penghematan Anda</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-[#1A403E]">{trackerCo2Saved.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400 font-bold ml-1">kg CO₂</span>
                </div>
              </div>

              {/* Simulated Waste Classifier Widget */}
              <form onSubmit={handleClassify} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Kalkulator Jenis & Cara Olah Sampah</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Masukkan nama sampah (misal: botol kaca)..."
                    value={wasteInput}
                    onChange={(e) => setWasteInput(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl py-2 pl-3 pr-10 text-xs font-semibold text-gray-900 outline-none focus:border-[#8EC3B0]"
                  />
                  <button
                    type="submit"
                    disabled={classifyMutation.isPending || !wasteInput.trim()}
                    className="absolute right-1.5 top-1.5 p-1 bg-[#1A403E] text-white rounded-lg hover:bg-[#122c2b]"
                  >
                    {classifyMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {wasteResult && (
                  <div className="pt-2 text-xs space-y-1 font-semibold text-gray-900">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-gray-500">Kategori:</span>
                      <span className={`
                        px-2 py-0.5 rounded text-[10px] uppercase font-extrabold
                        ${wasteResult.category === 'Organik' ? 'bg-green-100 text-green-700' : ''}
                        ${wasteResult.category === 'Anorganik' ? 'bg-blue-100 text-blue-700' : ''}
                        ${wasteResult.category === 'B3' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {wasteResult.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                      {wasteResult.instructions}
                    </p>
                    <div className="text-[9px] text-green-600 font-extrabold flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 mr-1" />
                      <span>Mengurangi sekitar {wasteResult.co2Saved} kg CO₂</span>
                    </div>
                  </div>
                )}
              </form>

            </div>
          </div>

        </div>

        {/* ROW 2: ACTIVE CHALLENGES & SOCIAL STREAK FEED */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Carbon Footprint & Challenges (Grid-8) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Total Carbon Savings Card */}
            <div className="glass-panel p-6 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#8EC3B0]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[#1A403E] text-xs font-extrabold uppercase font-poppins flex items-center space-x-1">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span>Reduksi Emisi Gabungan</span>
                  </span>
                  <h3 className="font-bold text-lg">Total CO₂ Yang Anda Selamatkan</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-green-600">
                    {totalCo2Saved.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 font-bold ml-1">kg CO₂</span>
                </div>
              </div>

              {/* Weekly Carbon Chart (Simulated Premium SVG Chart) */}
              <div className="pt-4 h-36 flex items-end justify-between relative">
                <div className="absolute inset-x-0 bottom-0 border-b border-gray-200 w-full" />
                <div className="absolute inset-x-0 bottom-12 border-b border-gray-200 w-full" />
                <div className="absolute inset-x-0 bottom-24 border-b border-gray-200 w-full" />

                {[
                  { day: 'Sen', amount: 0.3, active: false },
                  { day: 'Sel', amount: 0.8, active: false },
                  { day: 'Rab', amount: 0.5, active: false },
                  { day: 'Kam', amount: 1.2, active: false },
                  { day: 'Jum', amount: 1.5, active: true },
                  { day: 'Sab', amount: 0.2, active: false },
                  { day: 'Min', amount: totalCo2Saved, active: true },
                ].map((item, index) => {
                  const maxAmount = Math.max(5.0, totalCo2Saved);
                  const heightPercent = Math.min(100, Math.floor((item.amount / maxAmount) * 100));
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2 z-10 flex-1">
                      <div className="group relative w-8 sm:w-10 bg-gray-100 rounded-lg h-28 flex items-end">
                        <div 
                          className={`
                            w-full rounded-lg transition-all duration-500 cursor-pointer
                            ${item.active ? 'bg-gradient-to-t from-[#1A403E] to-[#8EC3B0]' : 'bg-[#C4E4D9] hover:bg-[#8EC3B0]'}
                          `}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#1A403E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity w-14 text-center">
                          {item.amount.toFixed(1)}kg
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
                  <Compass className="w-5 h-5 text-[#1A403E]" />
                  <span>Tantangan Aktif Anda</span>
                </h3>
                <Link href="/challenges" className="text-xs font-bold text-[#1A403E] hover:underline">
                  Lihat Semua
                </Link>
              </div>

              {challengesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1A403E]" />
                </div>
              ) : activeChallenges.length === 0 ? (
                <div className="text-center py-8 bg-[#8EC3B0]/5 rounded-2xl space-y-3">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-500 font-medium">Anda belum mengaktifkan tantangan apapun.</p>
                  <Link href="/challenges" className="inline-block bg-[#1A403E] text-white text-xs font-bold px-4 py-2 rounded-xl">
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
                        className="bg-white border border-[#8EC3B0]/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="bg-[#8EC3B0]/20 text-[#1A403E] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                              {uc.challenge.category}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1" />
                              {uc.challenge.durationDays} hari
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-900">{uc.challenge.title}</h4>
                          
                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400">
                              Progres: {uc.progressDays} / {uc.challenge.durationDays} hari ({progressPercent}%)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLogProgress(uc.id)}
                          disabled={logProgressMutation.isPending}
                          className="bg-[#1A403E] hover:bg-[#122c2b] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-2"
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

          {/* Social Update Feed & AI Advisor (Grid-4) */}
          <div className="md:col-span-4 space-y-6">
            
            {/* AI Advisor Panel */}
            <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-[#1A403E] to-[#122c2b] text-white space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8EC3B0]/15 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#8EC3B0]" />
                <h3 className="font-bold text-sm tracking-wide font-poppins text-[#8EC3B0] uppercase">Eco AI Advisor</h3>
              </div>
              <p className="text-xs leading-relaxed font-semibold text-[#FAF6EB]/90">
                {aiTip}
              </p>
              <Link 
                href="/chat" 
                className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-[#8EC3B0] hover:underline"
              >
                <span>Tanya AI Chatbot</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Social Friends Streaks Updates */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm flex items-center space-x-2 text-gray-900">
                <Share2 className="w-4 h-4 text-[#8EC3B0]" />
                <span>Streak Teman Terkini</span>
              </h3>

              <div className="space-y-3">
                {friends.slice(0, 4).map((friend: any) => (
                  <div key={friend.id} className="flex flex-col space-y-2 border-b border-gray-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={friend.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
                          alt={friend.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{friend.name}</h4>
                          <span className="text-[9px] text-gray-500 font-bold block">Level {friend.level}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-orange-500 font-extrabold text-xs">
                          <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                          <span>{friend.streakCount} Hari</span>
                        </div>
                        <Link
                          href="/friends"
                          className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                          title="Kirim Pesan"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                    {friend.recentActivity && (
                      <div className="bg-[#8EC3B0]/10 border border-[#8EC3B0]/30 px-2 py-1 rounded-lg text-[9px] text-[#1A403E] font-semibold flex items-center justify-between">
                        <span className="truncate">🔥 Menyelesaikan: {friend.recentActivity.title}</span>
                        <span className="text-[8px] text-gray-400 font-bold flex-shrink-0 ml-1">
                          {new Date(friend.recentActivity.loggedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {friends.length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-400 font-semibold">
                    Belum ada teman terhubung. Cari teman di portal Teman untuk membandingkan streak!
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
