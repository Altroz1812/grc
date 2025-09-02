
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, AlertTriangle, Clock, Calendar, CheckCircle } from "lucide-react";

interface WorkflowFiltersProps {
  filters: {
    status: string;
    priority: string;
    frequency: string;
    overdue: string;
  };
  onFiltersChange: (filters: any) => void;
  workflowItems: any[];
}

export const WorkflowFilters: React.FC<WorkflowFiltersProps> = ({
  filters,
  onFiltersChange,
  workflowItems
}) => {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      priority: 'all',
      frequency: 'all',
      overdue: 'all'
    });
  };

  // Get unique values for filter options
  const frequencies = [...new Set(workflowItems.map(item => item.compliance?.frequency).filter(Boolean))];
  
  // Count items by status for badges
  const statusCounts = {
    draft: workflowItems.filter(item => item.status === 'draft').length,
    under_review: workflowItems.filter(item => item.status === 'under_review').length,
    approved: workflowItems.filter(item => item.status === 'approved').length,
    rejected: workflowItems.filter(item => item.status === 'rejected').length,
    sent_back: workflowItems.filter(item => item.status === 'sent_back').length,
  };

  const priorityCounts = {
    critical: workflowItems.filter(item => item.priority === 'critical').length,
    high: workflowItems.filter(item => item.priority === 'high').length,
    medium: workflowItems.filter(item => item.priority === 'medium').length,
    low: workflowItems.filter(item => item.priority === 'low').length,
  };

  const overdueCount = workflowItems.filter(item => {
    const dueDate = new Date(item.due_date);
    const today = new Date();
    return dueDate < today && item.status !== 'approved';
  }).length;

  const upcomingCount = workflowItems.filter(item => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(item.due_date);
    return dueDate >= today && dueDate <= threeDaysFromNow;
  }).length;

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all');

  return (
    <Card className="mb-4 bg-blue-100">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-1">
          <div className="flex items-center gap-2">
            <Filter className="h-2 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Status</label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    Draft
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">
                      {statusCounts.draft}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="under_review">
                  <div className="flex items-center gap-2">
                    Under Review
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {statusCounts.under_review}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="approved">
                  <div className="flex items-center gap-2">
                    Approved
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {statusCounts.approved}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center gap-2">
                    Rejected
                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                      {statusCounts.rejected}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="sent_back">
                  <div className="flex items-center gap-2">
                    Sent Back
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                      {statusCounts.sent_back}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Priority</label>
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    Critical
                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                      {priorityCounts.critical}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    High
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                      {priorityCounts.high}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-500" />
                    Medium
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {priorityCounts.medium}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Low
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {priorityCounts.low}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Frequency Filter */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Frequency</label>
            <Select value={filters.frequency} onValueChange={(value) => handleFilterChange('frequency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequency</SelectItem>
                {frequencies.map(frequency => (
                  <SelectItem key={frequency} value={frequency}>
                    {frequency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeline Filter */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">Timeline</label>
            <Select value={filters.overdue} onValueChange={(value) => handleFilterChange('overdue', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="overdue">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    Overdue
                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                      {overdueCount}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="upcoming">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-orange-500" />
                    Due Soon (3 days)
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                      {upcomingCount}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap gap-2">
          {overdueCount > 0 && (
            <button
              onClick={() => handleFilterChange('overdue', 'overdue')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.overdue === 'overdue'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Overdue ({overdueCount})
            </button>
          )}
          
          {upcomingCount > 0 && (
            <button
              onClick={() => handleFilterChange('overdue', 'upcoming')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.overdue === 'upcoming'
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
              }`}
            >
              <Calendar className="h-3 w-3" />
              Due Soon ({upcomingCount})
            </button>
          )}

          {statusCounts.under_review > 0 && (
            <button
              onClick={() => handleFilterChange('status', 'under_review')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.status === 'under_review'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Clock className="h-3 w-3" />
              Under Review ({statusCounts.under_review})
            </button>
          )}

          {statusCounts.sent_back > 0 && (
            <button
              onClick={() => handleFilterChange('status', 'sent_back')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.status === 'sent_back'
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
              }`}
            >
              <Clock className="h-3 w-3" />
              Sent Back ({statusCounts.sent_back})
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
