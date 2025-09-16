import React, { useState } from "react";
import { motion } from "framer-motion";
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
  LogOut,
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
    user_role?: string;
    status: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  userRole = "user",
  availableModules = {},
  userProfile,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const effectiveRoleName = userProfile?.user_role || userRole || "user";
  const isAdmin = effectiveRoleName === "admin";

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, available: true },
    { id: "workflow", name: "My Workflow", icon: GitBranch, available: availableModules.workflow !== false },
    { id: "calendar", name: "Calendar", icon: Calendar, available: availableModules.calendar !== false },
    { id: "departments", name: "Department Master", icon: Building2, available: isAdmin && availableModules.departments !== false, adminOnly: true },
    { id: "employees", name: "Employee Master", icon: Users, available: isAdmin && availableModules.employees !== false, adminOnly: true },
    { id: "compliance", name: "Compliance Master", icon: FileCheck, available: isAdmin && availableModules.compliance !== false, adminOnly: true },
    { id: "roles", name: "User Role Master", icon: Shield, available: isAdmin && availableModules.roles !== false, adminOnly: true },
    { id: "users", name: "User Management", icon: UserCheck, available: isAdmin && availableModules.users !== false, adminOnly: true },
    { id: "reports", name: "Reports", icon: BarChart, available: isAdmin && availableModules.reports !== false, adminOnly: true },
  ];

  const availableItems = menuItems.filter((item) => item.available);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("supabase.auth.token");
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
          localStorage.removeItem(key);
        }
      });
      await supabase.auth.signOut({ scope: "global" });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error logging out:", error);
      window.location.href = "/auth";
    }
  };

  const sidebarVariants = {
    open: { width: 240, transition: { duration: 0.3, ease: "easeOut" } },
    closed: { width: 72, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="min-h-screen bg-[oklch(51.1%_.262_276.966)] text-white flex flex-col justify-between"
      variants={sidebarVariants}
      animate={isOpen ? "open" : "closed"}
    >
      {/* Top section */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          {isOpen && <p className="text-green-400 text-lg font-bold">Vigilant</p>}
          <button
            className="bg-[#0D3B66] rounded-full p-2 shadow-lg"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {/* My Work */}
          <div className="mb-4">
            <h3
              className={`px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-all duration-200 ${
                isOpen ? "opacity-100 visible" : "opacity-0 invisible"
              }`}
            >
              My Work
            </h3>
            {availableItems
              .filter((item) => !item.adminOnly)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-lg mb-1 transition-colors ${
                      activeModule === item.id
                        ? "bg-emerald-600/20 text-emerald-300 border-r-4 border-yellow-400"
                        : "text-white hover:bg-emerald-600/10"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isOpen && <span className="ml-3">{item.name}</span>}
                  </button>
                );
              })}
          </div>

          {/* Administration */}
          {isAdmin && availableItems.some((item) => item.adminOnly) && (
            <div>
              <h3
                className={`px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-all duration-200 ${
                  isOpen ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
              >
                Administration
              </h3>
              {availableItems
                .filter((item) => item.adminOnly)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-lg mb-1 transition-colors ${
                        activeModule === item.id
                          ? "bg-emerald-600/20 text-emerald-300 border-r-4 border-yellow-400"
                          : "text-white hover:bg-emerald-600/10"
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {isOpen && <span className="ml-3">{item.name}</span>}
                    </button>
                  );
                })}
            </div>
          )}
        </nav>
      </div>

      {/* Footer (Logout) pinned bottom */}
      <div className="p-4 border-t border-gray-700">
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center gap-2 bg-blue-800 text-white border-gray-500 hover:text-red-400 hover:border-red-400"
        >
          <LogOut className="h-4 w-4" />
          {isOpen && "Logout"}
        </Button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
