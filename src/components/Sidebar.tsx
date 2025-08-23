
import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileCheck, 
  Shield, 
  Calendar,
  BarChart,
  UserCheck,
  GitBranch
} from "lucide-react";

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  userRole?: string;
  availableModules?: Record<string, boolean>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeModule, 
  setActiveModule, 
  userRole = 'user',
  availableModules = {}
}) => {
  const isAdmin = userRole === 'admin';

  console.log('Sidebar - User role:', userRole);
  console.log('Sidebar - Is admin:', isAdmin);

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      available: true
    },
    {
      id: "workflow",
      name: "My Workflow",
      icon: GitBranch,
      available: availableModules.workflow !== false
    },
    {
      id: "calendar",
      name: "Calendar",
      icon: Calendar,
      available: availableModules.calendar !== false
    },
    // Admin only sections
    {
      id: "departments",
      name: "Department Master",
      icon: Building2,
      available: isAdmin && availableModules.departments !== false,
      adminOnly: true
    },
    {
      id: "employees",
      name: "Employee Master",
      icon: Users,
      available: isAdmin && availableModules.employees !== false,
      adminOnly: true
    },
    {
      id: "compliance",
      name: "Compliance Master",
      icon: FileCheck,
      available: isAdmin && availableModules.compliance !== false,
      adminOnly: true
    },
    {
      id: "roles",
      name: "User Role Master",
      icon: Shield,
      available: isAdmin && availableModules.roles !== false,
      adminOnly: true
    },
    {
      id: "users",
      name: "User Management",
      icon: UserCheck,
      available: isAdmin && availableModules.users !== false,
      adminOnly: true
    },
    {
      id: "reports",
      name: "Reports",
      icon: BarChart,
      available: isAdmin && availableModules.reports !== false,
      adminOnly: true
    }
  ];

  const availableItems = menuItems.filter(item => item.available);

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">RBI Compliance</h1>
        <p className="text-xs text-gray-500 mt-1">
          {isAdmin ? 'Admin Panel' : 'User Dashboard'}
        </p>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          {/* User sections */}
          <div className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              My Work
            </h3>
            {availableItems
              .filter(item => !item.adminOnly)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                      activeModule === item.id
                        ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                );
              })}
          </div>

          {/* Admin sections */}
          {isAdmin && availableItems.some(item => item.adminOnly) && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Administration
              </h3>
              {availableItems
                .filter(item => item.adminOnly)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                        activeModule === item.id
                          ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
