import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// const normalizeDate = (date: string | Date) => {
//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);
//   return d;
// };



const TATMetrics = () => {
  const queryClient = useQueryClient();

  const { data: tatData, isLoading } = useQuery({
    queryKey: ['tat-metrics'],
    queryFn: async () => {
      // Run Supabase queries in parallel
      console.log("🔄 Fetching TAT metrics...");
      const [
        { data: tatMetrics, error: tatError },
        { data: assignments, error: assignmentsError },
        { data: departments, error: deptError }
      ] = await Promise.all([
        supabase.rpc('calculate_tat_metrics'),
        supabase.from("compliance_assignments").select(`
          id,
          due_date,
          status,
          compliance:compliances(id, name, department_code),
          assigned_employee:employees!compliance_assignments_assigned_to_fkey(
            id,
            name,
            email,
            profile:profiles(full_name)
          ),
          checker_employee:employees!compliance_assignments_checker_id_fkey(
            id,
            name,
            email,
            profile:profiles(full_name)
          )
        `),
        supabase.from('departments').select('*')
      ]);

   if (tatError) {
        console.error("❌ Error fetching tatMetrics:", tatError);
        throw tatError;
      }
      if (assignmentsError) {
        console.error("❌ Error fetching assignments:", assignmentsError);
        throw assignmentsError;
      }
      if (deptError) {
        console.error("❌ Error fetching departments:", deptError);
        throw deptError;
      }

      console.log("✅ Supabase Data:", { tatMetrics, assignments, departments });
    

      if (tatError) throw tatError;
      if (assignmentsError) throw assignmentsError;
      if (deptError) throw deptError;

      const metrics = (tatMetrics && tatMetrics[0]) || {
        total_assignments: 0,
        overdue_count: 0,
        tat_breaches: 0,
        avg_days_overdue: 0
      };

      // Department TAT
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const normalizeDate = (date: string | Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
      };


      // const departmentTAT = departments.map(dept => {
      //   const deptAssignments = assignments.filter(a =>
      //     a.compliance?.department_code === dept.code
      //   );



      //   const deptOverdue = deptAssignments.filter(a => {
      //     const dueDate = normalizeDate(a.due_date);
      //     return dueDate < today && a.status !== 'approved';
      //   });


console.log("📌 Departments:", departments);
console.log("📌 Assignments:", assignments);

const uniqueDeptCodes = [...new Set(assignments.map(a => a.compliance?.department_code))];
const departmentTAT = uniqueDeptCodes.map(code => {
  // Find department name if exists, fallback to code
  const deptObj = departments.find(d => d.code === code);
  const deptName = deptObj?.name || code;

  const deptAssignments = assignments.filter(a => a.compliance?.department_code === code);

  console.log(`📌 Dept: ${deptName} - Assignments:`, deptAssignments);

  const deptOverdue = deptAssignments.filter(a => {
    const dueDate = normalizeDate(a.due_date);
    const isOverdue = dueDate < today && a.status !== 'approved';
    if (isOverdue) {
      console.log(`⏰ Overdue Task:`, a);
    }
    return isOverdue;
  });

  const performance = deptAssignments.length > 0
    ? Math.round(((deptAssignments.length - deptOverdue.length) / deptAssignments.length) * 100)
    : 100;

  const avgTAT = deptOverdue.length > 0
    ? Number((deptOverdue.reduce((sum, a) => {
        const daysDiff = Math.ceil(
          (today.getTime() - normalizeDate(a.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + daysDiff;
      }, 0) / deptOverdue.length).toFixed(1))
    : 0;

  console.log(`✅ Dept Summary: ${deptName}`, { avgTAT, slaBreaches: deptOverdue.length, performance });

  return {
    dept: deptName,
    avgTAT,
    slaBreaches: deptOverdue.length,
    performance
  };
});

console.log("📊 Department TAT Calculated:", departmentTAT);



      // Upcoming deadlines
      const upcomingDeadlines = assignments
        .filter(a => normalizeDate(a.due_date) >= today && a.status !== 'approved')
        .sort((a, b) => normalizeDate(a.due_date).getTime() - normalizeDate(b.due_date).getTime())
        .slice(0, 10)
        .map(a => {
          const dueDate = normalizeDate(a.due_date);
          const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const dept = departments.find(d => d.code === a.compliance?.department_code);

          return {
            id: a.id,
            task: a.compliance?.name || 'Compliance Task',
            dept: dept?.name || 'Unknown',
            daysLeft,
            priority: daysLeft === 0 ? 'critical' as const :
              daysLeft <= 1 ? 'high' as const :
              daysLeft <= 3 ? 'medium' as const : 'low' as const
          };
        });

      const dueTodayCount = upcomingDeadlines.filter(item => item.daysLeft === 0).length;

      const totalAssignments = Number(metrics.total_assignments);
      const slaCompliance = totalAssignments > 0
        ? Math.round(((totalAssignments - Number(metrics.tat_breaches)) / totalAssignments) * 100)
        : 0; // changed from 100 → 0 (avoid misleading)

      return {
        overallTAT: {
          average: Number(metrics.avg_days_overdue).toFixed(1),
          target: 2.5,
          performance: Math.min(100, Math.max(0, 100 - Number(metrics.avg_days_overdue) * 10)),
          trend: Number(metrics.avg_days_overdue) > 2.5 ? 'up' : 'down'
        },
        slaCompliance: {
          rate: slaCompliance,
          target: 95,
          breaches: Number(metrics.tat_breaches),
          totalCompliances: totalAssignments
        },
        departmentTAT,
        upcomingDeadlines,
        dueTodayCount
      };
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel('tat-metrics-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'compliance_assignments' },
        () => queryClient.invalidateQueries({ queryKey: ['tat-metrics'] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}
            className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-700 to-teal-500 border-teal-100 cursor-pointer animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // No data
  if (!tatData || tatData.slaCompliance.totalCompliances === 0) {
    return (
      <div className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-700 to-teal-500 border-teal-100 cursor-pointer space-y-8 bg-gray-50 p-6">
        <Card className="bg-white border-gray-200 text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Clock className="h-16 w-16 text-gray-400" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No TAT Data Available</h3>
                <p className="text-gray-600 mb-4">
                  TAT metrics will appear here once you have compliance assignments.
                </p>
                <p className="text-sm text-gray-500">
                  Create some compliance assignments to start tracking TAT performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gray-50 p-6">
      {/* TAT Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Average TAT */}
        <Card className="hover:shadow-lg transition-all duration-300 bg-white border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-700">Average TAT</CardTitle>
              </div>
              <Badge variant={tatData.overallTAT.trend === 'up' ? 'destructive' : 'default'} className="text-xs">
                {tatData.overallTAT.trend === 'up'
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-700 mb-1">{tatData.overallTAT.average} days</div>
            <div className="text-xs text-blue-600 mb-3">Target: {tatData.overallTAT.target} days</div>
            <Progress value={tatData.overallTAT.performance} className="h-2" />
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card className="hover:shadow-lg transition-all duration-300 bg-white border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-700">SLA Compliance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-700 mb-1">{tatData.slaCompliance.rate}%</div>
            <div className="text-xs text-blue-600 mb-3">Target: {tatData.slaCompliance.target}%</div>
            <Progress value={tatData.slaCompliance.rate} className="h-2" />
          </CardContent>
        </Card>

        {/* SLA Breaches */}
        <Card className="hover:shadow-lg transition-all duration-300 bg-white border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-500 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-700">SLA Breaches</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-700 mb-1">{tatData.slaCompliance.breaches}</div>
            <div className="text-xs text-red-600">Out of {tatData.slaCompliance.totalCompliances} total</div>
          </CardContent>
        </Card>

        {/* Due Today */}
        <Card className="hover:shadow-lg transition-all duration-300 bg-white border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-500 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-700">Due Today</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-700 mb-1">{tatData.dueTodayCount}</div>
            <div className="text-xs text-gray-600">Require immediate action</div>
          </CardContent>
        </Card>
      </div>

      {/* Department TAT Performance */}
      <Card className="hover:shadow-lg transition-all duration-300 bg-white border-gray-200">
        <CardHeader className="pb-4 bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-bold text-gray-800">Department TAT Performance</CardTitle>
          <CardDescription className="text-gray-600">Average turnaround time and SLA performance by department</CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="grid gap-4">
            {tatData.departmentTAT.map(dept => (
              <div key={dept.dept} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 truncate">{dept.dept}</h4>
                    <Badge variant={dept.performance >= 85 ? 'default' : dept.performance >= 70 ? 'secondary' : 'destructive'}>
                      {dept.performance}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                    <span>Avg TAT: <strong>{dept.avgTAT} days</strong></span>
                    <span>SLA Breaches: <strong className="text-red-600">{dept.slaBreaches}</strong></span>
                  </div>
                  <Progress value={dept.performance} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card className="hover:shadow-lg transition-all duration-300 bg-white border-gray-200">
        <CardHeader className="pb-4 bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg font-bold text-gray-800">Upcoming Deadlines</CardTitle>
          <CardDescription className="text-gray-600">Critical compliance tasks requiring attention</CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="grid gap-3">
            {tatData.upcomingDeadlines.map(deadline => (
              <div key={deadline.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-l-blue-500">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate mb-1">{deadline.task}</h4>
                  <p className="text-sm text-gray-600">{deadline.dept}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {deadline.daysLeft === 0 ? 'Due Today' : `${deadline.daysLeft} days left`}
                    </div>
                  </div>
                  <Badge
                    variant={
                      deadline.priority === 'critical' ? 'destructive' :
                        deadline.priority === 'high' ? 'secondary' : 'outline'
                    }
                    className="whitespace-nowrap"
                  >
                    {deadline.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TATMetrics;
