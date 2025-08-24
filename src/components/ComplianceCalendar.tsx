
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Filter, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format, isSameDay, isPast, isToday, addDays } from "date-fns";

interface ComplianceTask {
  id: string;
  compliance_id: string;
  due_date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'escalated';
  maker_remarks?: string;
  checker_remarks?: string;
  document_url?: string;
  escalation_level?: number;
  created_at: string;
  compliance?: {
    name: string;
    frequency: string;
    category: string;
    department_code: string;
  };
  assigned_profile?: {
    full_name: string;
    email: string;
  };
  checker_profile?: {
    full_name: string;
    email: string;
  };
  department?: {
    name: string;
  };
}

const ComplianceCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [calendarView, setCalendarView] = useState<'month' | 'list'>('month');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch departments for filter
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch compliance tasks from Supabase
  const { data: complianceTasks, isLoading } = useQuery({
    queryKey: ['compliance-tasks', filterDepartment, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('compliance_assignments')
        .select(`
          *,
          compliance:compliances(*),
          assigned_profile:employees!compliance_assignments_assigned_to_fkey(name, email),
          checker_profile:employees!compliance_assignments_checker_id_fkey(name, email)
        `)
        .order('due_date', { ascending: true });

      // Apply filters
      if (filterDepartment !== 'all') {
        query = query.eq('compliance.department_code', filterDepartment);
      }
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform and add department info
      const tasksWithDept = await Promise.all(
        (data || []).map(async (task) => {
          const transformedTask = {
            ...task,
            assigned_profile: task.assigned_profile && Array.isArray(task.assigned_profile) && task.assigned_profile.length > 0
              ? { full_name: task.assigned_profile[0].name, email: task.assigned_profile[0].email }
              : null,
            checker_profile: task.checker_profile && Array.isArray(task.checker_profile) && task.checker_profile.length > 0
              ? { full_name: task.checker_profile[0].name, email: task.checker_profile[0].email }
              : null
          };

          if (task.compliance?.department_code) {
            const { data: dept } = await supabase
              .from('departments')
              .select('name')
              .eq('code', task.compliance.department_code)
              .single();
            
            return {
              ...transformedTask,
              department: dept
            };
          }
          return transformedTask;
        })
      );

      return tasksWithDept as ComplianceTask[];
    },
    refetchInterval: 30000
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_assignments'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['compliance-tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const getTasksForDate = (date: Date) => {
    return complianceTasks?.filter(task => 
      isSameDay(new Date(task.due_date), date)
    ) || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'approved': return 'bg-blue-100 text-blue-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'escalated': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (dueDate: string, status: string) => {
    if (status === 'approved') return 'text-green-600';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 1) return 'text-orange-600';
    if (diffDays <= 3) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'escalated': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const selectedDateTasks = getTasksForDate(selectedDate);
  const statuses = ['draft', 'submitted', 'approved', 'rejected', 'escalated'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
   // <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 p-8">
      <div className="min-h-screen hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-620 to-blue-800 border-teal-100 p-8">

     <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Compliance Calendar
          </h1>
          <p className="text-slate-600">Visual task management and scheduling</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map(dept => (
                  <SelectItem key={dept.code} value={dept.code}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={calendarView === 'month' ? 'default' : 'outline'}
              onClick={() => setCalendarView('month')}
              size="sm"
            >
              Calendar View
            </Button>
            <Button
              variant={calendarView === 'list' ? 'default' : 'outline'}
              onClick={() => setCalendarView('list')}
              size="sm"
            >
              List View
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-teal-50 border-teal-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                  <CalendarIcon className="h-5 w-5 text-teal-600" />
                  {calendarView === 'month' ? 'Calendar View' : 'List View'}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {calendarView === 'month' 
                    ? 'Click on dates to view compliance tasks' 
                    : 'All compliance tasks in chronological order'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calendarView === 'month' ? (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="w-full"
                    components={{
                      Day: ({ date, ...props }) => {
                        const tasksForDate = getTasksForDate(date);
                        const hasOverdue = tasksForDate.some(task => 
                          new Date(task.due_date) < new Date() && task.status !== 'approved'
                        );
                        const hasToday = isToday(date);
                        const hasUpcoming = tasksForDate.length > 0 && !hasOverdue;
                        
                        return (
                          <div className="relative">
                            <button
                              {...props}
                              className={`w-full h-10 text-sm rounded-md hover:bg-teal-100 transition-colors ${
                                hasToday ? 'bg-teal-200 font-bold text-teal-900' :
                                hasOverdue ? 'bg-red-100 text-red-900' :
                                hasUpcoming ? 'bg-blue-100 text-blue-900' : ''
                              }`}
                            >
                              {format(date, 'd')}
                              {tasksForDate.length > 0 && (
                                <div className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {tasksForDate.length}
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      }
                    }}
                  />
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {complianceTasks?.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(task.status)}
                          <div>
                            <h4 className="font-medium text-slate-800">{task.compliance?.name || 'Compliance Task'}</h4>
                            <p className="text-sm text-slate-600">
                              {task.department?.name || 'Unknown Dept'} • {task.assigned_profile?.full_name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <span className={`text-sm font-medium ${getPriorityColor(task.due_date, task.status)}`}>
                            {format(new Date(task.due_date), 'MMM dd')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Tasks */}
          <div>
            <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-cyan-50 border-cyan-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  {format(selectedDate, 'MMMM dd, yyyy')}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''} scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedDateTasks.length > 0 ? (
                    selectedDateTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-800 text-sm">{task.compliance?.name || 'Compliance Task'}</h4>
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="space-y-1 text-xs text-slate-600">
                          <p><span className="font-medium">Department:</span> {task.department?.name || 'Unknown'}</p>
                          <p><span className="font-medium">Assigned to:</span> {task.assigned_profile?.full_name || 'Unassigned'}</p>
                          <p><span className="font-medium">Category:</span> {task.compliance?.category || 'General'}</p>
                        </div>
                        <div className="mt-2">
                          <Badge className={`${getStatusColor(task.status)} text-xs`}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                      <p>No tasks scheduled for this date</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceCalendar;
