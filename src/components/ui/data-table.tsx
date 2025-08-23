
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Plus } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title: string;
  onAdd?: () => void;
  onExport?: () => void;
  filterOptions?: { [key: string]: string[] };
  customActions?: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  title,
  onAdd,
  onExport,
  filterOptions = {},
  customActions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = data.filter(item => {
    // Search filter
    const matchesSearch = Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Column filters
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value || value === 'all') return true;
      return String(item[key]).toLowerCase() === value.toLowerCase();
    });

    return matchesSearch && matchesFilters;
  });

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <div className="flex items-center gap-3">
          {customActions}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {Object.entries(filterOptions).map(([key, options]) => (
          <div key={key} className="min-w-40">
            <Select
              value={filters[key] || 'all'}
              onValueChange={(value) => setFilters(prev => ({ ...prev, [key]: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Filter by ${key}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {key}</SelectItem>
                {options.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {(Object.values(filters).some(v => v && v !== 'all') || searchTerm) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setFilters({});
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {columns.map(column => (
                <TableHead
                  key={column.key}
                  className={`font-semibold text-slate-700 ${column.sortable ? 'cursor-pointer hover:text-slate-900' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow key={index} className="hover:bg-slate-50">
                {columns.map(column => (
                  <TableCell key={column.key} className="text-slate-600">
                    {item[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sortedData.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No data found matching your criteria
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-500">
        Showing {sortedData.length} of {data.length} results
      </div>
    </div>
  );
};
