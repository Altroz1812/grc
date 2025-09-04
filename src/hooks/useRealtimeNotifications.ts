import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at?: string;
  compliance_id?: string;
  user_id: string;
}

export const useRealtimeNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching notifications:', error);
          setNotifications([]);
        } else {
          setNotifications(data || []);
        }
      } catch (error) {
        console.error('Error in fetchNotifications:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up realtime subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev.slice(0, 9)]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
          
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n)
      );
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead
  };
};