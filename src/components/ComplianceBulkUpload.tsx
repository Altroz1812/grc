
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BulkUploadProps {
  onUploadComplete: () => void;
}

export const ComplianceBulkUpload: React.FC<BulkUploadProps> = ({ onUploadComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      'compliance_id',
      'name',
      'category',
      'section',
      'short_description',
      'description',
      'risk_type',
      'frequency',
      'department_code',
      'status'
    ];
    
    const csvContent = headers.join(',') + '\n' +
      'COMP001,Sample Compliance,Regulatory,Section A,Short description,Full description,High,Monthly,DEPT001,active\n' +
      'COMP002,Another Compliance,Operational,Section B,Another short description,Another full description,Medium,Quarterly,DEPT002,active';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'compliance_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  };

  const validateRecord = async (record: any, rowIndex: number) => {
    const errors: string[] = [];

    // Check required fields
    if (!record.compliance_id) errors.push('compliance_id is required');
    if (!record.name) errors.push('name is required');
    if (!record.category) errors.push('category is required');
    if (!record.frequency) errors.push('frequency is required');

    // Validate status
    const validStatuses = ['active', 'inactive'];
    if (record.status && !validStatuses.includes(record.status.toLowerCase())) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate frequency
    const validFrequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
    if (record.frequency && !validFrequencies.includes(record.frequency)) {
      errors.push(`frequency must be one of: ${validFrequencies.join(', ')}`);
    }

    // Check if department exists (if provided)
    if (record.department_code && record.department_code.trim() !== '') {
      const { data: dept } = await supabase
        .from('departments')
        .select('code')
        .eq('code', record.department_code)
        .single();
      
      if (!dept) {
        errors.push(`department_code '${record.department_code}' does not exist`);
      }
    }

    // Check for duplicate compliance_id
    const { data: existing } = await supabase
      .from('compliances')
      .select('compliance_id')
      .eq('compliance_id', record.compliance_id)
      .single();
    
    if (existing) {
      errors.push(`compliance_id '${record.compliance_id}' already exists`);
    }

    return errors;
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      // Create bulk upload record
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('compliance_bulk_uploads')
        .insert({
          filename: file.name,
          total_records: data.length,
          status: 'processing'
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process each record with validation
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        setUploadProgress(((i + 1) / data.length) * 100);

        try {
          // Validate record first
          const validationErrors = await validateRecord(record, i + 2);
          
          if (validationErrors.length > 0) {
            failed++;
            errors.push(`Row ${i + 2}: ${validationErrors.join(', ')}`);
            continue;
          }

          // Insert record
          const { error } = await supabase
            .from('compliances')
            .insert({
              compliance_id: record.compliance_id,
              name: record.name,
              category: record.category,
              section: record.section || null,
              short_description: record.short_description || null,
              description: record.description || null,
              risk_type: record.risk_type || null,
              frequency: record.frequency,
              department_code: record.department_code || null,
              status: record.status?.toLowerCase() || 'active'
            });

          if (error) {
            failed++;
            errors.push(`Row ${i + 2}: ${error.message}`);
          } else {
            successful++;
          }
        } catch (err) {
          failed++;
          errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Update bulk upload record
      await supabase
        .from('compliance_bulk_uploads')
        .update({
          successful_records: successful,
          failed_records: failed,
          status: 'completed',
          error_log: errors.length > 0 ? errors : null,
          completed_at: new Date().toISOString()
        })
        .eq('id', uploadRecord.id);

      setUploadResult({
        total: data.length,
        successful,
        failed,
        errors: errors.slice(0, 10) // Show first 10 errors
      });

      if (successful > 0) {
        toast({
          title: "Upload completed",
          description: `${successful} compliances uploaded successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        });
        onUploadComplete();
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Compliances</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Download Template</h3>
                <p className="text-sm text-blue-700">Get the CSV template with required columns and sample data</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Status must be either 'active' or 'inactive'</li>
              <li>• Frequency must be: Daily, Weekly, Monthly, Quarterly, or Yearly</li>
              <li>• Department codes must exist in your departments table</li>
              <li>• Compliance IDs must be unique</li>
              <li>• Required fields: compliance_id, name, category, frequency</li>
            </ul>
          </div>

          {/* File Upload */}
          {!uploadResult && (
            <div className="space-y-4">
              <div>
                <label htmlFor="csv-file" className="block text-sm font-medium mb-2">
                  Select CSV File
                </label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleFileUpload}
                  disabled={!file || uploading}
                  className="flex-1"
                >
                  {uploading ? "Processing..." : "Upload"}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Upload Results</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{uploadResult.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                      <CheckCircle className="h-5 w-5" />
                      {uploadResult.successful}
                    </div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                      <AlertCircle className="h-5 w-5" />
                      {uploadResult.failed}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                    <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                      {uploadResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700">{error}</div>
                      ))}
                      {uploadResult.failed > 10 && (
                        <div className="text-sm text-red-600 mt-2">
                          ... and {uploadResult.failed - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={resetUpload} className="w-full">
                Upload Another File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
