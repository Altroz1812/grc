
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, Upload, Eye, CheckCircle, XCircle, ArrowLeft, AlertTriangle } from "lucide-react";

interface WorkflowItem {
  id: string;
  compliance_id: string;
  assigned_to: string;
  checker_id: string | null;
  due_date: string;
  status: string;
  maker_remarks?: string;
  checker_remarks?: string;
  document_url?: string;
  priority?: string;
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

interface WorkflowCardProps {
  item: WorkflowItem;
  userRole: string;
  currentUserId: string;
  onUpload?: (assignmentId: string) => void;
  onApprove?: (assignmentId: string) => void;
  onReject?: (assignmentId: string) => void;
  onSendBack?: (assignmentId: string, remarks: string) => void;
  onAssign?: (complianceId: string, complianceName: string) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  item,
  userRole,
  currentUserId,
  onUpload,
  onApprove,
  onReject,
  onSendBack,
  onAssign
}) => {
  const [sendBackRemarks, setSendBackRemarks] = useState('');
  const [showSendBackDialog, setShowSendBackDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Clock;
      case 'low':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getUrgencyLevel = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { level: 'overdue', color: 'text-red-600' };
    if (diffDays <= 1) return { level: 'urgent', color: 'text-orange-600' };
    if (diffDays <= 3) return { level: 'due-soon', color: 'text-blue-600' };
    return { level: 'normal', color: 'text-green-600' };
  };

  const urgency = getUrgencyLevel(item.due_date);
  const isAssigned = item.assigned_to !== null;
  const PriorityIcon = getPriorityIcon(item.priority);
  
  // Check if current user can perform actions
  const canUpload = item.assigned_to === currentUserId && (item.status === 'draft');
  const canCheck = item.checker_id === currentUserId && item.status === 'submitted';
  const canAssign = userRole === 'admin' && !isAssigned;

  console.log('WorkflowCard - item:', item.id, 'currentUserId:', currentUserId, 'assigned_to:', item.assigned_to, 'checker_id:', item.checker_id);
  console.log('WorkflowCard - canUpload:', canUpload, 'canCheck:', canCheck, 'canAssign:', canAssign);

  const handleSendBack = () => {
    if (onSendBack && sendBackRemarks.trim()) {
      onSendBack(item.id, sendBackRemarks);
      setSendBackRemarks('');
      setShowSendBackDialog(false);
    }
  };

  if (!isAssigned) {
    // Unassigned task card
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800 line-clamp-2">
              {item.compliance?.name || 'Compliance Task'}
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
              Unassigned
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>ID: {item.compliance_id}</span>
            <span>•</span>
            <span>{item.compliance?.category}</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Frequency: {item.compliance?.frequency}</span>
          </div>

          {canAssign && onAssign && (
            <Button 
              onClick={() => onAssign(item.compliance_id, item.compliance?.name || 'Compliance Task')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Smart Assign
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Assigned task card
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 line-clamp-2">
            {item.compliance?.name || 'Compliance Task'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {item.priority && (
              <div className="flex items-center gap-1">
                <PriorityIcon className={`h-3 w-3 ${getPriorityColor(item.priority)}`} />
                <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                  {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)}
                </span>
              </div>
            )}
            <Badge className={getStatusColor(item.status)}>
              {item.status === 'submitted' ? 'Submitted' : 
               item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>ID: {item.compliance_id}</span>
          <span>•</span>
          <span>{item.compliance?.category}</span>
          <span>•</span>
          <span>{item.compliance?.frequency}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${urgency.color}`} />
          <span className={`text-sm font-medium ${urgency.color}`}>
            Due: {new Date(item.due_date).toLocaleDateString()}
            {urgency.level === 'overdue' && ' (Overdue)'}
            {urgency.level === 'urgent' && ' (Urgent)'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>Maker: {item.maker?.full_name || 'Unassigned'}</span>
          {item.assigned_to === currentUserId && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">You</Badge>
          )}
        </div>

        {item.checker && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Checker: {item.checker.full_name}</span>
            {item.checker_id === currentUserId && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">You</Badge>
            )}
          </div>
        )}

        {item.document_url && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Upload className="h-4 w-4" />
            <span>Document uploaded</span>
          </div>
        )}

        {/* Show remarks if any */}
        {item.maker_remarks && (
          <div className="bg-blue-50 p-2 rounded text-sm">
            <strong>Maker Notes:</strong> {item.maker_remarks}
          </div>
        )}

        {item.checker_remarks && (
          <div className="bg-purple-50 p-2 rounded text-sm">
            <strong>Checker Notes:</strong> {item.checker_remarks}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {canUpload && onUpload && (
            <Button 
              onClick={() => onUpload(item.id)}
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Upload className="h-3 w-3 mr-1" />
              Submit
            </Button>
          )}

          {canCheck && onApprove && onReject && onSendBack && (
            <>
              <Button 
                onClick={() => onApprove(item.id)}
                variant="outline" 
                size="sm"
                className="flex-1 text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
              
              <Dialog open={showSendBackDialog} onOpenChange={setShowSendBackDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 text-orange-600 hover:text-orange-700"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Send Back
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Back to Maker</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Provide feedback for the maker to address before resubmission:
                    </p>
                    <Textarea
                      placeholder="Enter your feedback and reasons for sending back..."
                      value={sendBackRemarks}
                      onChange={(e) => setSendBackRemarks(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowSendBackDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendBack}
                        disabled={!sendBackRemarks.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Send Back
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={() => onReject(item.id)}
                variant="outline" 
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
