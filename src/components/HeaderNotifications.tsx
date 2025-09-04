import React from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface HeaderNotificationsProps {
  userId?: string;
  onNotificationClick?: () => void;
}

const HeaderNotifications: React.FC<HeaderNotificationsProps> = ({ 
  userId, 
  onNotificationClick 
}) => {
  const { notifications, loading, unreadCount, markAsRead } = useRealtimeNotifications(userId);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return Clock;
      case 'alert': return AlertTriangle;
      case 'escalation': return Bell;
      case 'approval': return CheckCircle;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 h-auto hover:bg-gray-100"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 5).map((notification) => {
                  const TypeIcon = getTypeIcon(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        notification.status === 'unread' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => onNotificationClick?.()}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full ${
                          notification.status === 'unread' ? 'bg-teal-100' : 'bg-gray-100'
                        }`}>
                          <TypeIcon className={`h-4 w-4 ${
                            notification.status === 'unread' ? 'text-teal-600' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className={`text-sm font-medium truncate ${
                              notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className={`text-xs ml-2 ${getPriorityColor(notification.priority)}`}>
                              •
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                            
                            {notification.status === 'unread' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                              >
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm text-teal-600 hover:text-teal-700"
                onClick={onNotificationClick}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HeaderNotifications;