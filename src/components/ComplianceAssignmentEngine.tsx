import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, FileText, AlertTriangle } from "lucide-react";

interface ComplianceAssignment {
  id: string;
  compliance_id: string;
  assigned_to: string;
  checker_id: string | null;
  due_date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'escalated';
  maker_remarks?: string;
  checker_remarks?: string;
  document_url?: string;
  escalation_level?: number;
  created_at: string;
  updated_at: string;
  compliance?: {
    name: string;
    frequency: string;
    category: string;
  };
  maker?: {
    full_name: string;
    email: string;
  };
  checker?: {
    full_name: string;
    email: string;
  };
}

const ComplianceAssignmentEngine = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<ComplianceAssignment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch compliance assignments from Supabase
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['compliance-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_assignments')
        .select(`
          *,
          compliance:compliances(*),
          maker:employees!compliance_assignments_assigned_to_fkey(name, email),
          checker:employees!compliance_assignments_checker_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match expected interface
      const transformedData = data?.map(assignment => ({
        ...assignment,
        maker: assignment.maker && Array.isArray(assignment.maker) && assignment.maker.length > 0 
          ? { full_name: assignment.maker[0].name, email: assignment.maker[0].email }
          : null,
        checker: assignment.checker && Array.isArray(assignment.checker) && assignment.checker.length > 0
          ? { full_name: assignment.checker[0].name, email: assignment.checker[0].email }
          : null
      })) || [];

      return transformedData as ComplianceAssignment[];
    },
    refetchInterval: 30000
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('compliance-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_assignments'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['compliance-assignments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Auto-generate assignments mutation
  const generateAssignments = useMutation({
    mutationFn: async () => {
      // Get active compliances and employees
      const [compliancesRes, employeesRes] = await Promise.all([
        supabase.from('compliances').select('*').eq('status', 'active'),
        supabase.from('employees').select('*').eq('status', 'active')
      ]);

      if (compliancesRes.error) throw compliancesRes.error;
      if (employeesRes.error) throw employeesRes.error;

      const compliances = compliancesRes.data;
      const employees = employeesRes.data;

      if (!compliances?.length || !employees?.length) {
        throw new Error('No active compliances or employees found');
      }

      // Create assignments for each compliance
      const assignments = compliances.map(compliance => {
        const maker = employees[Math.floor(Math.random() * employees.length)];
        const checker = employees.filter(p => p.id !== maker.id)[Math.floor(Math.random() * (employees.length - 1))];
        
        return {
          compliance_id: compliance.id,
          assigned_to: maker.id,
          checker_id: checker?.id || null,
          due_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft' as const
        };
      });

      const { error } = await supabase
        .from('compliance_assignments')
        .insert(assignments);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Compliance assignments generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['compliance-assignments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to generate assignments: " + error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyLevel = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { level: 'overdue', color: 'text-red-600', icon: AlertTriangle };
    if (diffDays <= 1) return { level: 'urgent', color: 'text-orange-600', icon: Clock };
    if (diffDays <= 3) return { level: 'due-soon', color: 'text-blue-600', icon: Calendar };
    return { level: 'normal', color: 'text-teal-600', icon: Calendar };
  };

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Compliance Assignment Engine
          </h1>
          <p className="text-slate-600">Automated compliance task assignment and tracking</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-4">
          <Button
            onClick={() => generateAssignments.mutate()}
            disabled={generateAssignments.isPending}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {generateAssignments.isPending ? 'Generating...' : 'Generate New Assignments'}
          </Button>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments?.map((assignment) => {
            const urgency = getUrgencyLevel(assignment.due_date);
            const UrgencyIcon = urgency.icon;
            
            return (
              <Card 
                key={assignment.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-teal-50 border-teal-100 animate-scale-in cursor-pointer"
                onClick={() => setSelectedAssignment(assignment)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-800 line-clamp-2">
                      {assignment.compliance?.name || 'Compliance Task'}
                    </CardTitle>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-600">
                    {assignment.compliance?.category || 'General'} • {assignment.compliance?.frequency || 'As needed'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Due Date */}
                  <div className="flex items-center gap-2">
                    <UrgencyIcon className={`h-4 w-4 ${urgency.color}`} />
                    <span className={`text-sm font-medium ${urgency.color}`}>
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Maker */}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-4 w-4" />
                    <span>Maker: {assignment.maker?.full_name || 'Unassigned'}</span>
                  </div>

                  {/* Checker */}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-4 w-4" />
                    <span>Checker: {assignment.checker?.full_name || 'Unassigned'}</span>
                  </div>

                  {/* Document Status */}
                  {assignment.document_url && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      <span>Document uploaded</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: assignment.status === 'draft' ? '20%' : 
                               assignment.status === 'submitted' ? '60%' : 
                               assignment.status === 'approved' ? '100%' : 
                               assignment.status === 'rejected' ? '40%' : '80%'
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {assignments?.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No assignments found</h3>
            <p className="text-slate-500 mb-4">Generate new compliance assignments to get started</p>
            <Button
              onClick={() => generateAssignments.mutate()}
              disabled={generateAssignments.isPending}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
            >
              Generate Assignments
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceAssignmentEngine;
