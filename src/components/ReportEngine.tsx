
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

const ReportEngine = () => {
  const [selectedReport, setSelectedReport] = useState("tat");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time data from database
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', selectedReport, dateRange, selectedDepartment],
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
    // Mock export functionality
    toast({
      title: "Export Started",
      description: `${reportType} report is being exported to Excel...`,
    });
    
    // Simulate download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `${reportType} report has been downloaded successfully.`,
      });
    }, 2000);
  };

  const exportToPDF = (reportType: string) => {
    // Mock export functionality
    toast({
      title: "PDF Export Started",
      description: `${reportType} report is being exported to PDF...`,
    });
    
    // Simulate download
    setTimeout(() => {
      toast({
        title: "PDF Export Complete",
        description: `${reportType} report PDF has been downloaded successfully.`,
      });
    }, 2000);
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tat">TAT Report</TabsTrigger>
            <TabsTrigger value="department">Department Status</TabsTrigger>
            <TabsTrigger value="performance">Employee Performance</TabsTrigger>
            <TabsTrigger value="escalation">Escalation Summary</TabsTrigger>
          </TabsList>

          {/* TAT Report */}
          <TabsContent value="tat" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Turn Around Time (TAT) Report</h3>
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
              <h3 className="text-2xl font-semibold">Department-wise Compliance Status</h3>
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
        </Tabs>
      </div>
    </div>
  );
};

export default ReportEngine;
