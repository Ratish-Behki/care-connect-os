import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, CircleAlert, Clock3, Inbox, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import type { ComponentType } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/services/notificationService';
import { NotificationItem } from '@/types';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'high', label: 'Priority' },
] as const;

const iconByType: Record<NotificationItem['type'], ComponentType<{ className?: string }>> = {
  appointment: Clock3,
  records: Inbox,
  schedule: Sparkles,
  emergency: CircleAlert,
  system: Bell,
  profile: CheckCheck,
  triage: CircleAlert,
};

const NotificationsPage = () => {
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('all');
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markAll = useMutation({
    mutationFn: notificationService.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: notificationService.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const visibleNotifications = filter === 'unread'
    ? notifications.filter((notification) => !notification.read)
    : filter === 'high'
      ? notifications.filter((notification) => notification.priority === 'high')
      : notifications;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">Your care updates, alerts, and activity feed</p>
          </div>
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{notifications.length}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Unread</p>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{unreadCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">High Priority</p>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{notifications.filter((notification) => notification.priority === 'high').length}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent</p>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{notifications.slice(0, 1).length}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((entry) => (
            <button
              key={entry.key}
              onClick={() => setFilter(entry.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === entry.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleNotifications.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications match the current filter.</p>
            </div>
          ) : (
            visibleNotifications.map((notification, index) => {
              const Icon = iconByType[notification.type];

              return (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => markOne.mutate(notification.id)}
                  className={`w-full text-left glass-card p-5 border transition-all hover:shadow-elevated ${
                    notification.read ? 'opacity-75' : 'border-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notification.priority === 'high' ? 'bg-emergency/10 text-emergency' : 'bg-accent text-primary'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={notification.priority === 'high' ? 'destructive' : notification.priority === 'medium' ? 'secondary' : 'outline'}>
                            {notification.priority}
                          </Badge>
                          {!notification.read && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                        <span>•</span>
                        <span>{notification.recipientRole}</span>
                        {notification.link && (
                          <>
                            <span>•</span>
                            <span>{notification.link}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;