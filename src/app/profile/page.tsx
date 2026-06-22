'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Loader2, 
  Camera, 
  Award, 
  Calendar, 
  Flame, 
  Trophy, 
  Save, 
  CheckCircle,
  AlertTriangle,
  Upload
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Upload States
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Fetch Challenges & Badges progress
  const { data: challengesData } = useQuery({
    queryKey: ['challenges'],
    queryFn: api.challenges.list,
    enabled: !!user,
  });

  // Query User's Badges list
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.list,
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setEmail(user.email);
    }
  }, [user]);

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

  const userChallenges = challengesData?.userChallenges || [];
  const completedCount = userChallenges.filter((uc: any) => uc.status === 'COMPLETED').length;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setUpdating(true);

    try {
      await api.profile.update({ name, bio, email });
      setMessage('Profil Anda berhasil diperbarui.');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil.');
    } finally {
      setUpdating(false);
    }
  };

  // Upload Photo handler (Avatar or Banner)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'avatar') setAvatarPreview(reader.result as string);
      if (type === 'banner') setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (type === 'avatar') setAvatarLoading(true);
    if (type === 'banner') setBannerLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      await api.profile.upload(formData);
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto.');
      // Revert preview on failure
      if (type === 'avatar') setAvatarPreview(null);
      if (type === 'banner') setBannerPreview(null);
    } finally {
      if (type === 'avatar') setAvatarLoading(false);
      if (type === 'banner') setBannerLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Content scrollable container */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10">
        
        {/* Banner and Avatar Wrapper (Discord style) */}
        <section className="relative rounded-[24px] overflow-hidden bg-white dark:bg-[#122210] border border-[#A8E6A3]/30 shadow-md">
          {/* Banner Container */}
          <div className="h-44 relative bg-gradient-to-r from-[#2D5A27] to-[#7ED957]">
            {(bannerPreview || user.bannerUrl) && (
              <img
                src={bannerPreview || user.bannerUrl}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Upload Banner Camera Icon overlay */}
            <label className="absolute right-4 bottom-4 p-2 bg-black/40 hover:bg-black/60 cursor-pointer rounded-xl text-white transition-all">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, 'banner')}
                className="hidden"
              />
            </label>
            {bannerLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Mengunggah...
              </div>
            )}
          </div>

          {/* Profile Details Overlay and Avatar */}
          <div className="px-6 pb-6 pt-16 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            
            {/* Avatar Absolute Pos */}
            <div className="absolute -top-12 left-6 w-24 h-24 rounded-3xl overflow-hidden border-4 border-white dark:border-[#122210] shadow-md bg-white relative">
              <img
                src={avatarPreview || user.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
                alt={user.name}
                className="w-full h-full object-cover"
              />
              
              {/* Change Avatar Camera Button */}
              <label className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center cursor-pointer text-white opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'avatar')}
                  className="hidden"
                />
              </label>

              {avatarLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>

            {/* User credentials */}
            <div className="space-y-1.5 flex-1">
              <h2 className="text-2xl font-extrabold font-poppins">{user.name}</h2>
              <p className="text-xs text-gray-500 font-semibold max-w-lg">
                {user.bio || 'Belum menulis bio. Tulis bio Anda untuk membagikan impian pelestarian bumi.'}
              </p>
              <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Terdaftar sejak {new Date(user.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            {/* Quick editing button toggles */}
            <button
              onClick={() => setEditing(!editing)}
              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-200"
            >
              {editing ? 'Batal Edit' : 'Edit Profil'}
            </button>
          </div>
        </section>

        {/* Edit Form / Stats Display */}
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Main info panel (Grid-8) */}
          <div className="md:col-span-8 space-y-6">
            
            {editing ? (
              <form onSubmit={handleUpdateProfile} className="glass-panel p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-base border-b pb-2">Informasi Profil</h3>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-xl flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Pengguna</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-4 text-xs font-semibold outline-none focus:border-[#7ED957]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={160}
                    className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-4 text-xs font-semibold outline-none focus:border-[#7ED957]"
                    placeholder="Tulis sedikit tentang Anda..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-4 text-xs font-semibold outline-none focus:border-[#7ED957]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="bg-[#2D5A27] hover:bg-[#1f3b1a] disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Perubahan</span>
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Stat 1 */}
                <div className="glass-panel p-4 rounded-2xl text-center space-y-1">
                  <Flame className="w-6 h-6 text-orange-500 mx-auto animate-pulse" />
                  <h4 className="text-xl font-extrabold">{user.streakCount} Hari</h4>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Daily Streak</span>
                </div>

                {/* Stat 2 */}
                <div className="glass-panel p-4 rounded-2xl text-center space-y-1">
                  <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
                  <h4 className="text-xl font-extrabold">{user.ecoPoints} EP</h4>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">EcoPoints</span>
                </div>

                {/* Stat 3 */}
                <div className="glass-panel p-4 rounded-2xl text-center space-y-1">
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                  <h4 className="text-xl font-extrabold">{completedCount} Misi</h4>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Selesai</span>
                </div>

                {/* Stat 4 */}
                <div className="glass-panel p-4 rounded-2xl text-center space-y-1">
                  <Award className="w-6 h-6 text-blue-500 mx-auto" />
                  <h4 className="text-xl font-extrabold">LVL {user.level}</h4>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Level XP</span>
                </div>
              </div>
            )}

            {/* Badges Earned Showcase */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Award className="w-5 h-5 text-[#2D5A27] dark:text-[#7ED957]" />
                <span>Koleksi Lencana Penghargaan</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {[
                  { name: 'Pioneer Hijau', icon: '🌱', desc: 'Diberikan untuk pendaftaran akun EcoMind.' },
                  { name: 'Penanya Pintar', icon: '⚡', desc: 'Melakukan diskusi lingkungan dengan AI.' },
                  { name: 'Disiplin Bumi', icon: '🔥', desc: 'Mempertahankan streak 3 hari berturut-turut.' },
                  { name: 'Aktivis Pemula', icon: '🏆', desc: 'Menyelesaikan tantangan pertama Anda.' },
                  { name: 'Bebas Plastik', icon: '♻️', desc: 'Menolak kantong plastik belanja seminggu.' },
                  { name: 'Juara Lokal', icon: '🌍', desc: 'Mencapai peringkat top 10 leaderboard.' }
                ].map((badge, idx) => {
                  // Simulate unlocking 4 badges for visual aesthetics
                  const isUnlocked = idx < 4;
                  return (
                    <div 
                      key={idx} 
                      className={`
                        p-4 rounded-2xl border transition-all text-center space-y-2
                        ${isUnlocked 
                          ? 'bg-[#7ED957]/5 border-[#A8E6A3] text-gray-800 dark:text-[#E8F5E9]' 
                          : 'bg-gray-100/50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800 opacity-50'
                        }
                      `}
                    >
                      <span className="text-3xl block">{badge.icon}</span>
                      <h4 className="font-bold text-xs">{badge.name}</h4>
                      <p className="text-[9px] text-gray-400 font-semibold">{badge.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right settings/tips panel (Grid-4) */}
          <div className="md:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm font-poppins text-[#2D5A27] dark:text-[#7ED957]">Tips Daur Ulang</h3>
              <ul className="text-xs text-gray-500 font-semibold space-y-3 leading-relaxed">
                <li>🔋 Jangan campur baterai bekas dengan sampah rumah tangga umum.</li>
                <li>📦 Lipat kardus belanja untuk mengurangi tumpukan volume sampah Anda.</li>
                <li>🍼 Cuci botol kosmetik atau botol susu bekas sebelum diserahkan ke bank daur ulang.</li>
              </ul>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
