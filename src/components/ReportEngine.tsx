import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DepartmentMaster from '../components/DepartmentMaster';
import EmployeeMaster from '../components/EmployeeMaster';
import ComplianceMaster from '../components/ComplianceMaster';
import UserRoleMaster from '../components/UserRoleMaster';
import ComplianceCalendar from '../components/ComplianceCalendar';
import ComplianceAnalytics from '../components/ComplianceAnalytics';
import TATMetrics from '../components/TATMetrics';
import ComplianceSummaryCards from '../components/ComplianceSummaryCards';
import ReportEngine from '../components/ReportEngine';
import UserManagement from '../components/UserManagement';
import MakerCheckerWorkflow from '../components/MakerCheckerWorkflow';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface IndexProps {
  userProfile?: {
    id: string;
    full_name: string;
    email: string;
    role?: string;
    status: string;
  };
  currentUser?: any;
}

const Index: React.FC<IndexProps> = ({ userProfile, currentUser }) => {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [user, setUser] = useState(currentUser || null);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
      });
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      setUser(null);
      
      // Clear any cached auth state
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error logging out:', error);
      // Force redirect even if logout fails
      window.location.href = '/auth';
    }
  };

  // Check if user has admin role - be more flexible with role checking
  const isAdmin = userProfile?.role === 'admin';
  
  console.log('User profile role:', userProfile?.role);
  console.log('Is admin:', isAdmin);
  
  // Filter available modules based on user role
  const getAvailableModules = () => {
    if (isAdmin) {
      return {
        dashboard: true,
        departments: true,
        employees: true,
        compliance: true,
        roles: true,
        calendar: true,
        analytics: true,
        reports: true,
        users: true,
        workflow: true
      };
    } else {
      // Regular users only get limited access
      return {
        dashboard: true,
        calendar: true,
        workflow: true,
        analytics: false,
        reports: false,
        departments: false,
        employees: false,
        compliance: false,
        roles: false,
        users: false
      };
    }
  };

  const availableModules = getAvailableModules();

  const renderActiveModule = () => {
    // Prevent access to admin modules for non-admin users
    if (!availableModules[activeModule as keyof typeof availableModules]) {
      return <UserDashboard userProfile={userProfile} onModuleChange={setActiveModule} />;
    }

    switch (activeModule) {
      case "departments":
        return <DepartmentMaster />;
      case "employees":
        return <EmployeeMaster />;
      case "compliance":
        return <ComplianceMaster />;
      case "roles":
        return <UserRoleMaster />;
      case "calendar":
        return <ComplianceCalendar />;
      case "analytics":
        return <ComplianceAnalytics />;
      case "reports":
        return <ReportEngine />;
      case "users":
        return <UserManagement />;
      case "workflow":
        return <MakerCheckerWorkflow userProfile={userProfile} />;
      case "dashboard":
      default:
        return isAdmin ? 
          <AdminDashboard onModuleChange={setActiveModule} /> : 
          <UserDashboard userProfile={userProfile} onModuleChange={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 to-blue-800 flex">
      {/* Fixed Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        userRole={userProfile?.role}
        availableModules={availableModules}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shrink-0">
          <div className="text-sm text-gray-600">
            Welcome, {userProfile?.full_name || user?.email} 
            {userProfile?.role && (
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                isAdmin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {userProfile.role}
              </span>
            )}
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Dynamic module rendering - This is the scrollable area */}
        <div className="flex-1 overflow-auto">
          {renderActiveModule()}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ onModuleChange: (module: string) => void }> = ({ onModuleChange }) => {
  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Interactive Compliance Summary Cards */}
        <div className="space-y-4">
          <ComplianceSummaryCards onModuleChange={onModuleChange} />
        </div>

        {/* TAT Metrics Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-700 to-blue-900 border-blue-100 rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-400 mb-2">TAT Performance Metrics</h2>
              <p className="text-gray-400 text-sm">Turn-around time analysis and SLA compliance tracking</p>
            </div>
          </div>
          
          <TATMetrics />
        </div>

        {/* Comprehensive Analytics */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Compliance Analytics</h2>
              <p className="text-gray-600 text-sm">Detailed insights and performance metrics</p>
            </div>
          </div>
          
          <ComplianceAnalytics />
        </div>
      </div>
    </div>
  );
};

const UserDashboard: React.FC<{ userProfile?: any; onModuleChange: (module: string) => void }> = ({ userProfile, onModuleChange }) => {
  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">
                My Compliance Dashboard
              </h1>
              <p className="text-gray-600 text-base">
                Your personal compliance workspace with comprehensive metrics and insights
              </p>
            </div>
            <div className="text-right bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium">Your Role</div>
              <div className="text-sm font-semibold text-blue-700">
                {userProfile?.role || 'User'}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Compliance Summary Cards for Users */}
        <div className="space-y-6">
          <ComplianceSummaryCards onModuleChange={onModuleChange} />
        </div>

        {/* Interactive User Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Quick Actions</h2>
            <p className="text-gray-600 text-sm">Access your most used compliance tools</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onModuleChange('workflow')}
            >
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">📋</span>
              </div>
              <h3 className="font-semibold text-blue-800 mb-2">My Tasks</h3>
              <p className="text-blue-600 text-sm">View and complete your assigned compliance tasks</p>
            </div>
            
            <div 
              className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onModuleChange('calendar')}
            >
              <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">📅</span>
              </div>
              <h3 className="font-semibold text-green-800 mb-2">Calendar</h3>
              <p className="text-green-600 text-sm">Check upcoming compliance deadlines and schedules</p>
            </div>
            
            <div 
              className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onModuleChange('workflow')}
            >
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">🔄</span>
              </div>
              <h3 className="font-semibold text-purple-800 mb-2">Workflow</h3>
              <p className="text-purple-600 text-sm">Access maker-checker workflow system</p>
            </div>
          </div>
        </div>

        {/* User Performance Insights */}
        <div className="space-y-6">
          <TATMetrics />
        </div>
      </div>
    </div>
  );
};

export default Index;