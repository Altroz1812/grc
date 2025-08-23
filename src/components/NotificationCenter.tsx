
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, Clock, AlertTriangle, CheckCircle, Settings } from "lucide-react";

interface Notification {
  id: string;
  type: 'reminder' | 'alert' | 'escalation' | 'approval';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read';
  created_at: string;
  compliance_id?: string;
  user_id: string;
}

interface NotificationSettings {
  email_enabled: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  daily_summary: boolean;
  urgent_alerts: boolean;
  reminder_frequency: 'daily' | 'weekly' | 'monthly';
}

const NotificationCenter = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    push_enabled: true,
    whatsapp_enabled: false,
    daily_summary: true,
    urgent_alerts: true,
    reminder_frequency: 'daily'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock notifications data until the new tables are fully synced
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'reminder',
          title: 'STR Filing Due Tomorrow',
          message: 'Suspicious Transaction Report filing is due tomorrow. Please complete and submit.',
          priority: 'high',
          status: 'unread',
          created_at: new Date().toISOString(),
          user_id: 'user-1'
        },
        {
          id: '2',
          type: 'escalation',
          title: 'NPA Classification Overdue',
          message: 'NPA Classification report is 3 days overdue and has been escalated to department head.',
          priority: 'urgent',
          status: 'unread',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: 'user-1'
        },
        {
          id: '3',
          type: 'approval',
          title: 'ALM Return Approved',
          message: 'Your Asset Liability Management return has been approved by the checker.',
          priority: 'medium',
          status: 'read',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          user_id: 'user-1'
        }
      ];
      
      return mockNotifications;
    },
    refetchInterval: 30000
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      // Mock function - in real implementation, this would update the database
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    }
  });

  // Send test notification
  const sendTestNotification = useMutation({
    mutationFn: async (type: string) => {
      // Mock function - in real implementation, this would call a Supabase function
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test notification sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-50 text-blue-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return Clock;
      case 'alert': return AlertTriangle;
      case 'escalation': return Bell;
      case 'approval': return CheckCircle;
      default: return Bell;
    }
  };

  const unreadCount = notifications?.filter(n => n.status === 'unread').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                Notification Center
              </h1>
              <p className="text-slate-600">Manage alerts, reminders, and system notifications</p>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-teal-600" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendTestNotification.mutate('reminder')}
                    disabled={sendTestNotification.isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Test Reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendTestNotification.mutate('alert')}
                    disabled={sendTestNotification.isPending}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Test Alert
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendTestNotification.mutate('email')}
                    disabled={sendTestNotification.isPending}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-4">
              {notifications?.map((notification) => {
                const TypeIcon = getTypeIcon(notification.type);
                
                return (
                  <Card 
                    key={notification.id}
                    className={`transition-all duration-300 hover:shadow-lg ${
                      notification.status === 'unread' ? 'bg-gradient-to-r from-white to-teal-50 border-teal-200' : 'bg-white'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${
                          notification.status === 'unread' ? 'bg-teal-100' : 'bg-gray-100'
                        }`}>
                          <TypeIcon className={`h-5 w-5 ${
                            notification.status === 'unread' ? 'text-teal-600' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className={`font-semibold ${
                              notification.status === 'unread' ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-600">
                            {notification.message}
                          </p>
                          
                          {notification.status === 'unread' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead.mutate(notification.id)}
                              disabled={markAsRead.isPending}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {notifications?.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No notifications</h3>
                <p className="text-slate-500">You're all caught up!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notification Channels */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800">Notification Channels</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-slate-600" />
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.email_enabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, email_enabled: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-slate-600" />
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.push_enabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, push_enabled: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-slate-600" />
                        <Label htmlFor="whatsapp-notifications">WhatsApp Alerts</Label>
                      </div>
                      <Switch
                        id="whatsapp-notifications"
                        checked={settings.whatsapp_enabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, whatsapp_enabled: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Types */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800">Notification Types</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="daily-summary">Daily Summary Email</Label>
                      <Switch
                        id="daily-summary"
                        checked={settings.daily_summary}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, daily_summary: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="urgent-alerts">Urgent Alerts</Label>
                      <Switch
                        id="urgent-alerts"
                        checked={settings.urgent_alerts}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, urgent_alerts: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationCenter;
