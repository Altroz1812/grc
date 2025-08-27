import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SmartAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  complianceId: string;
  complianceName: string;
  onAssignmentComplete: () => void;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department_code: string;
  role_name: string;
}

export const SmartAssignment: React.FC<SmartAssignmentProps> = ({
  isOpen,
  onClose,
  complianceId,
  complianceName,
  onAssignmentComplete
}) => {
  const [availableMakers, setAvailableMakers] = useState<Employee[]>([]);
  const [availableCheckers, setAvailableCheckers] = useState<Employee[]>([]);
  const [selectedMaker, setSelectedMaker] = useState<string>('');
  const [selectedChecker, setSelectedChecker] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && complianceId) {
      fetchSmartAssignmentData();
    }
  }, [isOpen, complianceId]);

  const fetchSmartAssignmentData = async () => {
    setFetchingUsers(true);
    try {
      console.log('Fetching smart assignment data for compliance:', complianceId);
      
      // First get the compliance details to find the department
      const { data: complianceData, error: complianceError } = await supabase
        .from('compliances')
        .select('department_code')
        .eq('id', complianceId)
        .single();

      if (complianceError) {
        console.error('Error fetching compliance:', complianceError);
        throw complianceError;
      }

      console.log('Compliance department:', complianceData?.department_code);

      if (!complianceData?.department_code) {
        toast({
          title: "Error",
          description: "Compliance does not have a department assigned",
          variant: "destructive",
        });
        return;
      }

      // Fetch available employees from the same department
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, email, department_code, role_name')
        .eq('department_code', complianceData.department_code)
        .eq('status', 'active')
        .in('role_name', ['Maker', 'Checker']);

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }

      console.log('Fetched employees:', employeesData);

      // Separate makers and checkers
      const makers = (employeesData || []).filter(emp => 
        emp.role_name?.toLowerCase() === 'maker' || emp.role_name === 'Maker'
      );
      const checkers = (employeesData || []).filter(emp => 
        emp.role_name?.toLowerCase() === 'checker' || emp.role_name === 'Checker'
      );

      console.log('Available makers:', makers);
      console.log('Available checkers:', checkers);

      setAvailableMakers(makers);
      setAvailableCheckers(checkers);

    } catch (error) {
      console.error('Error fetching smart assignment data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assignment options",
        variant: "destructive",
      });
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleAssignment = async () => {
    if (!selectedMaker) {
      toast({
        title: "Error",
        description: "Please select a maker",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const assignmentData = {
        compliance_id: complianceId,
        assigned_to: selectedMaker,
        checker_id: selectedChecker || null,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'draft'
      };

      console.log('Creating assignment:', assignmentData);

      const { error } = await supabase
        .from('compliance_assignments')
        .insert(assignmentData);

      if (error) {
        console.error('Error creating assignment:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

      onAssignmentComplete();
      onClose();
      setSelectedMaker('');
      setSelectedChecker('');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Smart Assignment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">{complianceName}</h4>
            <Badge variant="outline" className="text-xs">ID: {complianceId}</Badge>
          </div>

          {fetchingUsers ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading employees...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="maker">Select Maker *</Label>
                <Select value={selectedMaker} onValueChange={setSelectedMaker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose maker from department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMakers.length === 0 ? (
                      <SelectItem value="no-makers" disabled>
                        No makers available in department
                      </SelectItem>
                    ) : (
                      availableMakers.map(maker => (
                        <SelectItem key={maker.id} value={maker.id}>
                          <div className="flex flex-col">
                            <span>{maker.name}</span>
                            <span className="text-xs text-gray-500">{maker.email}</span>
                            <span className="text-xs text-blue-500">{maker.department_code}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {availableMakers.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No makers available in department</p>
                )}
              </div>

              <div>
                <Label htmlFor="checker">Select Checker (Optional)</Label>
                <Select value={selectedChecker} onValueChange={setSelectedChecker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose checker from department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCheckers.length === 0 ? (
                      <SelectItem value="no-checkers" disabled>
                        No checkers available in department
                      </SelectItem>
                    ) : (
                      availableCheckers.map(checker => (
                        <SelectItem key={checker.id} value={checker.id}>
                          <div className="flex flex-col">
                            <span>{checker.name}</span>
                            <span className="text-xs text-gray-500">{checker.email}</span>
                            <span className="text-xs text-purple-500">{checker.department_code}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {availableCheckers.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">No checkers available in department</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleAssignment} 
              disabled={loading || !selectedMaker || fetchingUsers || selectedMaker === 'no-makers'}
              className="flex-1"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
