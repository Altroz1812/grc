
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, AlertTriangle, CheckCircle, TrendingUp, Clock, XCircle } from "lucide-react";
import { format, addDays, isPast, isToday, isTomorrow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ComplianceMetrics {
  upcoming: number;
  overdue: number;
  onTime: number;
  escalated: number;
  totalActive: number;
  slaBreaches: number;
  weeklyTrend: number;
}

interface ComplianceSummaryCardsProps {
  onModuleChange?: (module: string) => void;
}

const ComplianceSummaryCards: React.FC<ComplianceSummaryCardsProps> = ({ onModuleChange }) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: async () => {
      try {
        // Fetch real data from compliance_assignments
        const { data: assignments, error } = await supabase
          .from('compliance_assignments')
          .select('*');

        if (error) throw error;

        const now = new Date();
        const upcoming = assignments?.filter(a => 
          new Date(a.due_date) > now && 
          new Date(a.due_date) <= addDays(now, 7) && 
          a.status !== 'approved'
        ).length || 0;

        const overdue = assignments?.filter(a => 
          new Date(a.due_date) < now && 
          a.status !== 'approved'
        ).length || 0;

        const onTime = assignments?.filter(a => 
          a.status === 'approved'
        ).length || 0;

        const escalated = assignments?.filter(a => 
          a.status === 'escalated'
        ).length || 0;

        const totalActive = assignments?.length || 0;

        const slaBreaches = assignments?.filter(a => 
          new Date(a.due_date) < addDays(now, -2) && 
          a.status !== 'approved'
        ).length || 0;

        const weeklyTrend = Math.random() * 20 - 10; // Placeholder for trend calculation

        const realMetrics: ComplianceMetrics = {
          upcoming,
          overdue,
          onTime,
          escalated,
          totalActive,
          slaBreaches,
          weeklyTrend
        };
        
        console.log('Real compliance metrics:', realMetrics);
        return realMetrics;
      } catch (error) {
        console.error('Error fetching compliance metrics:', error);
        // Fallback to dummy data if error
        return {
          upcoming: 0,
          overdue: 0,
          onTime: 0,
          escalated: 0,
          totalActive: 0,
          slaBreaches: 0,
          weeklyTrend: 0
        };
      }
    },
    refetchInterval: 30000
  });

  const { data: recentTasks } = useQuery({
    queryKey: ['recent-compliance-tasks'],
    queryFn: async () => {
      try {
        // Fetch real recent tasks
        const { data: assignments, error } = await supabase
          .from('compliance_assignments')
          .select(`
            *,
            compliance:compliances(*)
          `)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        return assignments?.map(assignment => ({
          id: assignment.id,
          name: assignment.compliance?.name || 'Compliance Task',
          due_date: assignment.due_date,
          status: assignment.status === 'approved' ? 'completed' : 
                  new Date(assignment.due_date) < new Date() ? 'overdue' : 'upcoming',
          department: assignment.compliance?.department_code || 'General',
          priority: new Date(assignment.due_date) < addDays(new Date(), 1) ? 'critical' : 
                   new Date(assignment.due_date) < addDays(new Date(), 3) ? 'high' : 'medium'
        })) || [];
      } catch (error) {
        console.error('Error fetching recent tasks:', error);
        return [];
      }
    }
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Upcoming Compliances */}
        <Card 
          className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50 border-blue-100 animate-scale-in cursor-pointer"
          onClick={() => onModuleChange?.('calendar')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Upcoming Compliances</CardTitle>
            <CalendarIcon className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{metrics.upcoming}</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Click to view calendar
            </div>
          </CardContent>
        </Card>

        {/* Overdue Compliances */}
        <Card 
          className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-red-50 border-red-100 animate-scale-in [animation-delay:100ms] cursor-pointer"
          onClick={() => onModuleChange?.('workflow')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Overdue Compliances</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{metrics.overdue}</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              Click to view tasks
            </div>
          </CardContent>
        </Card>

        {/* On-Time Submissions */}
        <Card 
          className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-green-50 border-green-100 animate-scale-in [animation-delay:200ms] cursor-pointer"
          onClick={() => onModuleChange?.('reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">On-Time Submissions</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{metrics.onTime}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Click for reports
            </div>
          </CardContent>
        </Card>

        {/* Escalated Cases */}
        <Card 
          className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50 border-orange-100 animate-scale-in [animation-delay:300ms] cursor-pointer"
          onClick={() => onModuleChange?.('workflow')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Escalated Cases</CardTitle>
            <XCircle className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{metrics.escalated}</div>
            <div className="flex items-center text-xs text-orange-600 mt-1">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Click to review
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card 
          className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50 border-purple-100 cursor-pointer"
          onClick={() => onModuleChange?.('reports')}
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
              SLA Performance
            </CardTitle>
            <CardDescription className="text-slate-600">Service Level Agreement tracking - Click for detailed reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">SLA Compliance Rate</span>
                <span className="text-2xl font-bold text-purple-700">
                  {metrics.totalActive > 0 ? (((metrics.totalActive - metrics.slaBreaches) / metrics.totalActive) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.totalActive > 0 ? ((metrics.totalActive - metrics.slaBreaches) / metrics.totalActive) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Breaches: {metrics.slaBreaches}</span>
                <span>Total: {metrics.totalActive}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-teal-50 border-teal-100 cursor-pointer"
          onClick={() => onModuleChange?.('workflow')}
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-slate-600">Latest compliance tasks - Click to view workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks && recentTasks.length > 0 ? (
                recentTasks.map((task, index) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-800 truncate">{task.name}</h4>
                      <p className="text-xs text-slate-600">{task.department}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={task.status === 'overdue' ? 'destructive' : task.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.status === 'overdue' ? 'Overdue' : 
                         task.status === 'completed' ? 'Completed' :
                         isToday(new Date(task.due_date)) ? 'Today' :
                         isTomorrow(new Date(task.due_date)) ? 'Tomorrow' : 
                         format(new Date(task.due_date), 'MMM dd')}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No recent tasks found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplianceSummaryCards;
