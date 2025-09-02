
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkflowTabs } from './workflow/WorkflowTabs';
import { SmartAssignment } from './workflow/SmartAssignment';
import { FileUploadDialog } from './workflow/FileUploadDialog';
import { WorkflowTable } from './workflow/WorkflowTable';
import { WorkflowFilters } from './workflow/WorkflowFilters';

interface WorkflowItem {
  id: string;
  compliance_id: string;
  assigned_to: string;
  checker_id: string | null;
  due_date: string;
  status: string;
  maker_remarks?: string;
  checker_remarks?: string;
  document_url?: string;
  priority?: string;
  submitted_at?: string;
  completed_at?: string;
  compliance?: {
    name: string;
    frequency: string;
    category: string;
    compliance_id?: string;
  };
  maker?: {
    id: string;
    full_name: string;
    email: string;
    user_role: string;
  };
  checker?: {
    id: string;
    full_name: string;
    email: string;
    user_role: string;
  };
}

interface MakerCheckerWorkflowProps {
  userProfile?: {
    id: string;
    full_name: string;
    email: string;
    role?: string;
    user_role?: string;
    department_code?: string;
  };
}

const MakerCheckerWorkflow: React.FC<MakerCheckerWorkflowProps> = ({ userProfile }) => {
  const [workflowItems, setWorkflowItems] = useState<WorkflowItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned');
  const [showAssignment, setShowAssignment] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<{id: string; name: string} | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    frequency: 'all',
    overdue: 'all'
  });
  const { toast } = useToast();

  const userRole = userProfile?.role || userProfile?.user_role || 'user';
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    fetchCurrentEmployee();
    
    const channel = supabase
      .channel('workflow-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_assignments'
        },
        () => {
          fetchWorkflowItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_user_assignments'
        },
        () => {
          fetchWorkflowItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.email]);

  useEffect(() => {
    applyFilters();
  }, [workflowItems, filters]);

  const fetchCurrentEmployee = async () => {
    if (!userProfile?.email) return;

    try {
      console.log('Fetching employee for email:', userProfile.email);
      
      // First try to find existing employee record
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', userProfile.email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current employee:', error);
        return;
      }

      if (employee) {
        console.log('Current employee found:', employee);
        setCurrentEmployee(employee);
        
        if (employee?.id) {
          fetchWorkflowItems(employee);
        }
        return;
      }

      // If no employee record exists, create one from the user profile
      console.log('No employee record found, creating one for user:', userProfile);
      
      if (userProfile.id && userProfile.email && userProfile.full_name && userProfile.user_role && userProfile.department_code) {
        const { data: newEmployee, error: createError } = await supabase
          .from('employees')
          .insert({
            emp_id: `EMP-${Date.now()}`, // Generate a unique employee ID
            name: userProfile.full_name,
            email: userProfile.email,
            role_name: userProfile.user_role,
            department_code: userProfile.department_code,
            status: 'active'
          })
          .select('*')
          .single();

        if (createError) {
          console.error('Error creating employee record:', createError);
          // Fall back to using profile data directly
          const profileAsEmployee = {
            id: userProfile.id,
            name: userProfile.full_name,
            email: userProfile.email,
            role_name: userProfile.user_role,
            department_code: userProfile.department_code,
            status: 'active'
          };
          setCurrentEmployee(profileAsEmployee);
          fetchWorkflowItems(profileAsEmployee);
        } else {
          console.log('Employee record created:', newEmployee);
          setCurrentEmployee(newEmployee);
          fetchWorkflowItems(newEmployee);
        }
      } else {
        console.log('Insufficient profile data to create employee record, using profile directly');
        // Use profile data directly if we can't create employee record
        const profileAsEmployee = {
          id: userProfile.id,
          name: userProfile.full_name,
          email: userProfile.email,
          role_name: userProfile.user_role,
          department_code: userProfile.department_code,
          status: 'active'
        };
        setCurrentEmployee(profileAsEmployee);
        fetchWorkflowItems(profileAsEmployee);
      }
    } catch (error) {
      console.error('Error in fetchCurrentEmployee:', error);
    }
  };

  // Helper function to extract user data safely
  const extractUserData = (userData: any) => {
    if (!userData) return null;
    
    // Handle both array and single object responses
    const user = Array.isArray(userData) ? userData[0] : userData;
    if (!user) return null;
    
    return {
      id: user.id,
      full_name: user.full_name || user.name || 'Unknown',
      email: user.email || 'Unknown',
      user_role: user.user_role || user.role_name || 'user'
    };
  };

  const fetchWorkflowItems = async (employee?: any) => {
    try {
      setLoading(true);
      const emp = employee || currentEmployee;
      
      if (!emp?.id) {
        console.log('No employee found, cannot fetch workflow items');
        setWorkflowItems([]);
        return;
      }

      console.log('Fetching workflow items for employee:', emp);
      console.log('User role:', userRole, 'Is admin:', isAdmin);
      
      let assignedItems: WorkflowItem[] = [];
      
      // Query compliance_user_assignments to get user's assigned compliances
      const { data: userAssignments, error: userAssignmentsError } = await supabase
        .from('compliance_user_assignments')
        .select(`
          *,
          compliance:compliances(*)
        `)
        .eq('user_id', emp.id)
        .eq('status', 'active');

      if (userAssignmentsError) {
        console.error('Error fetching user assignments:', userAssignmentsError);
        throw userAssignmentsError;
      }

      console.log('Found user assignments:', userAssignments);

      if (userAssignments && userAssignments.length > 0) {
        const complianceIds = userAssignments.map(ua => ua.compliance_id);
        
        // Query or create compliance_assignments for these compliances
        const { data: complianceAssignments, error: assignmentsError } = await supabase
          .from('compliance_assignments')
          .select(`
            id,
            compliance_id,
            assigned_to,
            checker_id,
            due_date,
            status,
            maker_remarks,
            checker_remarks,
            document_url,
            escalation_level,
            created_at,
            updated_at,
            submitted_at,
            completed_at,
            compliance:compliances(*)
          `)
          .in('compliance_id', complianceIds);

        if (assignmentsError) {
          console.error('Error fetching compliance assignments:', assignmentsError);
        }

        console.log('Found compliance assignments:', complianceAssignments);

        // Create workflow items from user assignments, merging with compliance assignments where they exist
        for (const userAssignment of userAssignments) {
          let complianceAssignment = complianceAssignments?.find(
            ca => ca.compliance_id === userAssignment.compliance_id
          );

          // If no compliance assignment exists, create one
          if (!complianceAssignment) {
            console.log('Creating compliance assignment for:', userAssignment.compliance_id);
            
            // Find checker for this compliance (could be another user with checker role)
            const { data: checkers } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_role', 'checker')
              .eq('status', 'active')
              .limit(1);

            const checker = checkers?.[0];

            const { data: newAssignment, error: createError } = await supabase
              .from('compliance_assignments')
              .insert({
                compliance_id: userAssignment.compliance_id,
                assigned_to: emp.id,
                checker_id: checker?.id || null,
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'draft'
              })
              .select(`
                id,
                compliance_id,
                assigned_to,
                checker_id,
                due_date,
                status,
                maker_remarks,
                checker_remarks,
                document_url,
                escalation_level,
                created_at,
                updated_at,
                submitted_at,
                completed_at,
                compliance:compliances(*)
              `)
              .single();

            if (createError) {
              console.error('Error creating compliance assignment:', createError);
            } else {
              complianceAssignment = newAssignment;
            }
          }

          if (complianceAssignment) {
            // Determine priority based on due date
            const dueDate = new Date(complianceAssignment.due_date);
            const today = new Date();
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            let priority = 'low';
            if (diffDays < 0) priority = 'critical';
            else if (diffDays <= 1) priority = 'high';
            else if (diffDays <= 3) priority = 'medium';

            // Fetch maker and checker details separately
            let maker = null;
            let checker = null;
            
            if (complianceAssignment.assigned_to) {
              const { data: makerData } = await supabase
                .from('profiles')
                .select('id, full_name, email, user_role')
                .eq('id', complianceAssignment.assigned_to)
                .single();
              maker = makerData;
            }
            
            if (complianceAssignment.checker_id) {
              const { data: checkerData } = await supabase
                .from('profiles')
                .select('id, full_name, email, user_role')
                .eq('id', complianceAssignment.checker_id)
                .single();
              checker = checkerData;
            }

            const workflowItem: WorkflowItem = {
              id: complianceAssignment.id,
              compliance_id: userAssignment.compliance_id,
              assigned_to: complianceAssignment.assigned_to,
              checker_id: complianceAssignment.checker_id,
              due_date: complianceAssignment.due_date,
              status: complianceAssignment.status,
              maker_remarks: complianceAssignment.maker_remarks,
              checker_remarks: complianceAssignment.checker_remarks,
              document_url: complianceAssignment.document_url,
              submitted_at: complianceAssignment.submitted_at,
              completed_at: complianceAssignment.completed_at,
              priority,
               compliance: {
                 name: userAssignment.compliance?.name || 'Unknown Compliance',
                 frequency: userAssignment.compliance?.frequency || 'Unknown',
                 category: userAssignment.compliance?.category || 'General',
                 compliance_id: userAssignment.compliance?.compliance_id || userAssignment.compliance_id
                },
               maker: extractUserData(maker),
               checker: extractUserData(checker)
             };

            // Apply role-based filtering
            const userRoleInCompliance = emp.role_name?.toLowerCase();
            
            if (userRoleInCompliance === 'maker') {
              // Makers see all their assigned tasks
              if (complianceAssignment.assigned_to === emp.id) {
                assignedItems.push(workflowItem);
              }
            } else if (userRoleInCompliance === 'checker') {
              // Checkers see submitted tasks for review and completed cases they handled
              if (complianceAssignment.checker_id === emp.id && 
                  ['submitted', 'approved', 'rejected'].includes(complianceAssignment.status)) {
                assignedItems.push(workflowItem);
              }
            } else if (isAdmin) {
              // Admins see everything
              assignedItems.push(workflowItem);
            }
          }
        }
      }

      // For admin users, also fetch unassigned compliances
      let unassignedItems: WorkflowItem[] = [];
      if (isAdmin) {
        const assignedComplianceIds = assignedItems.map(item => item.compliance_id);
        
        let unassignedQuery = supabase
          .from('compliances')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (assignedComplianceIds.length > 0) {
          unassignedQuery = unassignedQuery.not('id', 'in', `(${assignedComplianceIds.join(',')})`);
        }

        const { data: unassignedCompliances, error: compliancesError } = await unassignedQuery;

        if (compliancesError) {
          console.error('Error fetching unassigned compliances:', compliancesError);
        } else {
          unassignedItems = unassignedCompliances?.map(compliance => ({
            id: `unassigned-${compliance.id}`,
            compliance_id: compliance.id,
            assigned_to: null,
            checker_id: null,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'unassigned',
            priority: 'medium',
             compliance: {
               name: compliance.name,
               frequency: compliance.frequency,
               category: compliance.category,
               compliance_id: compliance.compliance_id
             }
          })) || [];
        }
      }

      console.log('Final assigned items:', assignedItems);
      console.log('Final unassigned items:', unassignedItems);
      setWorkflowItems([...assignedItems, ...unassignedItems]);
    } catch (error) {
      console.error('Error fetching workflow items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workflow items: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...workflowItems];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }

    // Frequency filter
    if (filters.frequency !== 'all') {
      filtered = filtered.filter(item => item.compliance?.frequency === filters.frequency);
    }

    // Overdue filter
    if (filters.overdue === 'overdue') {
      const today = new Date();
      filtered = filtered.filter(item => {
        const dueDate = new Date(item.due_date);
        return dueDate < today && item.status !== 'approved';
      });
    } else if (filters.overdue === 'upcoming') {
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => {
        const dueDate = new Date(item.due_date);
        return dueDate >= today && dueDate <= threeDaysFromNow;
      });
    }

    setFilteredItems(filtered);
  };

  const handleUpload = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setShowUpload(true);
  };

  // Get current assignment data for the dialog
  const getCurrentAssignmentData = () => {
    const assignment = workflowItems.find(item => item.id === selectedAssignmentId);
    return {
      makerRemarks: assignment?.maker_remarks || '',
      checkerRemarks: assignment?.checker_remarks || '',
      status: assignment?.status || 'draft',
      fileUrl: assignment?.document_url || '',
      fileName: assignment?.document_url ? assignment.document_url.split('/').pop() || 'Document' : ''
    };
  };

  const handleAssign = (complianceId: string, complianceName: string) => {
    setSelectedCompliance({ id: complianceId, name: complianceName });
    setShowAssignment(true);
  };

  const handleApprove = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_assignments')
        .update({ 
          status: 'approved',
          checker_remarks: 'Approved by checker',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment approved successfully",
      });

      await fetchWorkflowItems();
    } catch (error) {
      console.error('Error approving assignment:', error);
      toast({
        title: "Error",
        description: "Failed to approve assignment",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_assignments')
        .update({ 
          status: 'rejected',
          checker_remarks: 'Rejected by checker - requires revision',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment rejected",
      });

      await fetchWorkflowItems();
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to reject assignment",
        variant: "destructive",
      });
    }
  };

  const handleSendBack = async (assignmentId: string, remarks: string) => {
    try {
      const { error } = await supabase
        .from('compliance_assignments')
        .update({ 
          status: 'draft',
          checker_remarks: remarks
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment sent back to maker",
      });

      await fetchWorkflowItems();
    } catch (error) {
      console.error('Error sending back assignment:', error);
      toast({
        title: "Error",
        description: "Failed to send back assignment",
        variant: "destructive",
      });
    }
  };

  const handleAction = (action: string, item: WorkflowItem) => {
    switch (action) {
      case 'view':
        // For now, show a toast with compliance details
        toast({
          title: item.compliance?.name || 'Compliance Task',
          description: `Status: ${item.status} | Due: ${item.due_date} | Priority: ${item.priority}`,
        });
        break;
      case 'submit':
        if (item.id) {
          handleUpload(item.id);
        }
        break;
      case 'resubmit':
        if (item.id) {
          handleUpload(item.id);
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleSubmitAsMaker = async (assignmentId: string, remarks: string, file: File | null) => {
    try {
      setLoading(true);
      console.log('Starting submission process for assignment:', assignmentId);

      let documentUrl = null;

      // Handle file upload if provided
      if (file) {
        console.log('Uploading file:', file.name);
        const fileExt = file.name.split('.').pop();
        const fileName = `${assignmentId}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('compliance-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('compliance-documents')
          .getPublicUrl(fileName);

        documentUrl = publicUrlData?.publicUrl;
        console.log('File uploaded successfully:', documentUrl);
      }

      // Update compliance assignment with all necessary fields - using 'submitted' status
      const updateData = {
        maker_remarks: remarks,
        document_url: documentUrl,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Updating assignment with data:', updateData);

      const { data: updatedAssignment, error } = await supabase
        .from('compliance_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Assignment updated successfully:', updatedAssignment);

      toast({
        title: "Submitted Successfully",
        description: "Task submitted for checker review. Status changed to 'Submitted'.",
      });

      await fetchWorkflowItems();
    } catch (error) {
      console.error("Submit failed:", error);
      toast({
        title: "Error",
        description: "Failed to submit for review: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter items by status for different tabs
  const assignedItems = filteredItems.filter(item => 
    item.assigned_to !== null && 
    !['approved', 'completed', 'rejected'].includes(item.status)
  );
  
  const completedItems = filteredItems.filter(item => 
    ['approved', 'completed'].includes(item.status)
  );
  
  const overdueItems = filteredItems.filter(item => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(item.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today && !['approved', 'completed'].includes(item.status);
  });
  
  const sendbackItems = filteredItems.filter(item => 
    item.status === 'rejected' || (item.status === 'draft' && item.checker_remarks)
  );
  
  const unassignedItems = filteredItems.filter(item => item.assigned_to === null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isAdmin ? 'Maker-Checker Workflow Management' : 'My Worklist'}
          </h1> */}
          {/* <p className="text-gray-600">
            {isAdmin 
              ? 'Smart assignment and compliance workflow management' 
              : `Your assigned compliance tasks and workflow (Employee: ${currentEmployee?.id || 'Not found'})`
            }
          </p> */}
          {!isAdmin && (
            <div className="mt-2 text-sm text-gray-500">
              Email: {userProfile?.email} | Role: {currentEmployee?.role_name || userRole} | Tasks: {assignedItems.length}
            </div>
          )}
        </div>

        {/* Filters */}
        <WorkflowFilters
          filters={filters}
          onFiltersChange={setFilters}
          workflowItems={workflowItems}
        />

        {isAdmin ? (
          <WorkflowTabs
            assignedItems={assignedItems}
            unassignedItems={unassignedItems}
            completedItems={completedItems}
            overdueItems={overdueItems}
            sendbackItems={sendbackItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isAdmin={isAdmin}
          >
            <div className="w-full">
              {(() => {
                let currentItems = [];
                let emptyMessage = "";
                
                switch(activeTab) {
                  case 'assigned':
                    currentItems = assignedItems;
                    emptyMessage = "No assigned tasks found";
                    break;
                  case 'completed':
                    currentItems = completedItems;
                    emptyMessage = "No completed tasks found";
                    break;
                  case 'overdue':
                    currentItems = overdueItems;
                    emptyMessage = "No overdue tasks found";
                    break;
                  case 'sendback':
                    currentItems = sendbackItems;
                    emptyMessage = "No sendback tasks found";
                    break;
                  case 'unassigned':
                    currentItems = unassignedItems;
                    emptyMessage = "No unassigned tasks found";
                    break;
                  default:
                    currentItems = assignedItems;
                    emptyMessage = "No tasks found";
                }

                return (
                  <WorkflowTable
                    items={currentItems}
                    userRole={userRole}
                    currentUserId={currentEmployee?.id || ''}
                    onAction={handleAction}
                    onUpload={activeTab === 'unassigned' ? undefined : handleUpload}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onSendBack={handleSendBack}
                    onAssign={activeTab === 'unassigned' ? handleAssign : undefined}
                  />
                );
              })()}
            </div>
          </WorkflowTabs>
        ) : (
          <WorkflowTabs
            assignedItems={assignedItems}
            unassignedItems={[]}
            completedItems={completedItems}
            overdueItems={overdueItems}
            sendbackItems={sendbackItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isAdmin={isAdmin}
          >
            <div className="w-full">
              {(() => {
                let currentItems = [];
                let emptyMessage = "";
                let emptyIcon = null;
                
                switch(activeTab) {
                  case 'assigned':
                    currentItems = assignedItems;
                    emptyMessage = "You don't have any active compliance tasks assigned to you at the moment.";
                    emptyIcon = (
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    );
                    break;
                  case 'completed':
                    currentItems = completedItems;
                    emptyMessage = "No completed tasks found.";
                    emptyIcon = (
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    );
                    break;
                  case 'overdue':
                    currentItems = overdueItems;
                    emptyMessage = "No overdue tasks found.";
                    emptyIcon = (
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    );
                    break;
                  case 'sendback':
                    currentItems = sendbackItems;
                    emptyMessage = "No tasks sent back for revision.";
                    emptyIcon = (
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    );
                    break;
                  default:
                    currentItems = assignedItems;
                    emptyMessage = "No tasks found.";
                }

                return (
                  <WorkflowTable
                    items={currentItems}
                    userRole={userRole}
                    currentUserId={currentEmployee?.id || ''}
                    onAction={handleAction}
                    onUpload={handleUpload}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onSendBack={handleSendBack}
                  />
                );
              })()}
            </div>
          </WorkflowTabs>
        )}

        {selectedCompliance && (
          <SmartAssignment
            isOpen={showAssignment}
            onClose={() => {
              setShowAssignment(false);
              setSelectedCompliance(null);
            }}
            complianceId={selectedCompliance.id}
            complianceName={selectedCompliance.name}
            onAssignmentComplete={() => fetchWorkflowItems()}
          />
        )}

        <FileUploadDialog
          isOpen={showUpload}
          onClose={() => {
            setShowUpload(false);
            setSelectedAssignmentId('');
          }}
          assignmentId={selectedAssignmentId}
          onUploadComplete={() => fetchWorkflowItems()}
          onSubmit={handleSubmitAsMaker}
          userRole={userRole}
          existingMakerRemarks={getCurrentAssignmentData().makerRemarks}
          existingCheckerRemarks={getCurrentAssignmentData().checkerRemarks}
          workflowStatus={getCurrentAssignmentData().status}
          existingFileUrl={getCurrentAssignmentData().fileUrl}
          existingFileName={getCurrentAssignmentData().fileName}
        />
      </div>
    </div>
  );
};

export default MakerCheckerWorkflow;