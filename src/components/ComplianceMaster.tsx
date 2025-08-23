import React, { useState, useEffect } from 'react';
import { ComplianceTable } from './ComplianceTable';
import { ComplianceForm } from './ComplianceForm';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Compliance {
  id: string;
  compliance_id: string;
  category: string;
  name: string;
  section: string;
  short_description: string;
  description: string;
  risk_type: string;
  frequency: string;
  department_code: string;
  status: string;
  next_due: string;
}

const ComplianceMaster: React.FC = () => {
  const [compliances, setCompliances] = useState<Compliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<Compliance | null>(null);
  const { toast } = useToast();

  const fetchCompliances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compliances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompliances(data || []);
    } catch (error) {
      console.error('Error fetching compliances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch compliances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliances();
  }, []);

  const handleAdd = () => {
    setSelectedCompliance(null);
    setShowForm(true);
  };

  const handleEdit = (compliance: Compliance) => {
    setSelectedCompliance(compliance);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCompliance(null);
  };

  const handleFormSuccess = () => {
    fetchCompliances();
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('compliances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance deleted successfully",
      });

      fetchCompliances();
    } catch (error) {
      console.error('Error deleting compliance:', error);
      toast({
        title: "Error",
        description: "Failed to delete compliance",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <ComplianceTable
          compliances={compliances}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchCompliances}
        />
        
        <ComplianceForm
          isOpen={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          compliance={selectedCompliance}
        />
      </div>
    </div>
  );
};

export default ComplianceMaster;
