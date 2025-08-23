import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Assignment {
  id: string;
  user_id: string;
  status: string;
  assigned_at: string;
  user_role: string;
  employees: {
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role_name: string;
  department_code: string;
}

interface ComplianceAssignmentsProps {
  complianceId: string;
  complianceName: string;
  isActive: boolean;
}

export const ComplianceAssignments: React.FC<ComplianceAssignmentsProps> = ({
  complianceId,
  complianceName,
  isActive
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [complianceDepartment, setComplianceDepartment] = useState<string>('');
  const [selectedMakerId, setSelectedMakerId] = useState<string>('');
  const [selectedCheckerId, setSelectedCheckerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchComplianceDetails();
      fetchAssignments();
    }
  }, [isOpen, complianceId]);

  const fetchComplianceDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('compliances')
        .select('department_code')
        .eq('id', complianceId)
        .single();

      if (error) {
        console.error('Error fetching compliance details:', error);
        throw error;
      }
      
      console.log('Compliance department:', data?.department_code);
      setComplianceDepartment(data?.department_code || '');
      
      // Fetch users after getting department
      if (data?.department_code) {
        await fetchAvailableUsers(data.department_code);
      }
    } catch (error) {
      console.error('Error fetching compliance details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch compliance details",
        variant: "destructive",
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      // First fetch the assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('compliance_user_assignments')
        .select('id, user_id, status, assigned_at')
        .eq('compliance_id', complianceId);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      console.log('Fetched assignments:', assignmentsData);

      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        return;
      }

      // Get user IDs from assignments
      const userIds = assignmentsData.map(assignment => assignment.user_id);

      // Fetch employee details for these user IDs
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, email, role_name')
        .in('id', userIds);

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }

      console.log('Fetched employees:', employeesData);

      // Map assignments with employee data
      const mappedAssignments = assignmentsData.map(assignment => {
        const employee = employeesData?.find(emp => emp.id === assignment.user_id);
        return {
          ...assignment,
          user_role: employee?.role_name || 'maker',
          employees: {
            name: employee?.name || 'Unknown',
            email: employee?.email || 'Unknown'
          }
        };
      });
      
      setAssignments(mappedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableUsers = async (departmentCode: string) => {
    try {
      console.log('Fetching users for department:', departmentCode);
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, role_name, department_code')
        .eq('status', 'active')
        .eq('department_code', departmentCode)
        .in('role_name', ['Maker', 'Checker'])
        .order('name');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Fetched department users:', data);
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available users for this department",
        variant: "destructive",
      });
    }
  };

  const assignUser = async (userId: string, userRole: string) => {
    if (!userId || userId === 'no-makers' || userId === 'no-checkers') {
      toast({
        title: "Error",
        description: `Please select a ${userRole} to assign`,
        variant: "destructive",
      });
      return;
    }

    // Check if user is already assigned
    const isAlreadyAssigned = assignments.some(assignment => assignment.user_id === userId);
    if (isAlreadyAssigned) {
      toast({
        title: "Error",
        description: "User is already assigned to this compliance",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Assigning user:', userId, 'as', userRole, 'to compliance:', complianceId);
      
      const { data, error } = await supabase
        .from('compliance_user_assignments')
        .insert({
          compliance_id: complianceId,
          user_id: userId,
          status: 'active'
        })
        .select();

      if (error) {
        console.error('Error assigning user:', error);
        throw error;
      }

      console.log('Assignment created:', data);

      toast({
        title: "Success",
        description: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} assigned successfully`,
      });

      if (userRole === 'maker') {
        setSelectedMakerId('');
      } else {
        setSelectedCheckerId('');
      }
      
      await fetchAssignments(); // Refresh assignments list
    } catch (error) {
      console.error('Error assigning user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignmentStatus = async (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('compliance_user_assignments')
        .update({ status: newStatus })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assignment ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_user_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment removed",
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove assignment",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'maker': return 'bg-blue-100 text-blue-800';
      case 'checker': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter users by department and role
  const availableMakers = availableUsers.filter(
    user => user.role_name?.toLowerCase() === 'maker' && 
    user.department_code === complianceDepartment &&
    !assignments.some(assignment => assignment.user_id === user.id)
  );

  const availableCheckers = availableUsers.filter(
    user => user.role_name?.toLowerCase() === 'checker' && 
    user.department_code === complianceDepartment &&
    !assignments.some(assignment => assignment.user_id === user.id)
  );

  const makerAssignments = assignments.filter(assignment => assignment.user_role?.toLowerCase() === 'maker');
  const checkerAssignments = assignments.filter(assignment => assignment.user_role?.toLowerCase() === 'checker');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!isActive}>
          <Users className="h-3 w-3 mr-1" />
          Assign ({assignments.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Assignments - {complianceName}</DialogTitle>
          {complianceDepartment && (
            <p className="text-sm text-gray-600">
              Department: <Badge variant="outline">{complianceDepartment}</Badge>
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Assignments */}
          {isActive && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium mb-3">Assign New Users ({complianceDepartment} Department)</h3>
              
              {/* Maker Assignment */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assign Maker</label>
                <div className="flex gap-2">
                  <Select value={selectedMakerId} onValueChange={setSelectedMakerId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select maker to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMakers.length === 0 ? (
                        <SelectItem value="no-makers" disabled>
                          No available makers in {complianceDepartment} department
                        </SelectItem>
                      ) : (
                        availableMakers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email}) - {user.department_code}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => assignUser(selectedMakerId, 'maker')} 
                    disabled={!selectedMakerId || loading || selectedMakerId === 'no-makers' || availableMakers.length === 0}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {loading ? 'Assigning...' : 'Assign Maker'}
                  </Button>
                </div>
                {availableMakers.length === 0 && complianceDepartment && (
                  <p className="text-sm text-orange-600">
                    No available makers in {complianceDepartment} department
                  </p>
                )}
              </div>

              {/* Checker Assignment */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assign Checker</label>
                <div className="flex gap-2">
                  <Select value={selectedCheckerId} onValueChange={setSelectedCheckerId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select checker to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCheckers.length === 0 ? (
                        <SelectItem value="no-checkers" disabled>
                          No available checkers in {complianceDepartment} department
                        </SelectItem>
                      ) : (
                        availableCheckers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email}) - {user.department_code}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => assignUser(selectedCheckerId, 'checker')} 
                    disabled={!selectedCheckerId || loading || selectedCheckerId === 'no-checkers' || availableCheckers.length === 0}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {loading ? 'Assigning...' : 'Assign Checker'}
                  </Button>
                </div>
                {availableCheckers.length === 0 && complianceDepartment && (
                  <p className="text-sm text-orange-600">
                    No available checkers in {complianceDepartment} department
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Current Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Makers */}
            <div>
              <h3 className="font-medium mb-3">Assigned Makers ({makerAssignments.length})</h3>
              
              {makerAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white border rounded-lg">
                  No makers assigned to this compliance
                </div>
              ) : (
                <div className="space-y-2">
                  {makerAssignments.map(assignment => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{assignment.employees.name}</div>
                        <div className="text-sm text-gray-600">{assignment.employees.email}</div>
                        <div className="text-xs text-gray-500">
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor('maker')}>
                          Maker
                        </Badge>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAssignmentStatus(assignment.id, assignment.status)}
                            disabled={!isActive}
                          >
                            {assignment.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkers */}
            <div>
              <h3 className="font-medium mb-3">Assigned Checkers ({checkerAssignments.length})</h3>
              
              {checkerAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white border rounded-lg">
                  No checkers assigned to this compliance
                </div>
              ) : (
                <div className="space-y-2">
                  {checkerAssignments.map(assignment => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{assignment.employees.name}</div>
                        <div className="text-sm text-gray-600">{assignment.employees.email}</div>
                        <div className="text-xs text-gray-500">
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor('checker')}>
                          Checker
                        </Badge>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAssignmentStatus(assignment.id, assignment.status)}
                            disabled={!isActive}
                          >
                            {assignment.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
