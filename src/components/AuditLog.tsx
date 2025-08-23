
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Download, Filter, Calendar, User, FileText } from "lucide-react";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  action: string;
  module: string;
  recordId: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AuditLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const { toast } = useToast();

  // Mock audit log data
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', searchTerm, selectedModule, selectedAction],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userEmail: 'john.doe@bank.com',
          userName: 'John Doe',
          action: 'CREATE',
          module: 'Compliance Assignment',
          recordId: 'CA-001',
          oldValues: {},
          newValues: {
            compliance_id: 'COMP-STR-001',
            assigned_to: 'emp-001',
            checker_id: 'emp-002',
            due_date: '2024-07-15',
            status: 'draft'
          },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'medium'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userEmail: 'jane.smith@bank.com',
          userName: 'Jane Smith',
          action: 'UPDATE',
          module: 'Compliance Assignment',
          recordId: 'CA-001',
          oldValues: {
            status: 'draft',
            maker_remarks: null
          },
          newValues: {
            status: 'submitted',
            maker_remarks: 'All required documents have been reviewed and compiled.'
          },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'medium'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userEmail: 'mike.johnson@bank.com',
          userName: 'Mike Johnson',
          action: 'APPROVE',
          module: 'Compliance Assignment',
          recordId: 'CA-002',
          oldValues: {
            status: 'submitted',
            checker_remarks: null
          },
          newValues: {
            status: 'approved',
            checker_remarks: 'All compliance requirements have been met. Approved for submission.'
          },
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          severity: 'high'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          userEmail: 'sarah.wilson@bank.com',
          userName: 'Sarah Wilson',
          action: 'ESCALATE',
          module: 'Escalation Matrix',
          recordId: 'CA-003',
          oldValues: {
            escalation_level: 0,
            escalated_to: null
          },
          newValues: {
            escalation_level: 1,
            escalated_to: ['supervisor@bank.com']
          },
          ipAddress: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'high'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          userEmail: 'admin@bank.com',
          userName: 'System Admin',
          action: 'CREATE',
          module: 'Employee Master',
          recordId: 'EMP-005',
          oldValues: {},
          newValues: {
            emp_id: 'EMP-005',
            name: 'Robert Brown',
            email: 'robert.brown@bank.com',
            department_code: 'RISK',
            role_name: 'Compliance Officer',
            status: 'active'
          },
          ipAddress: '192.168.1.104',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'medium'
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 18000000).toISOString(),
          userEmail: 'compliance.officer@bank.com',
          userName: 'Compliance Officer',
          action: 'DELETE',
          module: 'Compliance Master',
          recordId: 'COMP-OLD-001',
          oldValues: {
            compliance_id: 'COMP-OLD-001',
            name: 'Outdated Compliance Requirement',
            status: 'inactive'
          },
          newValues: {},
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          severity: 'critical'
        }
      ];
      
      return mockLogs.filter(log => {
        const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.module.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesModule = selectedModule === 'all' || log.module.toLowerCase().includes(selectedModule.toLowerCase());
        const matchesAction = selectedAction === 'all' || log.action.toLowerCase() === selectedAction.toLowerCase();
        
        return matchesSearch && matchesModule && matchesAction;
      });
    }
  });

  const exportAuditLog = () => {
    toast({
      title: "Export Started",
      description: "Audit log is being exported to Excel...",
    });
    
    // Simulate download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Audit log has been downloaded successfully.",
      });
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-blue-50 text-blue-700';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-blue-100 text-blue-800';
      case 'UPDATE': return 'bg-blue-50 text-blue-700';
      case 'APPROVE': return 'bg-blue-100 text-blue-800';
      case 'REJECT': return 'bg-red-100 text-red-800';
      case 'ESCALATE': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderValueDiff = (oldValue: any, newValue: any, key: string) => {
    if (oldValue === undefined && newValue !== undefined) {
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium text-slate-700">{key}:</div>
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <span className="text-green-800 font-mono text-sm">+ {JSON.stringify(newValue)}</span>
          </div>
        </div>
      );
    }
    
    if (oldValue !== undefined && newValue === undefined) {
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium text-slate-700">{key}:</div>
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <span className="text-red-800 font-mono text-sm">- {JSON.stringify(oldValue)}</span>
          </div>
        </div>
      );
    }
    
    if (oldValue !== newValue) {
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium text-slate-700">{key}:</div>
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-1">
            <span className="text-red-800 font-mono text-sm">- {JSON.stringify(oldValue)}</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <span className="text-green-800 font-mono text-sm">+ {JSON.stringify(newValue)}</span>
          </div>
        </div>
      );
    }
    
    return null;
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
            Audit Log
          </h1>
          <p className="text-slate-600">Track all system activities and changes with complete audit trail</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by user, email, action, or module..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="min-w-48">
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="compliance assignment">Compliance Assignment</SelectItem>
                    <SelectItem value="employee master">Employee Master</SelectItem>
                    <SelectItem value="compliance master">Compliance Master</SelectItem>
                    <SelectItem value="escalation matrix">Escalation Matrix</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-48">
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="escalate">Escalate</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={exportAuditLog} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Trail ({auditLogs?.length || 0} entries)
            </CardTitle>
            <CardDescription>
              Complete log of all system activities and data changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs?.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{entry.userName}</div>
                          <div className="text-xs text-slate-500">{entry.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(entry.action)}>
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{entry.module}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.recordId}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(entry.severity)}>
                          {entry.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                            </DialogHeader>
                            {selectedEntry && (
                              <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Timestamp</label>
                                    <p className="text-sm">{formatTimestamp(selectedEntry.timestamp)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">User</label>
                                    <p className="text-sm">{selectedEntry.userName} ({selectedEntry.userEmail})</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Action</label>
                                    <Badge className={getActionColor(selectedEntry.action)}>
                                      {selectedEntry.action}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Module</label>
                                    <p className="text-sm">{selectedEntry.module}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Record ID</label>
                                    <p className="text-sm font-mono">{selectedEntry.recordId}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">Severity</label>
                                    <Badge className={getSeverityColor(selectedEntry.severity)}>
                                      {selectedEntry.severity.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Technical Details */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">IP Address</label>
                                    <p className="text-sm font-mono">{selectedEntry.ipAddress}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-slate-600">User Agent</label>
                                    <p className="text-sm truncate" title={selectedEntry.userAgent}>
                                      {selectedEntry.userAgent}
                                    </p>
                                  </div>
                                </div>

                                {/* Value Changes */}
                                <div>
                                  <h4 className="text-lg font-semibold mb-4">Data Changes</h4>
                                  <div className="space-y-4">
                                    {Object.keys({ ...selectedEntry.oldValues, ...selectedEntry.newValues }).map(key => {
                                      const diff = renderValueDiff(
                                        selectedEntry.oldValues[key], 
                                        selectedEntry.newValues[key], 
                                        key
                                      );
                                      return diff ? <div key={key}>{diff}</div> : null;
                                    })}
                                    {Object.keys({ ...selectedEntry.oldValues, ...selectedEntry.newValues }).length === 0 && (
                                      <p className="text-sm text-slate-500 italic">No data changes recorded</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {auditLogs?.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No audit logs found</h3>
                <p className="text-slate-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLog;
