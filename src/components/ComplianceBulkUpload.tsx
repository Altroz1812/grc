
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';

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

  const expectedHeaders = [
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

  const downloadTemplate = () => {
    const csvContent = expectedHeaders.join(',') + '\n' +
      'GRC1001,Sample Compliance,Regulatory,Section A,Short description,Full description,High,Quarterly,CRM,active\n' +
      'GRC1002,Another Compliance,Operational,Section B,Another short description,Another full description,Medium,Quarterly,CRM,active';
    
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

  const validateHeaders = (headers: string[]) => {
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    const missingHeaders = expectedHeaders.filter(h => !normalizedHeaders.includes(h.toLowerCase()));
    return missingHeaders.length === 0 ? null : `Missing headers: ${missingHeaders.join(', ')}`;
  };

  const validateRecordsForDuplicates = async (records: any[]) => {
    console.log('Checking for duplicate compliance_id values...');
    const complianceIds = records
      .map((r, i) => ({ id: r.compliance_id?.trim() || '', row: i + 2 }))
      .filter(r => r.id);
    if (complianceIds.length === 0) {
      console.log('No valid compliance_id values found');
      return ['No valid compliance_id values found'];
    }

    try {
      const { data: existing } = await supabase
        .from('compliances')
        .select('compliance_id')
        .in('compliance_id', complianceIds.map(r => r.id));
      
      console.log('Existing compliance_id values:', existing);
      if (existing && existing.length > 0) {
        const duplicates = existing.map(e => e.compliance_id);
        const duplicateRows = complianceIds
          .filter(c => duplicates.includes(c.id))
          .map(c => `Row ${c.row}: compliance_id '${c.id}' already exists`);
        console.log('Duplicate compliance_id errors:', duplicateRows);
        return duplicateRows;
      }
      console.log('No duplicate compliance_id values found');
      return [];
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return ['Error checking for duplicate compliance_id values'];
    }
  };

  const validateRecord = async (record: any, rowIndex: number) => {
    const errors: string[] = [];
    console.log(`Validating row ${rowIndex}:`, record);

    // Check required fields
    if (!record.compliance_id || record.compliance_id.trim() === '') {
      errors.push('compliance_id is required');
    }
    if (!record.name || record.name.trim() === '') {
      errors.push('name is required');
    }
    if (!record.category || record.category.trim() === '') {
      errors.push('category is required');
    }
    if (!record.frequency || record.frequency.trim() === '') {
      errors.push('frequency is required');
    }

    // Validate status
    const validStatuses = ['active', 'inactive'];
    if (record.status && !validStatuses.includes(record.status.toLowerCase().trim())) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate frequency
    const validFrequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
    if (record.frequency && !validFrequencies.includes(record.frequency.trim())) {
      errors.push(`frequency must be one of: ${validFrequencies.join(', ')}`);
    }

    // Check if department exists (if provided)
    if (record.department_code && record.department_code.trim() !== '') {
      try {
        const { data: dept } = await supabase
          .from('departments')
          .select('code')
          .eq('code', record.department_code.trim())
          .maybeSingle();
        
        if (!dept) {
          errors.push(`department_code '${record.department_code}' does not exist`);
        }
      } catch (error) {
        console.log('Error checking department:', error);
        errors.push(`Error validating department_code '${record.department_code}'`);
      }
    }

    if (errors.length > 0) {
      console.log(`Row ${rowIndex} validation errors:`, errors);
    }
    return errors;
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('Starting file upload process...');

      // Clear previous upload records
      console.log('Clearing previous compliance_bulk_uploads records...');
      const { error: deleteError } = await supabase
        .from('compliance_bulk_uploads')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteError) {
        console.error('Error clearing previous uploads:', deleteError);
        throw new Error(`Failed to clear previous uploads: ${deleteError.message}`);
      }
      console.log('Previous upload records cleared successfully');

      const text = await file.text();
      console.log('File content loaded, length:', text.length);
      
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string) => value.trim(),
      });

      const headers = result.meta.fields || [];
      const headerError = validateHeaders(headers);
      if (headerError) {
        throw new Error(headerError);
      }
      console.log('Headers validated:', headers);

      const data = result.data;
      console.log('Parsed CSV rows:', data.length, data);

      if (data.length === 0) {
        throw new Error('No valid data rows found in CSV file');
      }

      // Check for duplicates in bulk
      const duplicateErrors = await validateRecordsForDuplicates(data);
      if (duplicateErrors.length > 0) {
        throw new Error(`Duplicate compliance_id values found: ${duplicateErrors.join('; ')}`);
      }

      const { data: uploadRecord, error: uploadError } = await supabase
        .from('compliance_bulk_uploads')
        .insert({
          filename: file.name,
          total_records: data.length,
          status: 'processing'
        })
        .select()
        .single();

      if (uploadError) {
        console.error('Error creating upload record:', uploadError);
        throw uploadError;
      }
      console.log('Created upload record:', uploadRecord);

      let successful = 0;
      let failed = 0;
      const errors: string[] = [];
      const validRecords = [];

      // Validate all records
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        const rowNumber = i + 2;
        setUploadProgress(((i + 1) / data.length) * 50);
        const validationErrors = await validateRecord(record, rowNumber);
        if (validationErrors.length > 0) {
          failed++;
          errors.push(`Row ${rowNumber}: ${validationErrors.join(', ')}`);
          console.log(`Row ${rowNumber} failed validation:`, validationErrors);
        } else {
          const validRecord = {
            compliance_id: record.compliance_id ? record.compliance_id.trim() : '',
            name: record.name ? record.name.trim() : '',
            category: record.category ? record.category.trim() : '',
            section: record.section ? record.section.trim() : null,
            short_description: record.short_description ? record.short_description.trim() : null,
            description: record.description ? record.description.trim() : null,
            risk_type: record.risk_type ? record.risk_type.trim() : null,
            frequency: record.frequency ? record.frequency.trim() : '',
            department_code: record.department_code ? record.department_code.trim() : null,
            status: record.status ? record.status.toLowerCase().trim() : 'active'
          };
          // Ensure no 'id' field is included
          if ('id' in validRecord) {
            console.error(`Row ${rowNumber}: Unexpected 'id' field in record`, validRecord);
            errors.push(`Row ${rowNumber}: Unexpected 'id' field in record`);
            failed++;
          } else {
            validRecords.push(validRecord);
          }
        }
      }

      // Exit if no valid records
      if (validRecords.length === 0) {
        throw new Error('No valid records to insert after validation');
      }

      // Log insert payload
      console.log('Insert payload:', JSON.stringify(validRecords, null, 2));

      // Perform individual inserts to isolate UUID issues
      console.log(`Attempting individual inserts for ${validRecords.length} records`);
      for (let i = 0; i < validRecords.length; i++) {
        const record = validRecords[i];
        const rowNumber = i + 2;
        try {
          console.log(`Inserting row ${rowNumber} with compliance_id '${record.compliance_id}':`, record);
          const { error: singleError } = await supabase
            .from('compliances')
            .insert(record);
          if (singleError) {
            failed++;
            let errorMessage = singleError.message;
            if (singleError.code === '23505') {
              if (singleError.message.includes('compliances_compliance_id_key')) {
                const match = singleError.message.match(/Key \(compliance_id\)=\((.*?)\)/);
                errorMessage = match
                  ? `Duplicate compliance_id '${match[1]}'`
                  : `Duplicate compliance_id '${record.compliance_id}'`;
              } else if (singleError.message.includes('compliances_pkey')) {
                errorMessage = `Duplicate primary key (id) for compliance_id '${record.compliance_id}'`;
              }
            }
            errors.push(`Row ${rowNumber}: Insert failed for compliance_id '${record.compliance_id}': ${errorMessage}`);
            console.log(`Row ${rowNumber} insert error:`, JSON.stringify(singleError, null, 2));
          } else {
            successful++;
            console.log(`Row ${rowNumber} inserted successfully with compliance_id '${record.compliance_id}'`);
          }
        } catch (err) {
          failed++;
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Row ${rowNumber}: Insert failed for compliance_id '${record.compliance_id}': ${errorMessage}`);
          console.log(`Row ${rowNumber} processing error:`, err);
        }
        setUploadProgress(50 + ((i + 1) / validRecords.length) * 50);
      }

      setUploadProgress(100);
      console.log(`Updating upload record with results: successful=${successful}, failed=${failed}`);
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
        errors: errors.slice(0, 10)
      });

      if (successful > 0) {
        toast({
          title: "Upload completed",
          description: `${successful} compliances uploaded successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        });
        onUploadComplete();
      } else {
        toast({
          title: "Upload failed",
          description: "No records were successfully uploaded",
          variant: "destructive",
        });
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
          <DialogDescription>
            Upload a CSV file to add multiple compliance records at once. Download the template to ensure correct formatting.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Status must be either 'active' or 'inactive'</li>
              <li>• Frequency must be: Daily, Weekly, Monthly, Quarterly, or Yearly</li>
              <li>• Department codes must exist in your departments table</li>
              <li>• Compliance IDs must be unique</li>
              <li>• Required fields: compliance_id, name, category, frequency</li>
              <li>• If your data contains commas, wrap the field in double quotes</li>
            </ul>
          </div>

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
