import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { EmployeeTable } from './EmployeeTable';

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

interface Department {
  code: string;
  name: string;
}

interface UserRole {
  role_name: string;
}

const EmployeeMaster: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    emp_id: '', name: '', email: '', phone: '', department_code: '', designation: '', role_name: '', status: 'active' as const
  });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchRoles();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('employees-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees((data || []) as Employee[]);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('code, name')
        .eq('status', 'active');

      if (error) throw error;
      // Filter out departments with empty codes
      const validDepartments = (data || []).filter(dept => dept.code && dept.code.trim() !== '');
      setDepartments(validDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
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

  const handleAddEmployee = async () => {
    if (newEmployee.emp_id && newEmployee.name && newEmployee.email && newEmployee.department_code && newEmployee.role_name) {
      try {
        const { error } = await supabase
          .from('employees')
          .insert([newEmployee]);

        if (error) throw error;

        setNewEmployee({ emp_id: '', name: '', email: '', phone: '', department_code: '', designation: '', role_name: '', status: 'active' });
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Employee added successfully",
        });
      } catch (error) {
        console.error('Error adding employee:', error);
        toast({
          title: "Error",
          description: "Failed to add employee",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditEmployee = async () => {
    if (editingEmployee) {
      try {
        const { error } = await supabase
          .from('employees')
          .update({
            name: editingEmployee.name,
            email: editingEmployee.email,
            phone: editingEmployee.phone,
            department_code: editingEmployee.department_code,
            designation: editingEmployee.designation,
            role_name: editingEmployee.role_name,
            status: editingEmployee.status
          })
          .eq('id', editingEmployee.id);

        if (error) throw error;

        setEditingEmployee(null);
        setIsEditDialogOpen(false);
        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } catch (error) {
        console.error('Error updating employee:', error);
        toast({
          title: "Error",
          description: "Failed to update employee",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center">
        <Users className="mr-3 h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Employee Master</h1>
      </div>

      <EmployeeTable
        employees={employees}
        onAdd={() => setIsDialogOpen(true)}
        onEdit={(emp) => {
          setEditingEmployee(emp);
          setIsEditDialogOpen(true);
        }}
        onDelete={handleDeleteEmployee}
      />

      {/* Add Employee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emp_id">Employee ID</Label>
                <Input
                  id="emp_id"
                  value={newEmployee.emp_id}
                  onChange={(e) => setNewEmployee({...newEmployee, emp_id: e.target.value})}
                  placeholder="EMP001"
                />
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                placeholder="john.doe@bank.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                placeholder="+91-9876543210"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={newEmployee.department_code} onValueChange={(value) => setNewEmployee({...newEmployee, department_code: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.filter(dept => dept.code && dept.code.trim() !== '').map(dept => (
                      <SelectItem key={dept.code} value={dept.code}>{dept.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newEmployee.role_name} onValueChange={(value) => setNewEmployee({...newEmployee, role_name: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(role => role.role_name && role.role_name.trim() !== '').map(role => (
                      <SelectItem key={role.role_name} value={role.role_name}>{role.role_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={newEmployee.designation}
                onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
                placeholder="Manager"
              />
            </div>
            
            <Button onClick={handleAddEmployee} className="w-full">
              Add Employee
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog - Updated with all fields */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-emp-id">Employee ID</Label>
                  <Input
                    id="edit-emp-id"
                    value={editingEmployee.emp_id}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                  placeholder="john.doe@bank.com"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingEmployee.phone}
                  onChange={(e) => setEditingEmployee({...editingEmployee, phone: e.target.value})}
                  placeholder="+91-9876543210"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <Select 
                    value={editingEmployee.department_code} 
                    onValueChange={(value) => setEditingEmployee({...editingEmployee, department_code: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dept" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.filter(dept => dept.code && dept.code.trim() !== '').map(dept => (
                        <SelectItem key={dept.code} value={dept.code}>{dept.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select 
                    value={editingEmployee.role_name} 
                    onValueChange={(value) => setEditingEmployee({...editingEmployee, role_name: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter(role => role.role_name && role.role_name.trim() !== '').map(role => (
                        <SelectItem key={role.role_name} value={role.role_name}>{role.role_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-designation">Designation</Label>
                <Input
                  id="edit-designation"
                  value={editingEmployee.designation}
                  onChange={(e) => setEditingEmployee({...editingEmployee, designation: e.target.value})}
                  placeholder="Manager"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editingEmployee.status} 
                  onValueChange={(value) => setEditingEmployee({...editingEmployee, status: value as 'active' | 'inactive'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleEditEmployee} className="w-full">
                Update Employee
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeMaster;
