
import React from 'react';
import { DataTable } from './ui/data-table';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, AlertTriangle, ToggleLeft } from "lucide-react";
import { ComplianceBulkUpload } from './ComplianceBulkUpload';
import { ComplianceAssignments } from './ComplianceAssignments';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Compliance {
  id: string;
  compliance_id: string;
  category: string;
  name: string;
  section: string;
  short_description: string;
  description: string;
  risk_type: string;
  frequency: string;
  department_code: string;
  status: string;
  next_due: string;
}

interface ComplianceTableProps {
  compliances: Compliance[];
  onAdd: () => void;
  onEdit: (comp: Compliance) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export const ComplianceTable: React.FC<ComplianceTableProps> = ({
  compliances,
  onAdd,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const { toast } = useToast();

  const toggleComplianceStatus = async (compliance: Compliance) => {
    const newStatus = compliance.status === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('compliances')
        .update({ status: newStatus })
        .eq('id', compliance.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Compliance ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      });

      onRefresh();
    } catch (error) {
      console.error('Error updating compliance status:', error);
      toast({
        title: "Error",
        description: "Failed to update compliance status",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: 'compliance_id', label: 'ID', sortable: true },
    { key: 'name', label: 'Compliance Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    { key: 'risk_type', label: 'Risk Type', sortable: true },
    { key: 'frequency', label: 'Frequency', sortable: true },
    { key: 'department_code', label: 'Department', sortable: true },
    { key: 'next_due', label: 'Next Due', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'assignments', label: 'Assignments', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "Daily": return "bg-red-100 text-red-800";
      case "Weekly": return "bg-orange-100 text-orange-800";
      case "Monthly": return "bg-blue-100 text-blue-800";
      case "Quarterly": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLevel = (due_date: string) => {
    const today = new Date();
    const dueDate = new Date(due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { level: 'overdue', color: 'bg-red-500 text-white' };
    if (diffDays <= 3) return { level: 'critical', color: 'bg-red-100 text-red-800' };
    if (diffDays <= 7) return { level: 'high', color: 'bg-orange-100 text-orange-800' };
    return { level: 'normal', color: 'bg-blue-100 text-blue-800' };
  };

  const filterOptions = {
    category: [...new Set(compliances.map(comp => comp.category))].filter(cat => cat && cat.trim() !== ''),
    risk_type: [...new Set(compliances.map(comp => comp.risk_type))].filter(risk => risk && risk.trim() !== ''),
    frequency: [...new Set(compliances.map(comp => comp.frequency))].filter(freq => freq && freq.trim() !== ''),
    department_code: [...new Set(compliances.map(comp => comp.department_code))].filter(dept => dept && dept.trim() !== ''),
    status: ['active', 'inactive']
  };

  const tableData = compliances.map(comp => {
    const riskInfo = getRiskLevel(comp.next_due);
    
    return {
      ...comp,
      category: (
        <Badge variant="outline">{comp.category}</Badge>
      ),
      risk_type: (
        <Badge className="bg-purple-100 text-purple-800">{comp.risk_type}</Badge>
      ),
      frequency: (
        <Badge className={getFrequencyColor(comp.frequency)}>{comp.frequency}</Badge>
      ),
      department_code: (
        <Badge variant="outline">{comp.department_code}</Badge>
      ),
      next_due: comp.next_due ? (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-slate-400" />
          <span className="text-sm">{comp.next_due}</span>
          <Badge className={riskInfo.color}>
            {riskInfo.level}
          </Badge>
        </div>
      ) : (
        <span className="text-gray-400">Not set</span>
      ),
      status: (
        <div className="flex items-center gap-2">
          <Badge className={comp.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
            {comp.status}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleComplianceStatus(comp)}
            className="h-6 w-6 p-0"
          >
            <ToggleLeft className="h-3 w-3" />
          </Button>
        </div>
      ),
      assignments: (
        <ComplianceAssignments
          complianceId={comp.id}
          complianceName={comp.name}
          isActive={comp.status === 'active'}
        />
      ),
      actions: (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(comp)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(comp.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    };
  });

  return (
    <DataTable
      columns={columns}
      data={tableData}
      title="Compliance Management"
      onAdd={onAdd}
      filterOptions={filterOptions}
      customActions={
        <ComplianceBulkUpload onUploadComplete={onRefresh} />
      }
    />
  );
};
