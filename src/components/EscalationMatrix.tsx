
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, User, ArrowUp, Mail } from "lucide-react";

interface EscalationItem {
  id: string;
  compliance_name: string;
  assigned_to: string;
  checker_id: string;
  due_date: string;
  status: string;
  escalation_level: number;
  days_overdue: number;
  escalated_to: string[];
  escalation_history: Array<{
    level: number;
    escalated_to: string;
    escalated_at: string;
    reason: string;
  }>;
  maker: {
    name: string;
    email: string;
    supervisor: string;
  };
  department: {
    name: string;
    head: string;
  };
}

const EscalationMatrix = () => {
  // Mock data for escalation items until the new tables are fully synced
  const { data: items, isLoading } = useQuery({
    queryKey: ['escalation-items'],
    queryFn: async () => {
      const mockItems: EscalationItem[] = [
        {
          id: '1',
          compliance_name: 'Suspicious Transaction Report (STR)',
          assigned_to: 'emp-1',
          checker_id: 'emp-2',
          due_date: '2024-07-05',
          status: 'escalated',
          escalation_level: 2,
          days_overdue: 3,
          escalated_to: ['supervisor', 'department_head'],
          escalation_history: [
            {
              level: 1,
              escalated_to: 'John Supervisor',
              escalated_at: '2024-07-06T10:00:00Z',
              reason: '1 day overdue'
            },
            {
              level: 2,
              escalated_to: 'Department Head',
              escalated_at: '2024-07-08T10:00:00Z',
              reason: '3 days overdue'
            }
          ],
          maker: {
            name: 'John Doe',
            email: 'john.doe@bank.com',
            supervisor: 'John Supervisor'
          },
          department: {
            name: 'Credit Risk Management',
            head: 'Mike Johnson'
          }
        },
        {
          id: '2',
          compliance_name: 'NPA Classification Report',
          assigned_to: 'emp-3',
          checker_id: 'emp-4',
          due_date: '2024-07-01',
          status: 'escalated',
          escalation_level: 3,
          days_overdue: 7,
          escalated_to: ['supervisor', 'department_head', 'compliance_officer'],
          escalation_history: [
            {
              level: 1,
              escalated_to: 'Supervisor',
              escalated_at: '2024-07-02T10:00:00Z',
              reason: '1 day overdue'
            },
            {
              level: 2,
              escalated_to: 'Department Head',
              escalated_at: '2024-07-04T10:00:00Z',
              reason: '3 days overdue'
            },
            {
              level: 3,
              escalated_to: 'Compliance Officer',
              escalated_at: '2024-07-06T10:00:00Z',
              reason: '5 days overdue'
            }
          ],
          maker: {
            name: 'Alice Johnson',
            email: 'alice.johnson@bank.com',
            supervisor: 'Bob Supervisor'
          },
          department: {
            name: 'Credit Risk Management',
            head: 'Mike Johnson'
          }
        }
      ];
      
      return mockItems;
    },
    refetchInterval: 60000
  });

  const getEscalationLevel = (daysOverdue: number) => {
    if (daysOverdue >= 5) return 3; // CXO Level
    if (daysOverdue >= 3) return 2; // Department Head
    if (daysOverdue >= 1) return 1; // Supervisor
    return 0; // No escalation
  };

  const getEscalationTarget = (level: number, item: EscalationItem) => {
    switch (level) {
      case 1: return item.maker.supervisor;
      case 2: return item.department.head;
      case 3: return 'Compliance Officer / CXO';
      default: return 'No escalation';
    }
  };

  const getUrgencyColor = (level: number) => {
    switch (level) {
      case 3: return 'text-red-600 bg-red-50 border-red-200';
      case 2: return 'text-orange-600 bg-orange-50 border-orange-200';
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
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
            Escalation Matrix
          </h1>
          <p className="text-slate-600">Monitor and manage overdue compliance items</p>
        </div>

        {/* Escalation Rules */}
        <Card className="mb-8 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Escalation Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-semibold text-yellow-800">Level 1</span>
                </div>
                <p className="text-sm text-yellow-700">1+ days overdue → Immediate Supervisor</p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-semibold text-orange-800">Level 2</span>
                </div>
                <p className="text-sm text-orange-700">3+ days overdue → Department Head</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-red-800">Level 3</span>
                </div>
                <p className="text-sm text-red-700">5+ days overdue → Compliance Officer/CXO</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escalated Items */}
        <div className="space-y-6">
          {items?.map((item) => {
            const escalationLevel = getEscalationLevel(item.days_overdue);
            const escalationTarget = getEscalationTarget(escalationLevel, item);
            const urgencyColor = getUrgencyColor(escalationLevel);
            
            return (
              <Card 
                key={item.id}
                className={`border-l-4 ${urgencyColor} hover:shadow-xl transition-all duration-300`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-800">
                        {item.compliance_name}
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        {item.department.name} • Assigned to: {item.maker.name}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-2">
                        {item.days_overdue} days overdue
                      </Badge>
                      <div className="text-sm text-slate-600">
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Escalation Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        Escalation Level: {escalationLevel}/3
                      </span>
                      <span className="text-sm text-slate-600">
                        Current: {escalationTarget}
                      </span>
                    </div>
                    <Progress 
                      value={(escalationLevel / 3) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Escalation Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border ${escalationLevel >= 1 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowUp className={`h-4 w-4 ${escalationLevel >= 1 ? 'text-yellow-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">Level 1</span>
                      </div>
                      <p className="text-xs text-slate-600">Supervisor</p>
                      <p className="text-xs font-medium">{item.maker.supervisor}</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${escalationLevel >= 2 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowUp className={`h-4 w-4 ${escalationLevel >= 2 ? 'text-orange-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">Level 2</span>
                      </div>
                      <p className="text-xs text-slate-600">Department Head</p>
                      <p className="text-xs font-medium">{item.department.head}</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${escalationLevel >= 3 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowUp className={`h-4 w-4 ${escalationLevel >= 3 ? 'text-red-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">Level 3</span>
                      </div>
                      <p className="text-xs text-slate-600">CXO Level</p>
                      <p className="text-xs font-medium">Compliance Officer</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Reassign
                    </Button>
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Extend Deadline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {items?.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No escalated items</h3>
            <p className="text-slate-500">All compliance items are on track!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscalationMatrix;
