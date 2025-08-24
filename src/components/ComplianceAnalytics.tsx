import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ComplianceAnalytics = () => {
  const queryClient = useQueryClient();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['compliance-analytics'],
    queryFn: async () => {
      // Get current metrics
      const { data: currentMetrics, error: metricsError } = await supabase
        .from('compliance_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(1);

      if (metricsError) throw metricsError;

      // Get assignments with related data
      const { data: assignments, error: assignmentsError } = await supabase
        .from('compliance_assignments')
        .select(`
          *,
          compliance:compliances(name, department_code, category),
          assigned_profile:profiles!compliance_assignments_assigned_to_fkey(full_name)
        `);

      if (assignmentsError) throw assignmentsError;

      // Get departments
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('*');

      if (deptError) throw deptError;

      // Get historical metrics for trend
      const { data: historicalMetrics, error: histError } = await supabase
        .from('compliance_metrics')
        .select('*')
        .order('metric_date', { ascending: true })
        .limit(6);

      if (histError) throw histError;

      const current = currentMetrics?.[0] || {
        total_compliances: 0,
        completed_compliances: 0,
        pending_compliances: 0,
        overdue_compliances: 0,
        tat_breaches: 0
      };

      // Calculate TAT breaches trend
      const tatTrend = historicalMetrics.map((metric, index) => ({
        month: new Date(metric.metric_date).toLocaleDateString('en', { month: 'short' }),
        breaches: metric.tat_breaches || 0,
        target: 10
      }));

      // Department-wise analysis
      const departmentWise = departments.map(dept => {
        const deptAssignments = assignments.filter(a => 
          a.compliance?.department_code === dept.code
        );
        const completed = deptAssignments.filter(a => a.status === 'approved').length;
        const pending = deptAssignments.filter(a => a.status === 'draft' || a.status === 'submitted').length;
        const overdue = deptAssignments.filter(a => 
          new Date(a.due_date) < new Date() && a.status !== 'approved'
        ).length;
        const tatBreach = deptAssignments.filter(a => 
          new Date(a.due_date) < new Date(Date.now() - 24 * 60 * 60 * 1000) && a.status !== 'approved'
        ).length;

        return {
          department: dept.name,
          total: deptAssignments.length,
          completed,
          pending,
          overdue,
          tatBreach
        };
      });

      // Compliance status distribution
      const statusCounts = {
        completed: assignments.filter(a => a.status === 'approved').length,
        pending: assignments.filter(a => a.status === 'draft' || a.status === 'submitted').length,
        overdue: assignments.filter(a => new Date(a.due_date) < new Date() && a.status !== 'approved').length,
        inReview: assignments.filter(a => a.status === 'submitted').length
      };

      const complianceStatus = [
        { name: 'Completed', value: statusCounts.completed, color: '#10b981' },
        { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
        { name: 'Overdue', value: statusCounts.overdue, color: '#ef4444' },
        { name: 'In Review', value: statusCounts.inReview, color: '#6366f1' }
      ];

      // Priority distribution (mock data as priority isn't in our schema yet)
      const priorityDistribution = [
        { priority: 'Critical', count: Math.floor(statusCounts.overdue * 0.4), color: '#dc2626' },
        { priority: 'High', count: Math.floor(statusCounts.pending * 0.3), color: '#ea580c' },
        { priority: 'Medium', count: Math.floor(statusCounts.pending * 0.5), color: '#ca8a04' },
        { priority: 'Low', count: Math.floor(statusCounts.completed * 0.2), color: '#16a34a' }
      ];

      const previousTatBreaches = historicalMetrics.length > 1 ? 
        historicalMetrics[historicalMetrics.length - 2]?.tat_breaches || 0 : 0;
      
      return {
        tatBreaches: {
          current: current.tat_breaches || 0,
          previous: previousTatBreaches,
          trend: (current.tat_breaches || 0) > previousTatBreaches ? 'up' : 'down',
          percentage: previousTatBreaches > 0 ? 
            Math.round(((current.tat_breaches || 0) - previousTatBreaches) / previousTatBreaches * 100) : 0
        },
        pendingCompliances: {
          total: current.pending_compliances || 0,
          critical: Math.floor((current.pending_compliances || 0) * 0.15),
          high: Math.floor((current.pending_compliances || 0) * 0.35),
          medium: Math.floor((current.pending_compliances || 0) * 0.35),
          low: Math.floor((current.pending_compliances || 0) * 0.15)
        },
        upcomingBreaches: assignments.filter(a => {
          const daysDiff = Math.ceil((new Date(a.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff >= 0 && daysDiff <= 7 && a.status !== 'approved';
        }).length,
        departmentWise,
        tatTrend,
        complianceStatus,
        priorityDistribution
      };
    },
    refetchInterval: 30000
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_assignments'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['compliance-analytics'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_metrics'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['compliance-analytics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-700 to-teal-500 border-teal-100 cursor-pointer grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analyticsData || analyticsData.pendingCompliances.total === 0 && analyticsData.tatBreaches.current === 0) {
    return (
      <div className="space-y-8">
        <Card className="bg-white border-gray-200 text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <TrendingUp className="h-16 w-16 text-gray-400" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Analytics Data Available</h3>
                <p className="text-gray-600 mb-4">
                  Compliance analytics will appear here once you have compliance assignments.
                </p>
                <p className="text-sm text-gray-500">
                  Create some compliance assignments to start viewing analytics and trends.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartConfig = {
    completed: { label: "Completed", color: "#10b981" },
    pending: { label: "Pending", color: "#f59e0b" },
    overdue: { label: "Overdue", color: "#ef4444" },
    tatBreach: { label: "TAT Breach", color: "#dc2626" }
  };

  return (
    <div className="space-y-8">
      {/* TAT Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-danger border-0 shadow-medium">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-red-800">TAT Breaches</CardTitle>
                  <CardDescription className="text-red-600">Current period</CardDescription>
                </div>
              </div>
              <Badge variant="destructive" className="flex items-center gap-1">
                {analyticsData.tatBreaches.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(analyticsData.tatBreaches.percentage)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 mb-2">{analyticsData.tatBreaches.current}</div>
            <div className="text-sm text-red-600">Previous: {analyticsData.tatBreaches.previous}</div>
          </CardContent>
        </Card>

        <Card className="gradient-warning border-0 shadow-medium">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-orange-800">Pending Compliances</CardTitle>
                <CardDescription className="text-orange-600">Awaiting action</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 mb-2">{analyticsData.pendingCompliances.total}</div>
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <span className="text-red-600 font-medium">{analyticsData.pendingCompliances.critical} Critical</span>
              <span>•</span>
              <span>{analyticsData.pendingCompliances.high} High</span>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-primary border-0 shadow-medium">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-blue-800">Upcoming Breaches</CardTitle>
                <CardDescription className="text-blue-600">Risk of TAT breach</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 mb-2">{analyticsData.upcomingBreaches}</div>
            <div className="text-sm text-blue-600">Next 7 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TAT Breach Trend */}
        <Card className="shadow-medium gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <TrendingUp className="h-5 w-5 text-red-500" />
              TAT Breach Trend
            </CardTitle>
            <CardDescription>Historical TAT breaches vs target</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.tatTrend}>
                  <defs>
                    <linearGradient id="breachGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="breaches" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#breachGradient)"
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#targetGradient)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Compliance Status Distribution */}
        <Card className="shadow-medium gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Compliance Status Distribution
            </CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.complianceStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.complianceStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Department-wise Performance */}
        <Card className="shadow-medium gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Building2 className="h-5 w-5 text-blue-500" />
              Department-wise Performance
            </CardTitle>
            <CardDescription>Compliance status by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.departmentWise} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="department" 
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#64748b" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="overdue" fill="#ef4444" name="Overdue" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="tatBreach" fill="#dc2626" name="TAT Breach" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="shadow-medium gradient-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Priority Distribution
            </CardTitle>
            <CardDescription>Task priority breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.priorityDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="priority" type="category" stroke="#64748b" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {analyticsData.priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplianceAnalytics;
