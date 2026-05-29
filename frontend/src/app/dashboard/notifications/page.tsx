'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, BellOff, Zap, TrendingUp, User, AlertCircle } from 'lucide-react';
import { notificationApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

const NOTIF_ICONS: Record<string, any> = {
  APPLICATION_SENT: Zap,
  INTERVIEW_SCHEDULED: TrendingUp,
  OFFER_RECEIVED: TrendingUp,
  AUTOMATION_COMPLETE: Zap,
  SYSTEM: AlertCircle,
  default: Bell,
};

const NOTIF_COLORS: Record<string, string> = {
  APPLICATION_SENT: 'text-brand-400 bg-brand-500/10',
  INTERVIEW_SCHEDULED: 'text-yellow-400 bg-yellow-500/10',
  OFFER_RECEIVED: 'text-green-400 bg-green-500/10',
  AUTOMATION_COMPLETE: 'text-purple-400 bg-purple-500/10',
  SYSTEM: 'text-red-400 bg-red-500/10',
  default: 'text-text-muted bg-surface-tertiary',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    try {
      const { data } = await notificationApi.list({ unreadOnly: filter === 'unread' });
      setNotifications(data.data);
    } catch {
      // mock data
      setNotifications([
        { id: '1', type: 'APPLICATION_SENT', title: 'Candidatura Enviada!', message: 'Você se candidatou para Senior Backend Engineer na Nubank via LinkedIn Easy Apply.', isRead: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
        { id: '2', type: 'INTERVIEW_SCHEDULED', title: 'Entrevista Agendada', message: 'A Mercado Livre agendou uma entrevista técnica para amanhã às 14h.', isRead: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: '3', type: 'AUTOMATION_COMPLETE', title: 'Automação Concluída', message: 'Sua automação enviou 23 candidaturas hoje. Taxa de match médio: 87%.', isRead: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
        { id: '4', type: 'OFFER_RECEIVED', title: 'Oferta Recebida! 🎉', message: 'Parabéns! A PagSeguro enviou uma proposta para a posição de Node.js Developer.', isRead: true, createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    try {
      await notificationApi.markRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Todas as notificações marcadas como lidas');
    } catch { toast.error('Erro ao marcar notificações'); }
  }

  async function deleteNotification(id: string) {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { /* ignore */ }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Notificações</h1>
          <p className="text-text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl w-fit">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f ? 'bg-brand-600 text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {f === 'all' ? 'Todas' : `Não lidas${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-20 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <BellOff className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Nenhuma notificação{filter === 'unread' ? ' não lida' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif, i) => {
            const Icon = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
            const colorClass = NOTIF_COLORS[notif.type] || NOTIF_COLORS.default;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass rounded-xl p-4 flex items-start gap-4 ${!notif.isRead ? 'border-brand-500/30' : ''}`}
              >
                <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${notif.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-text-muted flex-shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mt-1">{notif.message}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="p-1 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
