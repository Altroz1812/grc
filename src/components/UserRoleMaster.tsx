
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UserRole {
  id: string;
  role_name: string;
  description: string;
  permissions: string[];
  user_count: number;
  status: 'active' | 'inactive';
}

const UserRoleMaster: React.FC = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [newRole, setNewRole] = useState({
    role_name: '', description: '', permissions: '', status: 'active' as const
  });
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('user-roles-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_roles'
      }, () => {
        fetchRoles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles((data || []) as UserRole[]);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user roles",
        variant: "destructive",
      });
    }
  };

  const handleAddRole = async () => {
    if (newRole.role_name && newRole.description) {
      try {
        const { error } = await supabase
          .from('user_roles')
          .insert([{
            role_name: newRole.role_name,
            description: newRole.description,
            permissions: newRole.permissions.split(',').map(p => p.trim()).filter(p => p),
            status: newRole.status
          }]);

        if (error) throw error;

        setNewRole({ role_name: '', description: '', permissions: '', status: 'active' });
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "User role added successfully",
        });
      } catch (error) {
        console.error('Error adding role:', error);
        toast({
          title: "Error",
          description: "Failed to add user role",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditRole = async () => {
    if (editingRole) {
      try {
        const { error } = await supabase
          .from('user_roles')
          .update({
            description: editingRole.description,
            permissions: editingRole.permissions,
            status: editingRole.status
          })
          .eq('id', editingRole.id);

        if (error) throw error;

        setEditingRole(null);
        setIsEditDialogOpen(false);
        toast({
          title: "Success",
          description: "User role updated successfully",
        });
      } catch (error) {
        console.error('Error updating role:', error);
        toast({
          title: "Error",
          description: "Failed to update user role",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete user role",
        variant: "destructive",
      });
    }
  };

  const getPermissionColor = (permission: string) => {
    const colors: Record<string, string> = {
      "Create": "bg-blue-100 text-blue-800",
      "Read": "bg-blue-100 text-blue-800",
      "Update": "bg-blue-50 text-blue-700",
      "Delete": "bg-red-100 text-red-800",
      "Approve": "bg-purple-100 text-purple-800",
      "Reject": "bg-orange-100 text-orange-800",
      "Audit": "bg-indigo-100 text-indigo-800",
      "Generate Reports": "bg-teal-100 text-teal-800",
      "Export Data": "bg-cyan-100 text-cyan-800",
      "Manage Users": "bg-pink-100 text-pink-800"
    };
    return colors[permission] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-3 h-6 w-6 text-blue-600" />
            User Role Master
          </h1>
          <p className="text-gray-600 mt-1">Manage user roles and access permissions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role_name">Role Name</Label>
                <Input
                  id="role_name"
                  value={newRole.role_name}
                  onChange={(e) => setNewRole({...newRole, role_name: e.target.value})}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Describe the role and its responsibilities"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="permissions">Permissions</Label>
                <Input
                  id="permissions"
                  value={newRole.permissions}
                  onChange={(e) => setNewRole({...newRole, permissions: e.target.value})}
                  placeholder="Create, Read, Update, Delete (comma separated)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter permissions separated by commas
                </p>
              </div>
              <Button onClick={handleAddRole} className="w-full">
                Add Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                  placeholder="Describe the role and its responsibilities"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-permissions">Permissions</Label>
                <Input
                  id="edit-permissions"
                  value={editingRole.permissions.join(', ')}
                  onChange={(e) => setEditingRole({...editingRole, permissions: e.target.value.split(',').map(p => p.trim()).filter(p => p)})}
                  placeholder="Create, Read, Update, Delete (comma separated)"
                />
              </div>
              <Button onClick={handleEditRole} className="w-full">
                Update Role
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-blue-600" />
                  {role.role_name}
                </CardTitle>
                <Badge className={role.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                  {role.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">{role.description}</p>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions:</h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((permission, index) => (
                    <Badge key={index} className={`text-xs ${getPermissionColor(permission)}`}>
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <Users className="mr-1 h-3 w-3" />
                  Users:
                </span>
                <span className="font-medium">{role.user_count}</span>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setEditingRole(role);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteRole(role.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserRoleMaster;
