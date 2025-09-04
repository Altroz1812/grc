import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileCheck, 
  Shield, 
  Calendar,
  BarChart,
  UserCheck,
  GitBranch,
  ChevronRight,
  ChevronLeft,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  userRole?: string;
  availableModules?: Record<string, boolean>;
  userProfile?: {
    id: string;
    full_name: string;
    email: string;
    role?: string;
    user_role?: string; // This is already the role name: 'maker', 'checker', 'admin'
    status: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeModule, 
  setActiveModule, 
  userRole = 'user',
  availableModules = {},
  userProfile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // SIMPLIFIED: user_role in profiles table is already the role name string
  const effectiveRoleName = userProfile?.user_role || userRole || 'user';
  const isAdmin = effectiveRoleName === 'admin';

  console.log('Sidebar - User profile:', userProfile);
  console.log('Sidebar - Effective role:', effectiveRoleName);
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

  const handleLogout = async () => {
    try {
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

  const sidebarVariants = {
    open: { 
      width: 256, 
      transition: { duration: 0.3, ease: "easeOut" }
    },
    closed: { 
      width: 60, 
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const textVariants = {
    open: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } },
    closed: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  const toggleVariants = {
    hover: { scale: 1.1, rotate: 5, transition: { duration: 0.2 } },
    tap: { scale: 0.9, rotate: -5, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#0E2144] text-white overflow-hidden position: relative"
      variants={sidebarVariants}
      animate={isOpen ? "open" : "closed"}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="relative h-full sticky">
        {/* Toggle Button */}
        <motion.button
          className="absolute top-4 right-[-8px] bg-[#0D3B66] rounded-full p-2 z-2 shadow-lg"
          variants={toggleVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <ChevronLeft className="h-6 w-6 text-white" /> : <ChevronRight className="h-6 w-6 text-white" />}
        </motion.button>

        {/* Header with User Details and Logout */}
        <motion.div 
          className="p-6 border-b border-gray-600"
          variants={textVariants}
          animate={isOpen ? "open" : "closed"}
        >
          <div className="flex flex-col items-start">
            <motion.div 
              className="mt-2 text-sm text-gray-300"
              variants={textVariants}
              animate={isOpen ? "open" : "closed"}
            >
              {/* <p>Vigilant</p> */}
              {/* <div className="flex items-center space-x-4"> */}
      {/* Logo from public folder */}
      {/* <img 
        src="/vigilant.png" 
        alt="Vigilant Logo" 
        className="h-auto w-48"
      /> */}

      {/* Text */}
      <p className="text-green text-lg font-bold">Vigilant</p>
    {/* </div> */}
              {/* {effectiveRoleName && effectiveRoleName !== 'user' && (
                <span className={`mt-1 inline-block px-2 py-1 rounded text-xs font-medium ${
                  isAdmin ? 'bg-red-600 text-slate-400' : 'bg-blue-600 text-slate-400'
                }`}>
                  {effectiveRoleName}
                </span>
              )} */}
            </motion.div>
            <motion.div
              className="mt-1"
              variants={textVariants}
              animate={isOpen ? "open" : "closed"}
            >
              {/* <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-blue-800 text-gray-900 border-gray-500 hover:text-red-400 hover:border-red-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button> */}
            </motion.div>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="mt-1 px-1">
          {/* User Sections */}
          <div className="mb-1">
            <motion.h3 
              className="px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1"
              variants={textVariants}
              animate={isOpen ? "open" : "closed"}
            >
              My Work
            </motion.h3>
            {availableItems
              .filter(item => !item.adminOnly)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center px-1 py-1 text-sm font-semibold rounded-lg mb-1 transition-colors relative overflow-hidden ${
                      activeModule === item.id
                        ? "bg-gradient-to-r from-emerald-600/30 to-yellow-400/30 text-emerald-300 border-r-4 border-yellow-400 shadow-glow"
                        : "text-white hover:bg-gradient-to-r from-emerald-600/20 to-yellow-400/20"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Navigate to ${item.name}`}
                  >
                    <Icon className={`mr-3 h-6 w-6 flex-shrink-0 ${activeModule === item.id ? "text-emerald-300" : "text-white"}`} />
                    <motion.span variants={textVariants} animate={isOpen ? "open" : "closed"}>
                      {item.name}
                    </motion.span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </motion.button>
                );
              })}
          </div>

          {/* Admin Sections */}
          {isAdmin && availableItems.some(item => item.adminOnly) && (
            <div>
              <motion.h3 
                className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
                variants={textVariants}
                animate={isOpen ? "open" : "closed"}
              >
                Administration
              </motion.h3>
              {availableItems
                .filter(item => item.adminOnly)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-semibold rounded-lg mb-1 transition-colors relative overflow-hidden ${
                        activeModule === item.id
                          ? "bg-gradient-to-r from-emerald-600/30 to-yellow-400/30 text-emerald-300 border-r-4 border-yellow-400 shadow-glow"
                          : "text-white hover:bg-gradient-to-r from-emerald-600/20 to-yellow-400/20"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Navigate to ${item.name}`}
                    >
                      <Icon className={`mr-3 h-6 w-6 flex-shrink-0 ${activeModule === item.id ? "text-emerald-300" : "text-white"}`} />
                      <motion.span variants={textVariants} animate={isOpen ? "open" : "closed"}>
                        {item.name}
                      </motion.span>
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>
                  );
                })}
            </div>
          )}
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;