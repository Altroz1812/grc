
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface WorkflowTabsProps {
  assignedItems: any[];
  unassignedItems: any[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const WorkflowTabs: React.FC<WorkflowTabsProps> = ({
  assignedItems,
  unassignedItems,
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="assigned" className="flex items-center gap-2">
          Assigned Tasks
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {assignedItems.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="unassigned" className="flex items-center gap-2">
          Unassigned Tasks
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {unassignedItems.length}
          </Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="assigned" className="mt-6">
        {children}
      </TabsContent>
      
      <TabsContent value="unassigned" className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  );
};
