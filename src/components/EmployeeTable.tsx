
import React from 'react';
import { DataTable } from './ui/data-table';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Mail, Phone } from "lucide-react";

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

interface EmployeeTableProps {
  employees: Employee[];
  onAdd: () => void;
  onEdit: (emp: Employee) => void;
  onDelete: (id: string) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onAdd,
  onEdit,
  onDelete
}) => {
  const columns = [
    { key: 'emp_id', label: 'Employee ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'contact', label: 'Contact', sortable: false },
    { key: 'department_code', label: 'Department', sortable: true },
    { key: 'designation', label: 'Designation', sortable: true },
    { key: 'role_name', label: 'Role', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const filterOptions = {
    department_code: [...new Set(employees.map(emp => emp.department_code))],
    role_name: [...new Set(employees.map(emp => emp.role_name))],
    status: ['active', 'inactive']
  };

  const tableData = employees.map(emp => ({
    ...emp,
    contact: (
      <div className="space-y-1">
        <div className="flex items-center text-sm">
          <Mail className="h-3 w-3 mr-1 text-slate-400" />
          {emp.email}
        </div>
        <div className="flex items-center text-sm">
          <Phone className="h-3 w-3 mr-1 text-slate-400" />
          {emp.phone}
        </div>
      </div>
    ),
    department_code: (
      <Badge variant="outline">{emp.department_code}</Badge>
    ),
    role_name: (
      <Badge className="bg-blue-100 text-blue-800">{emp.role_name}</Badge>
    ),
    status: (
      <Badge className={emp.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
        {emp.status}
      </Badge>
    ),
    actions: (
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(emp)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 hover:text-red-700"
          onClick={() => onDelete(emp.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    )
  }));

  return (
    <DataTable
      columns={columns}
      data={tableData}
      title="Employee Management"
      onAdd={onAdd}
      filterOptions={filterOptions}
    />
  );
};
