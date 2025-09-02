import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Send,
  Eye,
  RotateCcw,
  Upload,
  UserPlus
} from "lucide-react";
import { format } from "date-fns";
import { WorkflowItem } from "./WorkflowCard";

interface WorkflowTableProps {
  items: WorkflowItem[];
  userRole: string;
  currentUserId?: string;
  onAction?: (action: string, item: WorkflowItem) => void;
  onApprove?: (assignmentId: string) => Promise<void>;
  onReject?: (assignmentId: string) => Promise<void>;
  onSendBack?: (assignmentId: string, remarks: string) => Promise<void>;
  onUpload?: (assignmentId: string) => void;
  onAssign?: (complianceId: string, compliance: any) => void;
}

export const WorkflowTable: React.FC<WorkflowTableProps> = ({ 
  items,
  userRole, 
  currentUserId,
  onAction,
  onApprove, 
  onReject, 
  onSendBack,
  onUpload,
  onAssign
}) => {
  const [remarks, setRemarks] = useState('');
  const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return <AlertTriangle className="h-3 w-3" />;
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handleSendBackWithRemarks = async () => {
    if (onSendBack && remarks.trim() && selectedItemId) {
      await onSendBack(selectedItemId, remarks);
      setRemarks('');
      setIsRemarksDialogOpen(false);
      setSelectedItemId('');
    }
  };

  const getActionButtons = (item: WorkflowItem) => {
    const buttons = [];
    const isMaker = userRole.toLowerCase() === 'maker';
    const isChecker = userRole.toLowerCase() === 'checker';
    
    // View button - always available
    // buttons.push(
    //   <Button
    //     key="view"
    //     variant="outline"
    //     size="sm"
    //     onClick={() => onAction?.('view', item)}
    //     className="flex items-center gap-1"
    //   >
    //     <Eye className="h-3 w-3" />
    //     View
    //   </Button>
    // );

    buttons.push(
      <Button
        key="submit"
        variant="outline"
        size="sm"
        onClick={() => onAction?.('submit', item)}
        className="flex items-center gap-1"
      >
        <Eye className="h-3 w-3" />
        submit
      </Button>
    );

    //    buttons.push(
    //   <Button
    //     key="resubmit"
    //     variant="outline"
    //     size="sm"
    //     onClick={() => onAction?.('resubmit', item)}
    //     className="flex items-center gap-1"
    //   >
    //     <RotateCcw className="h-3 w-3" />
        
    //   </Button>
    // );

    // Upload button for makers
    if (isMaker && item.status === 'draft' && onUpload) {
      buttons.push(
        <Button
          key="upload"
          variant="outline"
          size="sm"
          onClick={() => onUpload(item.id)}
          className="flex items-center gap-1"
        >
          <Upload className="h-3 w-3" />
          Upload
        </Button>
      );
    }

    // Submit button for makers
    if (isMaker && item.status === 'draft') {
      buttons.push(
        <Button
          key="submit"
          size="sm"
          onClick={() => onAction?.('submit', item)}
          className="flex items-center gap-1"
        >
          <Send className="h-3 w-3" />
          Submit
        </Button>
      );
    }

    // Resubmit button for rejected items
    if (isMaker && item.status === 'rejected') {
      buttons.push(
        <Button
          key="resubmit"
          size="sm"
          onClick={() => onAction?.('resubmit', item)}
          className="flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Resubmit
        </Button>
      );
    }

    // Checker actions
    if (isChecker && item.status === 'submitted') {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          onClick={() => onApprove?.(item.id)}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-3 w-3" />
          Approve
        </Button>
      );

      buttons.push(
        <Button
          key="sendback"
          variant="destructive"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => {
            setSelectedItemId(item.id);
            setIsRemarksDialogOpen(true);
          }}
        >
          <RotateCcw className="h-3 w-3" />
          Send Back
        </Button>
      );
    }

    // Assign button for unassigned items
    if (onAssign && item.compliance) {
      buttons.push(
        <Button
          key="assign"
          size="sm"
          onClick={() => onAssign(item.compliance_id, item.compliance)}
          className="flex items-center gap-1"
        >
          <UserPlus className="h-3 w-3" />
          Assign
        </Button>
      );
    }

    return buttons;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-background rounded-lg shadow-sm border border-border p-8">
          <div className="text-muted-foreground mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Tasks Found
          </h3>
          <p className="text-muted-foreground">No compliance tasks available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Compliance</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Maker</TableHead>
            <TableHead>Checker</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">
                    {item.compliance?.name || 'Compliance Task'}
                  </div>
                  {item.compliance?.compliance_id && (
                    <Badge variant="outline" className="text-xs">
                      {item.compliance.compliance_id}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getPriorityColor(item.priority || 'low')} flex items-center gap-1 w-fit`}>
                  {getPriorityIcon(item.priority || 'low')}
                  {item.priority || 'low'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {item.due_date ? format(new Date(item.due_date), 'MMM dd, yyyy') : 'No due date'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  {item.compliance?.category || 'General'}
                </div>
              </TableCell>
              <TableCell>
                {item.maker ? (
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {item.maker.full_name}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {item.checker ? (
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {item.checker.full_name}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {item.submitted_at && !isNaN(new Date(item.submitted_at).getTime()) ? (
                  <span className="text-sm">{format(new Date(item.submitted_at), 'MMM dd, HH:mm')}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {getActionButtons(item)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isRemarksDialogOpen} onOpenChange={setIsRemarksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Back with Remarks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRemarksDialogOpen(false);
                  setSelectedItemId('');
                  setRemarks('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendBackWithRemarks}
                disabled={!remarks.trim()}
              >
                Send Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
