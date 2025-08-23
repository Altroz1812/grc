import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, UserX, UserCheck, RotateCcw, Key, Eye, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'locked';
  created_at: string;
}

interface Employee {
  id: string;
  emp_id: string;
  name: string;
  email: string;
  phone: string;
  department_code: string;
  designation: string;
  role_name: string;
  status: 'active' | 'inactive';
}

interface UserRole {
  role_name: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
  performed_by?: { full_name: string } | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [assignedRole, setAssignedRole] = useState('');
  const [passwordResetDialog, setPasswordResetDialog] = useState(false);
  const [resetUserId, setResetUserId] = useState<string>('');
  const [resetUserEmail, setResetUserEmail] = useState<string>('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(user => ({
        ...user,
        status: user.status as 'active' | 'inactive' | 'locked'
      }));
      
      setUsers(typedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      // Filter out employees with empty or invalid data
      const validEmployees = (data || []).filter(emp => 
        emp.id && emp.name && emp.email && emp.name.trim() !== '' && emp.email.trim() !== ''
      ) as Employee[];
      setEmployees(validEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('status', 'active');

      if (error) throw error;
      // Filter out roles with empty names
      const validRoles = (data || []).filter(role => role.role_name && role.role_name.trim() !== '');
      setRoles(validRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchAuditLogs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const transformedLogs = (data || []).map(log => ({
        ...log,
        performed_by: log.performed_by ? { full_name: 'System' } : null
      }));
      
      setAuditLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateNewPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createUserFromEmployee = async () => {
    if (!selectedEmployee || !assignedRole) {
      toast({
        title: "Error",
        description: "Please select an employee and assign a role",
        variant: "destructive",
      });
      return;
    }

    try {
      const password = tempPassword || generateTempPassword();
      
      // Create user account - no email verification required
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: selectedEmployee.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: selectedEmployee.name,
            phone: selectedEmployee.phone,
            temp_password: true,
            role: assignedRole,
            emp_id: selectedEmployee.emp_id,
            department_code: selectedEmployee.department_code,
            designation: selectedEmployee.designation
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with employee details
        setTimeout(async () => {
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                full_name: selectedEmployee.name,
                phone: selectedEmployee.phone,
                user_role: assignedRole,
                department_code: selectedEmployee.department_code,
                status: 'active' // Activate user since they're created by admin
              })
              .eq('id', authData.user.id);

            if (profileError) {
              console.error('Error updating profile:', profileError);
            }
          } catch (err) {
            console.error('Error in profile update:', err);
          }
        }, 1000);

        // Log the user creation action
        await supabase.rpc('log_user_action', {
          p_user_id: authData.user.id,
          p_action: 'USER_CREATED_FROM_EMPLOYEE',
          p_details: { 
            created_by: 'admin',
            employee_id: selectedEmployee.emp_id,
            role: assignedRole,
            temp_password: password,
            email_verification_disabled: true,
            requires_password_change: true
          }
        });
      }

      setSelectedEmployee(null);
      setAssignedRole('');
      setTempPassword('');
      setIsCreateDialogOpen(false);
      
      setTimeout(() => {
        fetchUsers();
      }, 2000);
      
      toast({
        title: "User Account Created",
        description: `User account created for ${selectedEmployee.name}. Temporary password: ${password}. User can login immediately without email verification.`,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = "Failed to create user account";
      
      if (error.message?.includes('User already registered')) {
        errorMessage = "A user account with this email already exists";
      } else if (error.message?.includes('Password')) {
        errorMessage = "Password must be at least 6 characters long";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetUserPassword = async () => {
    if (!resetUserId || !generatedPassword) {
      toast({
        title: "Error",
        description: "Please generate a password first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update user metadata to mark password as temporary
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        resetUserId,
        {
          password: generatedPassword,
          user_metadata: {
            temp_password: true,
            requires_password_change: true,
            password_set_by_admin: true
          }
        }
      );

      if (updateError) throw updateError;

      // Log the password reset action
      await supabase.rpc('log_user_action', {
        p_user_id: resetUserId,
        p_action: 'PASSWORD_RESET_BY_ADMIN',
        p_details: { 
          reset_by: 'admin',
          temp_password_generated: true,
          requires_password_change: true
        }
      });

      toast({
        title: "Password Reset Successfully",
        description: `New temporary password generated for user. Please share it securely.`,
      });

      setPasswordResetDialog(false);
      setResetUserId('');
      setResetUserEmail('');
      setGeneratedPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password. You may need admin privileges.",
        variant: "destructive",
      });
    }
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    });
  };

  const handlePasswordResetClick = (userId: string, email: string) => {
    setResetUserId(userId);
    setResetUserEmail(email);
    const newPassword = generateNewPassword();
    setGeneratedPassword(newPassword);
    setPasswordResetDialog(true);
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('log_user_action', {
        p_user_id: userId,
        p_action: `USER_${status.toUpperCase()}`,
        p_details: { status, changed_by: 'admin' }
      });

      fetchUsers();
      toast({
        title: "Success",
        description: `User ${status === 'active' ? 'activated' : status === 'inactive' ? 'deactivated' : 'locked'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const unlockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          login_attempts: 0,
          locked_until: null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      await updateUserStatus(userId, 'active');

      await supabase.rpc('log_user_action', {
        p_user_id: userId,
        p_action: 'USER_UNLOCKED',
        p_details: { unlocked_by: 'admin' }
      });

      toast({
        title: "Success",
        description: "User unlocked successfully",
      });
    } catch (error) {
      console.error('Error unlocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unlock user",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'locked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Create user accounts from employee data. Users can login immediately without email verification.</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create User Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle>Create User Account from Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Users can login immediately with any email address (including Gmail, Yahoo, etc.) - no email verification required.
                </p>
              </div>

              <div>
                <Label htmlFor="employee">Select Employee</Label>
                <Select 
                  value={selectedEmployee?.id || ''} 
                  onValueChange={(value) => {
                    const emp = employees.find(e => e.id === value);
                    setSelectedEmployee(emp || null);
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Choose employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {employees.filter(emp => emp.id && emp.name && emp.email).map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.emp_id}) - {emp.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmployee && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Employee Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {selectedEmployee.name}</p>
                    <p><strong>Email:</strong> {selectedEmployee.email}</p>
                    <p><strong>Department:</strong> {selectedEmployee.department_code}</p>
                    <p><strong>Designation:</strong> {selectedEmployee.designation}</p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="role">Assign Role</Label>
                <Select value={assignedRole} onValueChange={setAssignedRole}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {roles.filter(role => role.role_name && role.role_name.trim() !== '').map(role => (
                      <SelectItem key={role.role_name} value={role.role_name}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tempPassword">Temporary Password (leave blank for auto-generated)</Label>
                <Input
                  id="tempPassword"
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="bg-white border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">
                  User can login immediately - no email verification required
                </p>
              </div>

              <Button 
                onClick={createUserFromEmployee} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!selectedEmployee || !assignedRole}
              >
                Create User Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-gray-900">Users</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-gray-700">Name</TableHead>
                <TableHead className="text-gray-700">Email</TableHead>
                <TableHead className="text-gray-700">Phone</TableHead>
                <TableHead className="text-gray-700">Status</TableHead>
                <TableHead className="text-gray-700">Created</TableHead>
                <TableHead className="text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">{user.full_name}</TableCell>
                  <TableCell className="text-gray-700">{user.email}</TableCell>
                  <TableCell className="text-gray-700">{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserStatus(user.id, 'inactive')}
                          className="border-gray-300 text-gray-600 hover:bg-gray-100"
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserStatus(user.id, 'active')}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePasswordResetClick(user.id, user.email)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Key className="h-3 w-3" />
                      </Button>
                      
                      {user.status === 'locked' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlockUser(user.id)}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          fetchAuditLogs(user.id);
                          setIsAuditDialogOpen(true);
                        }}
                        className="border-gray-300 text-gray-600 hover:bg-gray-100"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialog} onOpenChange={setPasswordResetDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reset User Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-50">
                <strong>Admin Password Reset:</strong> Generate a temporary password for the user. 
                They will be required to change it on their next login.
              </p>
            </div>

            <div>
              <Label>User Email</Label>
              <Input
                value={resetUserEmail}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <Label>Generated Temporary Password</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedPassword}
                  type="text"
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPasswordToClipboard}
                  className="px-3"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this password securely with the user. They must change it on next login.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const newPassword = generateNewPassword();
                  setGeneratedPassword(newPassword);
                }}
                variant="outline"
                className="flex-1"
              >
                Generate New Password
              </Button>
              <Button
                onClick={resetUserPassword}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">User Audit Trail - {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-700">Action</TableHead>
                  <TableHead className="text-gray-700">Details</TableHead>
                  <TableHead className="text-gray-700">Performed By</TableHead>
                  <TableHead className="text-gray-700">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{log.action}</TableCell>
                    <TableCell className="text-gray-700">{JSON.stringify(log.details)}</TableCell>
                    <TableCell className="text-gray-700">{log.performed_by?.full_name || 'System'}</TableCell>
                    <TableCell className="text-gray-700">{new Date(log.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
