
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComplianceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  compliance?: any;
}

export const ComplianceForm: React.FC<ComplianceFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  compliance
}) => {
  const [formData, setFormData] = useState({
    compliance_id: '',
    name: '',
    category: '',
    section: '',
    short_description: '',
    description: '',
    risk_type: '',
    frequency: '',
    department_code: '',
    next_due: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form data whenever dialog opens or compliance prop changes
  useEffect(() => {
    console.log('useEffect triggered - isOpen:', isOpen, 'compliance:', compliance);
    
    if (isOpen) {
      if (compliance) {
        console.log('Setting form data for edit:', compliance);
        setFormData({
          compliance_id: compliance.compliance_id || '',
          name: compliance.name || '',
          category: compliance.category || '',
          section: compliance.section || '',
          short_description: compliance.short_description || '',
          description: compliance.description || '',
          risk_type: compliance.risk_type || '',
          frequency: compliance.frequency || '',
          department_code: compliance.department_code || '',
          next_due: compliance.next_due || '',
          status: compliance.status || 'active'
        });
      } else {
        console.log('Resetting form for new compliance');
        // Reset to empty form for new compliance
        setFormData({
          compliance_id: '',
          name: '',
          category: '',
          section: '',
          short_description: '',
          description: '',
          risk_type: '',
          frequency: '',
          department_code: '',
          next_due: '',
          status: 'active'
        });
      }
    }
  }, [compliance, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting form data:', formData);
      
      if (compliance) {
        console.log('Updating compliance with ID:', compliance.id);
        // Update existing compliance
        const { error } = await supabase
          .from('compliances')
          .update(formData)
          .eq('id', compliance.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        toast({
          title: "Success",
          description: "Compliance updated successfully",
        });
      } else {
        console.log('Creating new compliance');
        // Create new compliance
        const { error } = await supabase
          .from('compliances')
          .insert(formData);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        toast({
          title: "Success",
          description: "Compliance created successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving compliance:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save compliance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    console.log(`Updating field ${field} with value:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Debug: Log current form data
  console.log('Current form data:', formData);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[100vh] overflow-y-auto">
        {/* <DialogContent className="w-full max-w-auto max-h-[80vh] overflow-y-auto flex flex-col"> */}
        <DialogHeader>
          <DialogTitle>
            {compliance ? 'Edit Compliance' : 'Add New Compliance'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="compliance_id">Compliance ID</Label>
              <Input
                id="compliance_id"
                value={formData.compliance_id}
                onChange={(e) => handleChange('compliance_id', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Compliance Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="short_description">Short Description</Label>
            <Input
              id="short_description"
              value={formData.short_description}
              onChange={(e) => handleChange('short_description', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="risk_type">Risk Type</Label>
              <Select value={formData.risk_type} onValueChange={(value) => handleChange('risk_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value) => handleChange('frequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          

          <div>
            <Label htmlFor="department_code">Department Code</Label>
            <Input
              id="department_code"
              value={formData.department_code}
              onChange={(e) => handleChange('department_code', e.target.value)}
            />
          </div>

          

  <div>
    <Label htmlFor="next_due">Due Date</Label>
    <Input
      id="next_due"
      type="date"
      value={formData.next_due}
      onChange={(e) => handleChange('next_due', e.target.value)}
      required
    />
  </div>

          </div>
           <div className="sticky bottom-2 p-1 flex justify-end gap-1">
            <Button type="submit" disabled={loading} className="text-sm px-2 py-1">
              {loading ? 'Saving...' : (compliance ? 'Update' : 'Create')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
