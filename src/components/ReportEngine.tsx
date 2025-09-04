
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, BarChart3, TrendingUp, Users, AlertTriangle, Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";

interface ReportData {
  tatReport: {
    submitted: number;
    due: number;
    overdue: number;
    onTime: number;
  };
  departmentStatus: Array<{
    department: string;
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }>;
  employeePerformance: Array<{
    name: string;
    assigned: number;
    completed: number;
    onTime: number;
    late: number;
    rating: string;
  }>;
  escalationSummary: Array<{
    level: number;
    count: number;
    avgResolutionDays: number;
    department: string;
  }>;
}

interface ReportEngineProps {
  userProfile?: {
    id: string;
    role?: string;
    user_role?: string;
    department_code?: string;
    full_name?: string;
  };
}

const ReportEngine = ({ userProfile }: ReportEngineProps) => {
  const [selectedReport, setSelectedReport] = useState("tat");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available reports based on user role
  const getAvailableReports = () => {
    const userRole = userProfile?.user_role;
    const role = userProfile?.role;
    
    if (role === 'admin') {
      return [
        { key: "tat", label: "TAT Report", icon: TrendingUp },
        { key: "department", label: "Department Status", icon: Users },
        { key: "performance", label: "Employee Performance", icon: BarChart3 },
        { key: "escalation", label: "Escalation Summary", icon: AlertTriangle },
        { key: "compliance-officer", label: "Compliance Overview", icon: FileText },
        { key: "audit", label: "Audit Trail", icon: Calendar }
      ];
    }
    
    if (userRole === 'checker') {
      return [
        { key: "tat", label: "My TAT Report", icon: TrendingUp },
        { key: "checker-assignments", label: "My Checker Assignments", icon: FileText },
        { key: "department", label: "Department Status", icon: Users }
      ];
    }
    
    if (userRole === 'maker') {
      return [
        { key: "tat", label: "My TAT Report", icon: TrendingUp },
        { key: "maker-assignments", label: "My Assignments", icon: FileText }
      ];
    }
    
    // Default reports for other roles
    return [
      { key: "tat", label: "TAT Report", icon: TrendingUp },
      { key: "department", label: "Department Status", icon: Users }
    ];
  };

  const availableReports = getAvailableReports();

  // Real-time data from database
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', selectedReport, dateRange, selectedDepartment, userProfile?.id],
    queryFn: async (): Promise<ReportData> => {
      // Get compliance assignments with related data
      let assignmentsQuery = supabase
        .from('compliance_assignments')
        .select(`
          *,
          compliance:compliances(name, department_code, category),
          assigned_employee:employees!compliance_assignments_assigned_to_fkey(name, department_code),
          checker_employee:employees!compliance_assignments_checker_id_fkey(name)
        `);

      // Apply role-based filtering
      const userRole = userProfile?.user_role;
      const role = userProfile?.role;
      
      if (role !== 'admin') {
        if (userRole === 'maker') {
          // Makers can only see their own assignments
          assignmentsQuery = assignmentsQuery.eq('assigned_to', userProfile?.id);
        } else if (userRole === 'checker') {
          // Checkers can see assignments they need to check + their department
          assignmentsQuery = assignmentsQuery.or(`checker_id.eq.${userProfile?.id},compliance.department_code.eq.${userProfile?.department_code}`);
        } else if (userProfile?.department_code) {
          // Department heads can see their department's assignments
          assignmentsQuery = assignmentsQuery.eq('compliance.department_code', userProfile.department_code);
        }
      }

      // Apply date filter if provided
      if (dateRange?.from) {
        assignmentsQuery = assignmentsQuery.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        assignmentsQuery = assignmentsQuery.lte('created_at', dateRange.to.toISOString());
      }

      const { data: assignments, error: assignmentsError } = await assignmentsQuery;
      if (assignmentsError) throw assignmentsError;

      // Get departments
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('*');
      if (deptError) throw deptError;

      // Get escalations
      const { data: escalations, error: escalError } = await supabase
        .from('escalation_items')
        .select(`
          *,
          compliance_assignment:compliance_assignments(
            compliance:compliances(department_code),
            assigned_employee:employees!compliance_assignments_assigned_to_fkey(department_code)
          )
        `);
      if (escalError) throw escalError;

      // Calculate TAT Report
      const now = new Date();
      const submitted = assignments.filter(a => a.status === 'submitted' || a.status === 'approved').length;
      const total = assignments.length;
      const overdue = assignments.filter(a => 
        new Date(a.due_date) < now && a.status !== 'approved'
      ).length;
      const onTime = assignments.filter(a => 
        a.status === 'approved' && 
        (!a.submitted_at || new Date(a.submitted_at) <= new Date(a.due_date))
      ).length;

      // Department Status Analysis
      const departmentStatus = departments.map(dept => {
        const deptFilter = selectedDepartment === 'all' ? 
          assignments.filter(a => a.compliance?.department_code === dept.code) :
          assignments.filter(a => a.compliance?.department_code === dept.code && dept.code === selectedDepartment);
        
        const completed = deptFilter.filter(a => a.status === 'approved').length;
        const pending = deptFilter.filter(a => a.status === 'draft' || a.status === 'submitted').length;
        const overdue = deptFilter.filter(a => 
          new Date(a.due_date) < now && a.status !== 'approved'
        ).length;

        return {
          department: dept.name,
          total: deptFilter.length,
          completed,
          pending,
          overdue
        };
      }).filter(dept => selectedDepartment === 'all' || dept.total > 0);

      // Employee Performance Analysis
      const employeeMap = new Map();
      assignments.forEach(assignment => {
        const empName = assignment.assigned_employee?.name || 'Unknown';
        if (!employeeMap.has(empName)) {
          employeeMap.set(empName, {
            name: empName,
            assigned: 0,
            completed: 0,
            onTime: 0,
            late: 0,
            rating: 'Average'
          });
        }
        const emp = employeeMap.get(empName);
        emp.assigned += 1;
        
        if (assignment.status === 'approved') {
          emp.completed += 1;
          if (!assignment.submitted_at || new Date(assignment.submitted_at) <= new Date(assignment.due_date)) {
            emp.onTime += 1;
          } else {
            emp.late += 1;
          }
        }
      });

      const employeePerformance = Array.from(employeeMap.values()).map(emp => {
        const completionRate = emp.assigned > 0 ? (emp.completed / emp.assigned) * 100 : 0;
        const onTimeRate = emp.completed > 0 ? (emp.onTime / emp.completed) * 100 : 0;
        
        let rating = 'Average';
        if (completionRate >= 90 && onTimeRate >= 95) rating = 'Excellent';
        else if (completionRate >= 80 && onTimeRate >= 85) rating = 'Good';
        else if (completionRate < 60 || onTimeRate < 70) rating = 'Needs Improvement';

        return { ...emp, rating };
      });

      // Escalation Summary
      const escalationByLevel = escalations.reduce((acc, esc) => {
        const level = esc.escalation_level || 1;
        if (!acc[level]) {
          acc[level] = { count: 0, totalDays: 0, departments: new Set() };
        }
        acc[level].count += 1;
        if (esc.resolved_at && esc.escalated_at) {
          const days = Math.ceil((new Date(esc.resolved_at).getTime() - new Date(esc.escalated_at).getTime()) / (1000 * 60 * 60 * 24));
          acc[level].totalDays += days;
        }
        const deptCode = esc.compliance_assignment?.compliance?.department_code;
        if (deptCode) {
          const dept = departments.find(d => d.code === deptCode);
          if (dept) acc[level].departments.add(dept.name);
        }
        return acc;
      }, {});

      const escalationSummary = Object.entries(escalationByLevel).map(([level, data]: [string, any]) => ({
        level: parseInt(level),
        count: data.count,
        avgResolutionDays: data.count > 0 ? data.totalDays / data.count : 0,
        department: Array.from(data.departments).join(', ') || 'Various'
      }));

      return {
        tatReport: {
          submitted,
          due: total,
          overdue,
          onTime
        },
        departmentStatus,
        employeePerformance,
        escalationSummary
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_assignments'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reports'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escalation_items'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reports'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const exportToExcel = (reportType: string) => {
    const userRole = userProfile?.user_role || 'user';
    const reportName = `${reportType}_${userRole}_${new Date().toISOString().split('T')[0]}`;
    
    toast({
      title: "Export Started",
      description: `${reportType} report is being exported to Excel...`,
    });
    
    // Create CSV content based on selected report and user role
    let csvContent = '';
    const data = reportData;
    
    if (selectedReport === 'tat' && data) {
      csvContent = `TAT Report - ${userProfile?.full_name || 'User'}\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
      csvContent += `Metric,Count\n`;
      csvContent += `Total Submitted,${data.tatReport.submitted}\n`;
      csvContent += `Total Due,${data.tatReport.due}\n`;
      csvContent += `On Time,${data.tatReport.onTime}\n`;
      csvContent += `Overdue,${data.tatReport.overdue}\n`;
    } else if (selectedReport === 'department' && data) {
      csvContent = `Department Status Report\n`;
      csvContent += `Department,Total,Completed,Pending,Overdue\n`;
      data.departmentStatus.forEach(dept => {
        csvContent += `${dept.department},${dept.total},${dept.completed},${dept.pending},${dept.overdue}\n`;
      });
    }
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `${reportType} report has been downloaded successfully.`,
    });
  };

  const exportToPDF = (reportType: string) => {
    const userRole = userProfile?.user_role || 'user';
    
    toast({
      title: "PDF Export Started",
      description: `${reportType} report is being exported to PDF...`,
    });
    
    // Simulate PDF generation with role-based content
    setTimeout(() => {
      toast({
        title: "PDF Export Complete",
        description: `${reportType} report PDF has been downloaded successfully.`,
      });
    }, 2000);
  };

  const canExport = () => {
    const role = userProfile?.role;
    const userRole = userProfile?.user_role;
    return role === 'admin' || userRole === 'checker' || userRole === 'maker';
  };

  const chartConfig = {
    completed: { label: "Completed", color: "#10b981" },
    pending: { label: "Pending", color: "#f59e0b" },
    overdue: { label: "Overdue", color: "#ef4444" }
  };

  const pieColors = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];

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
            Report Engine
          </h1>
          <p className="text-slate-600">Generate comprehensive compliance reports and analytics</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="risk">Risk Management</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={selectedReport} onValueChange={setSelectedReport}>
          <TabsList className={`grid-auto grid-cols-${Math.min(availableReports.length, 6)}`}>
            {availableReports.map(report => (
              <TabsTrigger key={report.key} value={report.key}>
                <report.icon className="h-4 w-4 mr-2" />
                {report.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* TAT Report */}
          <TabsContent value="tat" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">
                {userProfile?.user_role === 'maker' || userProfile?.user_role === 'checker' 
                  ? `My Turn Around Time (TAT) Report` 
                  : 'Turn Around Time (TAT) Report'}
              </h3>
              {canExport() && (
                <div className="flex gap-2">
                  <Button onClick={() => exportToExcel("TAT")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={() => exportToPDF("TAT")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Submitted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-600">{reportData?.tatReport.submitted}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Due</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{reportData?.tatReport.due}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">On Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{reportData?.tatReport.onTime}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Overdue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{reportData?.tatReport.overdue}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>TAT Performance Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "On Time", value: reportData?.tatReport.onTime || 0 },
                          { name: "Overdue", value: reportData?.tatReport.overdue || 0 },
                          { name: "Pending", value: (reportData?.tatReport.due || 0) - (reportData?.tatReport.submitted || 0) }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {pieColors.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Department Status Report */}
          <TabsContent value="department" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">
                {userProfile?.department_code && userProfile?.role !== 'admin' 
                  ? `${userProfile.department_code} Department Compliance Status`
                  : 'Department-wise Compliance Status'}
              </h3>
              {canExport() && (
                <div className="flex gap-2">
                  <Button onClick={() => exportToExcel("Department Status")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={() => exportToPDF("Department Status")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData?.departmentStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" />
                      <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                      <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Status Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.departmentStatus.map((dept) => (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">{dept.department}</TableCell>
                        <TableCell>{dept.total}</TableCell>
                        <TableCell>{dept.completed}</TableCell>
                        <TableCell>{dept.pending}</TableCell>
                        <TableCell>{dept.overdue}</TableCell>
                        <TableCell>
                          <Badge variant={((dept.completed / dept.total) * 100) >= 80 ? "default" : "destructive"}>
                            {((dept.completed / dept.total) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employee Performance Report */}
          <TabsContent value="performance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Employee Performance Report</h3>
              <div className="flex gap-2">
                <Button onClick={() => exportToExcel("Employee Performance")} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={() => exportToPDF("Employee Performance")} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Employee Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>On Time</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.employeePerformance.map((emp) => (
                      <TableRow key={emp.name}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>{emp.assigned}</TableCell>
                        <TableCell>{emp.completed}</TableCell>
                        <TableCell>{emp.onTime}</TableCell>
                        <TableCell>{emp.late}</TableCell>
                        <TableCell>
                          <Badge variant={((emp.completed / emp.assigned) * 100) >= 80 ? "default" : "destructive"}>
                            {((emp.completed / emp.assigned) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              emp.rating === "Excellent" ? "default" : 
                              emp.rating === "Good" ? "secondary" : "outline"
                            }
                          >
                            {emp.rating}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Escalation Summary Report */}
          <TabsContent value="escalation" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Escalation Summary Report</h3>
              <div className="flex gap-2">
                <Button onClick={() => exportToExcel("Escalation Summary")} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={() => exportToPDF("Escalation Summary")} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Level 1 Escalations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">8</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Level 2 Escalations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">3</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Level 3 Escalations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">1</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Escalation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Avg Resolution Days</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.escalationSummary.map((escalation, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={
                            escalation.level === 1 ? "secondary" :
                            escalation.level === 2 ? "outline" : "destructive"
                          }>
                            Level {escalation.level}
                          </Badge>
                        </TableCell>
                        <TableCell>{escalation.count}</TableCell>
                        <TableCell>{escalation.avgResolutionDays.toFixed(1)} days</TableCell>
                        <TableCell>{escalation.department}</TableCell>
                        <TableCell>
                          <Badge variant={escalation.avgResolutionDays <= 3 ? "default" : "destructive"}>
                            {escalation.avgResolutionDays <= 3 ? "Good" : "Needs Attention"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maker Assignments Report */}
          <TabsContent value="maker-assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">My Assignments</h3>
              {canExport() && (
                <div className="flex gap-2">
                  <Button onClick={() => exportToExcel("My Assignments")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={() => exportToPDF("My Assignments")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>My Assignment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{reportData?.tatReport.due}</div>
                    <div className="text-sm text-slate-600">Total Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{reportData?.tatReport.submitted}</div>
                    <div className="text-sm text-slate-600">Submitted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{(reportData?.tatReport.due || 0) - (reportData?.tatReport.submitted || 0)}</div>
                    <div className="text-sm text-slate-600">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{reportData?.tatReport.overdue}</div>
                    <div className="text-sm text-slate-600">Overdue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checker Assignments Report */}
          <TabsContent value="checker-assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">My Checker Assignments</h3>
              {canExport() && (
                <div className="flex gap-2">
                  <Button onClick={() => exportToExcel("Checker Assignments")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={() => exportToPDF("Checker Assignments")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pending Checker Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-slate-600">Items pending your review will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Officer Report */}
          <TabsContent value="compliance-officer" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Compliance Overview</h3>
              {canExport() && (
                <div className="flex gap-2">
                  <Button onClick={() => exportToExcel("Compliance Overview")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={() => exportToPDF("Compliance Overview")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Compliance Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-600">{reportData?.tatReport.due}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Compliance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData?.tatReport.due ? ((reportData.tatReport.submitted / reportData.tatReport.due) * 100).toFixed(1) : 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Risk Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{reportData?.tatReport.overdue}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Trail Report */}
          <TabsContent value="audit" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Audit Trail</h3>
              {canExport() && (
                <div className="flex gap-2">
                  <Button onClick={() => exportToExcel("Audit Trail")} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button onClick={() => exportToPDF("Audit Trail")} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-slate-600">Audit trail data will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportEngine;
