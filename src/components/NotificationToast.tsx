'use client';

/**
 * src/components/NotificationToast.tsx
 * ──────────────────────────────────────
 * Real-time notification popup that polls for new notifications every 15s.
 * Shows slide-in toast cards in the bottom-right corner.
 * Clicking a toast marks it as read and navigates to its link.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, Trophy, Leaf, X, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  content: string;   // schema uses 'content', not 'message'
  isRead: boolean;
  createdAt: string;
}

// Derive icon/color from notification title (schema has no 'type' field)
function getNotifStyle(title: string) {
  const t = title.toLowerCase();
  if (t.includes('pesan'))      return { icon: <MessageSquare className="w-4 h-4" />, color: 'from-blue-500 to-blue-600' };
  if (t.includes('tantangan'))  return { icon: <Leaf className="w-4 h-4" />,          color: 'from-eco-400 to-eco-500' };
  if (t.includes('pencapaian') || t.includes('badge')) return { icon: <Trophy className="w-4 h-4" />, color: 'from-amber-400 to-amber-500' };
  if (t.includes('tanggapan') || t.includes('laporan')) return { icon: <CheckCheck className="w-4 h-4" />, color: 'from-violet-400 to-violet-600' };
  return { icon: <Bell className="w-4 h-4" />, color: 'from-eco-300 to-eco-500' };
}


const POLL_INTERVAL = 15_000; // 15 seconds
const MAX_VISIBLE   = 3;      // max toasts at once

export default function NotificationToast() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Notification[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const fetchAndDiff = useCallback(async () => {
    try {
      const data = await api.notifications.list();
      const all: Notification[] = data.notifications || [];

      if (!initialized.current) {
        // On first load, just record existing IDs — don't show old toasts
        all.forEach((n) => seenIds.current.add(n.id));
        initialized.current = true;
        return;
      }

      // Find truly new (unseen + unread) notifications
      const fresh = all.filter((n) => !n.isRead && !seenIds.current.has(n.id));

      if (fresh.length > 0) {
        fresh.forEach((n) => seenIds.current.add(n.id));
        setToasts((prev) => {
          const combined = [...fresh.reverse(), ...prev];
          return combined.slice(0, MAX_VISIBLE);
        });
      }
    } catch {
      // Silently ignore — toast is non-critical
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    fetchAndDiff();
    const interval = setInterval(fetchAndDiff, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, fetchAndDiff]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    // Mark as read server-side (fire-and-forget)
    api.notifications.markRead({ id }).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifikasi baru"
    >
      <AnimatePresence>
        {toasts.map((notif) => {
          const { icon, color } = getNotifStyle(notif.title);
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 80, scale: 0.88 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: 80,  scale: 0.88, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="pointer-events-auto w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Colored top bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${color}`} />

              <div className="p-4 flex items-start gap-3">
                {/* Icon */}
                <div className={`shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow`}>
                  {icon}
                </div>

                {/* Content */}
                <button
                  type="button"
                  className="flex-1 text-left min-w-0"
                  onClick={() => dismiss(notif.id)}
                >
                  <p className="text-xs font-bold text-gray-900 truncate">{notif.title}</p>
                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed line-clamp-2 mt-0.5">
                    {notif.content}
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium mt-1 block">
                    {new Date(notif.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => dismiss(notif.id)}
                  className="shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Tutup notifikasi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
