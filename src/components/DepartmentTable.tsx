
import React from 'react';
import { DataTable } from './ui/data-table';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  status: 'active' | 'inactive';
  employee_count: number;
}

interface DepartmentTableProps {
  departments: Department[];
  onAdd: () => void;
  onEdit: (dept: Department) => void;
  onDelete: (id: string) => void;
}

export const DepartmentTable: React.FC<DepartmentTableProps> = ({
  departments,
  onAdd,
  onEdit,
  onDelete
}) => {
  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Department Name', sortable: true },
    { key: 'head', label: 'Department Head', sortable: true },
    { key: 'employee_count', label: 'Employees', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const filterOptions = {
    status: ['active', 'inactive']
  };

  const tableData = departments.map(dept => ({
    ...dept,
    status: (
      <Badge className={dept.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
        {dept.status}
      </Badge>
    ),
    actions: (
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(dept)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 hover:text-red-700"
          onClick={() => onDelete(dept.id)}
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
      title="Departments Management"
      onAdd={onAdd}
      filterOptions={filterOptions}
    />
  );
};
