'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Terminal, 
  Activity, 
  Database, 
  AlertOctagon, 
  Loader2, 
  UserX, 
  UserCheck, 
  Trash2,
  FileText,
  Search
} from 'lucide-react';

export default function AdminPortalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  
  const [userSearch, setUserSearch] = useState('');

  // 1. Fetch Admin Dashboard Statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: api.admin.stats,
    enabled: !!user && user.role === 'ADMIN',
  });

  // 2. Fetch Users list
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: api.admin.users,
    enabled: !!user && user.role === 'ADMIN',
  });

  // 3. User Action Mutation (BAN, UNBAN, MAKE_ADMIN, DELETE)
  const userActionMutation = useMutation({
    mutationFn: api.admin.action,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  // Admin Verification Guard (Pretend page doesn't exist for non-admins)
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-grid-pattern flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2D5A27] animate-spin" />
      </div>
    );
  }

  const handleAction = async (userId: string, action: 'BAN' | 'UNBAN' | 'MAKE_ADMIN' | 'MAKE_USER' | 'DELETE') => {
    let confirmMsg = `Apakah Anda yakin ingin melakukan tindakan ${action} pada pengguna ini?`;
    if (action === 'DELETE') confirmMsg = `WARNING: Menghapus pengguna ini akan menghapus semua datanya secara permanen. Lanjutkan?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      await userActionMutation.mutateAsync({ userId, action });
      alert(`Tindakan ${action} berhasil dilakukan.`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengeksekusi tindakan.');
    }
  };

  const stats = statsData?.stats || {};
  const logs = statsData?.recentLogs || [];
  const reports = statsData?.recentReports || [];
  const users = usersData?.users || [];

  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#070d06] text-[#E8F5E9] dark">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10 bg-grid-pattern">
        
        {/* Page Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-red-500 font-poppins flex items-center space-x-2">
              <ShieldAlert className="w-8 h-8 animate-pulse text-red-500" />
              <span>Pusat Kontrol Root</span>
            </h2>
            <p className="text-sm text-gray-400 font-medium">
              Sesi terenkripsi. IP dan riwayat modifikasi tercatat di berkas audit server.
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            <span>ADMIN SECURE NODE</span>
          </div>
        </section>

        {statsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : (
          <>
            {/* Aggregate Stats Row */}
            <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="cyber-panel p-5 rounded-2xl space-y-2 border-red-500/10">
                <Users className="w-5 h-5 text-red-400" />
                <h4 className="text-2xl font-extrabold">{stats.totalUsers}</h4>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Pengguna</span>
              </div>
              <div className="cyber-panel p-5 rounded-2xl space-y-2">
                <Database className="w-5 h-5 text-green-400" />
                <h4 className="text-2xl font-extrabold">{stats.totalPoints} EP</h4>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Total EcoPoints</span>
              </div>
              <div className="cyber-panel p-5 rounded-2xl space-y-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h4 className="text-2xl font-extrabold">{stats.completedChallenges}</h4>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Misi Diselesaikan</span>
              </div>
              <div className="cyber-panel p-5 rounded-2xl space-y-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h4 className="text-2xl font-extrabold">{stats.totalUploads} File</h4>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">File Terunggah</span>
              </div>
              <div className="cyber-panel p-5 rounded-2xl space-y-2">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
                <h4 className="text-2xl font-extrabold text-amber-500">{stats.totalReports} Laporan</h4>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Laporan Masuk</span>
              </div>
            </section>

            {/* Logs & User Moderation Grid */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* User management list (Grid-8) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="cyber-panel p-6 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-base flex items-center space-x-2 text-white">
                      <Users className="w-5 h-5" />
                      <span>Manajemen Pengguna</span>
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari pengguna..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="bg-black/40 border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:border-red-500 w-full sm:w-48 text-white"
                      />
                    </div>
                  </div>

                  {usersLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-xs text-gray-500 py-6">Pengguna tidak ditemukan.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead className="bg-[#121c11] text-gray-400 uppercase tracking-wider text-[9px]">
                          <tr>
                            <th className="p-3 pl-4">Pengguna</th>
                            <th className="p-3">Peran</th>
                            <th className="p-3">Points</th>
                            <th className="p-3 pr-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80">
                          {filteredUsers.map((item: any) => {
                            const isBanned = item.role === 'BANNED';
                            const isAdmin = item.role === 'ADMIN';
                            return (
                              <tr key={item.id} className="hover:bg-gray-900/50">
                                <td className="p-3 pl-4">
                                  <div className="font-bold text-white">{item.name}</div>
                                  <div className="text-[10px] text-gray-500 font-medium">{item.email}</div>
                                </td>
                                <td className="p-3">
                                  <span className={`
                                    text-[9px] font-extrabold px-2 py-0.5 rounded
                                    ${isAdmin ? 'bg-red-500/20 text-red-500' : isBanned ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}
                                  `}>
                                    {item.role}
                                  </span>
                                </td>
                                <td className="p-3 text-white">{item.ecoPoints} EP</td>
                                <td className="p-3 pr-4 text-right space-x-1">
                                  {isBanned ? (
                                    <button
                                      onClick={() => handleAction(item.id, 'UNBAN')}
                                      className="p-1.5 bg-green-900/40 hover:bg-green-900/60 rounded text-green-400"
                                      title="Unban"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAction(item.id, 'BAN')}
                                      className="p-1.5 bg-red-950/40 hover:bg-red-950/60 rounded text-red-400"
                                      title="Ban User"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {isAdmin ? (
                                    <button
                                      onClick={() => handleAction(item.id, 'MAKE_USER')}
                                      className="p-1.5 bg-blue-900/40 hover:bg-blue-900/60 rounded text-blue-400 text-[10px]"
                                      title="Demote to User"
                                    >
                                      Demote
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAction(item.id, 'MAKE_ADMIN')}
                                      className="p-1.5 bg-red-900/40 hover:bg-red-900/60 rounded text-red-400 text-[10px]"
                                      title="Promote to Admin"
                                    >
                                      Admin
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleAction(item.id, 'DELETE')}
                                    className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"
                                    title="Delete Account Permanently"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Audit Logs list */}
                <div className="cyber-panel p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold text-base flex items-center space-x-2 text-white">
                    <Terminal className="w-5 h-5 text-red-500" />
                    <span>Server Audit Trail Logs</span>
                  </h3>
                  
                  <div className="bg-black/80 p-4 rounded-xl font-mono text-[10px] space-y-2 overflow-y-auto max-h-64 border border-gray-800">
                    {logs.length === 0 ? (
                      <p className="text-gray-500">Tidak ada log tercatat.</p>
                    ) : (
                      logs.map((log: any) => (
                        <div key={log.id} className="text-gray-300">
                          <span className="text-green-500 font-semibold">[{new Date(log.createdAt).toLocaleTimeString()}]</span>{' '}
                          <span className="text-red-400 font-bold">{log.action}</span> - {log.details}{' '}
                          <span className="text-gray-500">({log.ipAddress} - {log.user?.name})</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* User Reports & Moderation (Grid-4) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="cyber-panel p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <AlertOctagon className="w-4 h-4 text-amber-500" />
                    <span>Laporan & Feedback</span>
                  </h3>

                  <div className="space-y-3 overflow-y-auto max-h-[500px]">
                    {reports.length === 0 ? (
                      <p className="text-center text-xs text-gray-500 py-6">Tidak ada laporan masuk.</p>
                    ) : (
                      reports.map((rep: any) => (
                        <div 
                          key={rep.id} 
                          className="bg-black/30 border border-gray-800 p-3.5 rounded-xl space-y-1.5"
                        >
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                              {rep.category}
                            </span>
                            <span className="text-gray-500">
                              {new Date(rep.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                            {rep.description}
                          </p>
                          <span className="text-[9px] text-gray-500 font-bold block pt-1">
                            Oleh: {rep.user?.name} ({rep.user?.email})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
}
