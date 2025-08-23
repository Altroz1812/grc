
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DepartmentTable } from './DepartmentTable';

interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  status: 'active' | 'inactive';
  employee_count: number;
}

const DepartmentMaster: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDepartment, setNewDepartment] = useState({
    name: '', code: '', head: '', status: 'active' as const
  });
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('departments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'departments'
      }, () => {
        fetchDepartments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDepartments((data || []) as Department[]);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    }
  };

  const handleAddDepartment = async () => {
    if (newDepartment.name && newDepartment.code && newDepartment.head) {
      try {
        const { error } = await supabase
          .from('departments')
          .insert([newDepartment]);

        if (error) throw error;

        setNewDepartment({ name: '', code: '', head: '', status: 'active' });
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Department added successfully",
        });
      } catch (error) {
        console.error('Error adding department:', error);
        toast({
          title: "Error",
          description: "Failed to add department",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditDepartment = async () => {
    if (editingDepartment) {
      try {
        const { error } = await supabase
          .from('departments')
          .update({
            name: editingDepartment.name,
            head: editingDepartment.head,
            status: editingDepartment.status
          })
          .eq('id', editingDepartment.id);

        if (error) throw error;

        setEditingDepartment(null);
        setIsEditDialogOpen(false);
        toast({
          title: "Success",
          description: "Department updated successfully",
        });
      } catch (error) {
        console.error('Error updating department:', error);
        toast({
          title: "Error",
          description: "Failed to update department",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center">
        <Building2 className="mr-3 h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Department Master</h1>
      </div>

      <DepartmentTable
        departments={departments}
        onAdd={() => setIsDialogOpen(true)}
        onEdit={(dept) => {
          setEditingDepartment(dept);
          setIsEditDialogOpen(true);
        }}
        onDelete={handleDeleteDepartment}
      />

      {/* Add Department Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                placeholder="Enter department name"
              />
            </div>
            <div>
              <Label htmlFor="code">Department Code</Label>
              <Input
                id="code"
                value={newDepartment.code}
                onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value})}
                placeholder="Enter department code"
              />
            </div>
            <div>
              <Label htmlFor="head">Department Head</Label>
              <Input
                id="head"
                value={newDepartment.head}
                onChange={(e) => setNewDepartment({...newDepartment, head: e.target.value})}
                placeholder="Enter department head name"
              />
            </div>
            <Button onClick={handleAddDepartment} className="w-full">
              Add Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          {editingDepartment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Department Name</Label>
                <Input
                  id="edit-name"
                  value={editingDepartment.name}
                  onChange={(e) => setEditingDepartment({...editingDepartment, name: e.target.value})}
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <Label htmlFor="edit-head">Department Head</Label>
                <Input
                  id="edit-head"
                  value={editingDepartment.head}
                  onChange={(e) => setEditingDepartment({...editingDepartment, head: e.target.value})}
                  placeholder="Enter department head name"
                />
              </div>
              <Button onClick={handleEditDepartment} className="w-full">
                Update Department
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentMaster;
