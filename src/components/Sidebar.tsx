'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Trophy, 
  Award, 
  User, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon,
  Leaf,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('ecomind-theme') || 'light';
    setTheme(savedTheme as 'light' | 'dark');
  }, []);

  // Fetch notifications to show badge count
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.list,
    enabled: !!user,
    refetchInterval: 10000, // Refresh notifications every 10 seconds
  });

  const unreadCount = notifData?.notifications?.filter((n: any) => !n.isRead).length || 0;

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('ecomind-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tanya AI', href: '/chat', icon: MessageSquare },
    { name: 'Tantangan', href: '/challenges', icon: Trophy },
    { name: 'Peringkat', href: '/leaderboard', icon: Award },
    { 
      name: 'Notifikasi', 
      href: '/notifications', 
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined 
    },
    { name: 'Profil Saya', href: '/profile', icon: User },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  const adminPath = process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || 'root-management-portal-x91';

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden w-full h-16 bg-[#2D5A27] text-white flex items-center justify-between px-4 z-40 fixed top-0 left-0">
        <div className="flex items-center space-x-2">
          <Leaf className="w-6 h-6 text-[#7ED957]" />
          <span className="font-bold text-lg tracking-wider font-poppins">EcoMind AI</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-1">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#2D5A27] text-[#FFF8E7] flex flex-col justify-between z-30 transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:h-screen lg:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16 lg:pt-0
      `}>
        {/* Top Header */}
        <div className="p-6 hidden lg:flex items-center space-x-3 border-b border-[#3b7233]">
          <div className="bg-[#7ED957] p-2 rounded-xl">
            <Leaf className="w-6 h-6 text-[#2D5A27]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-wider font-poppins text-white leading-tight">
              EcoMind
            </h1>
            <span className="text-[#A8E6A3] text-xs font-semibold">AI SUSTAINABILITY</span>
          </div>
        </div>

        {/* User Mini Profile */}
        {user && (
          <div className="px-6 py-4 border-b border-[#3b7233] flex items-center space-x-3 bg-[#244b1f]">
            <img
              src={user.avatarUrl || 'https://i.pravatar.cc/150?img=12'}
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover border border-[#7ED957]"
            />
            <div className="overflow-hidden">
              <p className="text-white font-semibold text-sm truncate">{user.name}</p>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="bg-[#7ED957] text-[#2D5A27] font-bold text-[10px] px-1.5 py-0.2 rounded">
                  LVL {user.level}
                </span>
                <span className="text-[#A8E6A3] text-xs font-medium">
                  {user.ecoPoints} EP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group
                  ${isActive 
                    ? 'bg-[#7ED957] text-[#2D5A27] shadow-lg shadow-[#7ED957]/10 font-bold' 
                    : 'text-[#A8E6A3] hover:bg-[#34672e] hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#2D5A27]' : 'text-[#A8E6A3] group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`
                    text-[10px] font-extrabold px-1.5 py-0.5 rounded-full
                    ${isActive ? 'bg-[#2D5A27] text-white' : 'bg-red-500 text-white'}
                  `}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin Panel Access Link */}
          {user && user.role === 'ADMIN' && (
            <Link
              href={`/${adminPath}`}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${pathname.startsWith(`/${adminPath}`)
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-red-300 hover:bg-[#3d2727] hover:text-white'
                }
              `}
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Bottom Utility Controls */}
        <div className="p-4 border-t border-[#3b7233] space-y-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-[#A8E6A3] hover:bg-[#34672e] hover:text-white transition-all"
          >
            <div className="flex items-center space-x-3">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span>Mode {theme === 'light' ? 'Gelap' : 'Terang'}</span>
            </div>
            <div className="w-8 h-4 bg-[#244b1f] rounded-full relative flex items-center p-0.5">
              <div className={`w-3 h-3 bg-[#7ED957] rounded-full transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : ''}`} />
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-[#4a2626] hover:text-white transition-all text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
        />
      )}
    </>
  );
}
