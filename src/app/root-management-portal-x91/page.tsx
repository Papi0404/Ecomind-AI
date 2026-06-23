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
  Search,
  MessageSquare,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function AdminPortalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  
  const [userSearch, setUserSearch] = useState('');
  const [reportResponses, setReportResponses] = useState<Record<string, string>>({});
  const [submittingReportId, setSubmittingReportId] = useState<string | null>(null);

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

  // 4. Report Response Mutation
  const respondReportMutation = useMutation({
    mutationFn: api.admin.respondReport,
    onSuccess: (data) => {
      alert(data.message || 'Tanggapan berhasil dikirim.');
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSubmittingReportId(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Gagal mengirim tanggapan.');
      setSubmittingReportId(null);
    }
  });

  // Admin Verification Guard
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#FAF6EB] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1A403E] animate-spin" />
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

  const handleSendResponse = async (reportId: string) => {
    const responseText = reportResponses[reportId];
    if (!responseText || !responseText.trim()) {
      alert('Pesan tanggapan tidak boleh kosong.');
      return;
    }

    setSubmittingReportId(reportId);
    try {
      await respondReportMutation.mutateAsync({
        reportId,
        responseMessage: responseText.trim(),
      });
      // Clear response field for this report
      setReportResponses(prev => ({ ...prev, [reportId]: '' }));
    } catch (err) {
      // Handled by onError
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FAF6EB] text-gray-800">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto lg:h-screen pt-20 lg:pt-10 bg-grid-pattern">
        
        {/* Page Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8EC3B0]/30 pb-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-[#1A403E] font-poppins flex items-center space-x-2">
              <ShieldAlert className="w-8 h-8 text-[#1A403E]" />
              <span>Pusat Kontrol Root</span>
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Sesi terenkripsi. IP dan riwayat modifikasi tercatat di berkas audit server.
            </p>
          </div>
          <div className="bg-[#1A403E]/10 border border-[#1A403E]/20 text-[#1A403E] text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#1A403E] rounded-full animate-ping"></span>
            <span>ADMIN SECURE NODE</span>
          </div>
        </section>

        {statsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A403E]" />
          </div>
        ) : (
          <>
            {/* Aggregate Stats Row */}
            <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-[#8EC3B0]/20 p-5 rounded-2xl space-y-2 shadow-sm">
                <Users className="w-5 h-5 text-emerald-600" />
                <h4 className="text-2xl font-extrabold text-[#1A403E]">{stats.totalUsers}</h4>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Total Pengguna</span>
              </div>
              <div className="bg-white border border-[#8EC3B0]/20 p-5 rounded-2xl space-y-2 shadow-sm">
                <Database className="w-5 h-5 text-emerald-600" />
                <h4 className="text-2xl font-extrabold text-[#1A403E]">{stats.totalPoints} EP</h4>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Total EcoPoints</span>
              </div>
              <div className="bg-white border border-[#8EC3B0]/20 p-5 rounded-2xl space-y-2 shadow-sm">
                <Activity className="w-5 h-5 text-[#1A403E]" />
                <h4 className="text-2xl font-extrabold text-[#1A403E]">{stats.completedChallenges}</h4>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Misi Selesai</span>
              </div>
              <div className="bg-white border border-[#8EC3B0]/20 p-5 rounded-2xl space-y-2 shadow-sm">
                <FileText className="w-5 h-5 text-teal-600" />
                <h4 className="text-2xl font-extrabold text-[#1A403E]">{stats.totalUploads} File</h4>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">File Terunggah</span>
              </div>
              <div className="bg-white border border-[#8EC3B0]/20 p-5 rounded-2xl space-y-2 shadow-sm">
                <AlertOctagon className="w-5 h-5 text-amber-600" />
                <h4 className="text-2xl font-extrabold text-amber-700">{stats.totalReports} Laporan</h4>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Laporan Masuk</span>
              </div>
            </section>

            {/* Logs & User Moderation Grid */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* User management list (Grid-8) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-[#8EC3B0]/30 p-6 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-base flex items-center space-x-2 text-[#1A403E]">
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
                        className="bg-[#FAF6EB] border border-[#8EC3B0]/30 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold outline-none focus:border-[#1A403E] w-full sm:w-48 text-gray-800"
                      />
                    </div>
                  </div>

                  {usersLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-[#1A403E]" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-xs text-gray-500 py-6">Pengguna tidak ditemukan.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead className="bg-[#FAF6EB] text-gray-600 uppercase tracking-wider text-[9px] border-b border-[#8EC3B0]/20">
                          <tr>
                            <th className="p-3 pl-4">Pengguna</th>
                            <th className="p-3">Peran</th>
                            <th className="p-3">Points</th>
                            <th className="p-3 pr-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredUsers.map((item: any) => {
                            const isBanned = item.role === 'BANNED';
                            const isAdmin = item.role === 'ADMIN';
                            return (
                              <tr key={item.id} className="hover:bg-[#FAF6EB]/30">
                                <td className="p-3 pl-4">
                                  <div className="font-bold text-gray-800">{item.name}</div>
                                  <div className="text-[10px] text-gray-500 font-medium">{item.email}</div>
                                </td>
                                <td className="p-3">
                                  <span className={`
                                    text-[9px] font-extrabold px-2 py-0.5 rounded
                                    ${isAdmin ? 'bg-red-100 text-red-700' : isBanned ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'}
                                  `}>
                                    {item.role}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-800">{item.ecoPoints} EP</td>
                                <td className="p-3 pr-4 text-right space-x-1">
                                  {isBanned ? (
                                    <button
                                      onClick={() => handleAction(item.id, 'UNBAN')}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-700 transition"
                                      title="Unban"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAction(item.id, 'BAN')}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 rounded text-red-600 transition"
                                      title="Ban User"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {isAdmin ? (
                                    <button
                                      onClick={() => handleAction(item.id, 'MAKE_USER')}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 text-[10px] font-bold transition"
                                      title="Demote to User"
                                    >
                                      Demote
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAction(item.id, 'MAKE_ADMIN')}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 rounded text-red-600 text-[10px] font-bold transition"
                                      title="Promote to Admin"
                                    >
                                      Admin
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleAction(item.id, 'DELETE')}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
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
                <div className="bg-white border border-[#8EC3B0]/30 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-bold text-base flex items-center space-x-2 text-[#1A403E]">
                    <Terminal className="w-5 h-5 text-[#1A403E]" />
                    <span>Server Audit Trail Logs</span>
                  </h3>
                  
                  <div className="bg-[#FAF6EB] p-4 rounded-xl font-mono text-[10px] space-y-2 overflow-y-auto max-h-64 border border-[#8EC3B0]/20 text-gray-700">
                    {logs.length === 0 ? (
                      <p className="text-gray-400">Tidak ada log tercatat.</p>
                    ) : (
                      logs.map((log: any) => (
                        <div key={log.id} className="border-b border-gray-100 pb-1 last:border-0">
                          <span className="text-emerald-700 font-semibold">[{new Date(log.createdAt).toLocaleTimeString()}]</span>{' '}
                          <span className="text-amber-700 font-bold">{log.action}</span> - {log.details}{' '}
                          <span className="text-gray-500">({log.ipAddress || 'unknown'} - {log.user?.name})</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* User Reports & Moderation (Grid-4) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-[#8EC3B0]/30 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="font-bold text-sm text-[#1A403E] flex items-center space-x-2">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    <span>Laporan & Feedback</span>
                  </h3>

                  <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                    {reports.length === 0 ? (
                      <p className="text-center text-xs text-gray-500 py-6">Tidak ada laporan masuk.</p>
                    ) : (
                      reports.map((rep: any) => {
                        const isResolved = rep.status === 'RESOLVED';
                        return (
                          <div 
                            key={rep.id} 
                            className="bg-[#FAF6EB]/40 border border-[#8EC3B0]/20 p-4 rounded-2xl space-y-3"
                          >
                            <div className="flex justify-between items-center text-[9px] font-bold">
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                {rep.category}
                              </span>
                              <span className="text-gray-500">
                                {new Date(rep.createdAt).toLocaleDateString('id-ID')}
                              </span>
                            </div>

                            <p className="text-xs text-gray-700 font-medium leading-relaxed">
                              {rep.description}
                            </p>

                            <div className="text-[10px] text-gray-500 font-semibold border-t border-dashed border-gray-200 pt-2">
                              Oleh: <span className="text-gray-800">{rep.user?.name}</span> ({rep.user?.email})
                            </div>

                            {/* Response Section */}
                            {isResolved ? (
                              <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl space-y-1">
                                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-800">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Telah Ditanggapi</span>
                                </div>
                                <p className="text-[10.5px] text-emerald-700 italic font-medium leading-relaxed">
                                  Balasan: &quot;{rep.response}&quot;
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-700">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Menunggu Tanggapan</span>
                                </div>
                                <textarea
                                  placeholder="Tulis balasan Anda untuk pelapor..."
                                  value={reportResponses[rep.id] || ''}
                                  onChange={(e) => setReportResponses(prev => ({ ...prev, [rep.id]: e.target.value }))}
                                  className="w-full bg-white border border-[#8EC3B0]/40 rounded-xl p-2 text-xs font-medium outline-none focus:border-[#1A403E] resize-none h-16 text-gray-800"
                                />
                                <button
                                  onClick={() => handleSendResponse(rep.id)}
                                  disabled={submittingReportId === rep.id}
                                  className="w-full bg-[#1A403E] hover:bg-[#122c2b] disabled:bg-gray-400 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition flex items-center justify-center space-x-1"
                                >
                                  {submittingReportId === rep.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                                      <span>Mengirim...</span>
                                    </>
                                  ) : (
                                    <>
                                      <MessageSquare className="w-3 h-3" />
                                      <span>Kirim Tanggapan</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
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
