import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WorkflowItem } from './WorkflowCard';
import { Clock, CheckCircle, AlertTriangle, RotateCcw, Inbox } from "lucide-react";

interface WorkflowTabsProps {
  assignedItems: WorkflowItem[];
  unassignedItems: WorkflowItem[];
  completedItems: WorkflowItem[];
  overdueItems: WorkflowItem[];
  sendbackItems: WorkflowItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children?: React.ReactNode;
  isAdmin?: boolean;
}

export const WorkflowTabs: React.FC<WorkflowTabsProps> = ({ 
  assignedItems, 
  unassignedItems, 
  completedItems, 
  overdueItems, 
  sendbackItems, 
  activeTab, 
  onTabChange, 
  children,
  isAdmin = false 
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
    <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} bg-muted`}>
  {/* Assigned */}
  <TabsTrigger
    value="assigned"
    className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-gray-100"
  >
    <Clock className="h-4 w-4" />
    Assigned
    <Badge variant="secondary" className="ml-1">
      {assignedItems?.length || 0}
    </Badge>
  </TabsTrigger>

  {/* Unassigned (admin only) */}
  {isAdmin && (
    <TabsTrigger
      value="unassigned"
      className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700"
    >
      <Inbox className="h-4 w-4" />
      Unassigned
      <Badge variant="secondary" className="ml-1">
        {unassignedItems?.length || 0}
      </Badge>
    </TabsTrigger>
  )}

  {/* Completed */}
  <TabsTrigger
    value="completed"
    className="flex items-center gap-2 data-[state=active]:bg-green-700 data-[state=active]:text-gray-200"
  >
    <CheckCircle className="h-4 w-4" />
    Completed
    <Badge variant="secondary" className="ml-1">
      {completedItems?.length || 0}
    </Badge>
  </TabsTrigger>

  {/* Overdue */}
  <TabsTrigger
    value="overdue"
    className="flex items-center gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-700"
  >
    <AlertTriangle className="h-4 w-4" />
    Overdue
    <Badge variant="secondary" className="ml-1">
      {overdueItems?.length || 0}
    </Badge>
  </TabsTrigger>

  {/* Send Back */}
  <TabsTrigger
    value="sendback"
    className="flex items-center gap-2 data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700"
  >
    <RotateCcw className="h-4 w-4" />
    Send Back
    <Badge variant="secondary" className="ml-1">
      {sendbackItems?.length || 0}
    </Badge>
  </TabsTrigger>
</TabsList>

      <TabsContent value="assigned" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Assigned Tasks ({assignedItems?.length || 0})
          </h3>
        </div>
        {children}
      </TabsContent>

      {isAdmin && (
        <TabsContent value="unassigned" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Unassigned Tasks ({unassignedItems?.length || 0})
            </h3>
          </div>
          {children}
        </TabsContent>
      )}

      <TabsContent value="completed" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Completed Tasks ({completedItems?.length || 0})
          </h3>
        </div>
        {children}
      </TabsContent>

      <TabsContent value="overdue" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Overdue Tasks ({overdueItems?.length || 0})
          </h3>
        </div>
        {children}
      </TabsContent>

      <TabsContent value="sendback" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Send Back Items ({sendbackItems?.length || 0})
          </h3>
        </div>
        {children}
      </TabsContent>
    </Tabs>
  );
};