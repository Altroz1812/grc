import { useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  TestTube, 
  MessageSquare, 
  Shield,
  ChevronRight
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  { 
    title: 'Dashboard', 
    url: '/', 
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  { 
    title: 'Rules Manager', 
    url: '/rules', 
    icon: Settings,
    description: 'Manage decision rules'
  },
  { 
    title: 'Decision Tester', 
    url: '/tester', 
    icon: TestTube,
    description: 'Test rule scenarios'
  },
  { 
    title: 'AI Assistant', 
    url: '/assistant', 
    icon: MessageSquare,
    description: 'AI-powered insights'
  },
  { 
    title: 'Audit Trail', 
    url: '/audit', 
    icon: FileText,
    description: 'Decision history'
  },
  { 
    title: 'Security', 
    url: '/security', 
    icon: Shield,
    description: 'Security settings'
  },
];

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    const baseClass = "flex items-center gap-3 w-full text-left transition-all duration-200";
    return isActive(path) 
      ? `${baseClass} bg-gradient-primary text-white shadow-glow` 
      : `${baseClass} hover:bg-accent/50 text-muted-foreground hover:text-foreground`;
  };

  return (
    <Sidebar className={`transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} border-r bg-sidebar`}>
      <SidebarContent className="p-4">
        {/* Logo/Brand */}
        <div className="mb-8 px-2">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">LOS Engine</h1>
                <p className="text-xs text-muted-foreground">Rule Management</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                      title={collapsed ? item.title : ''}
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive(item.url) ? 'text-white' : ''}`} />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs opacity-70 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 text-white" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};