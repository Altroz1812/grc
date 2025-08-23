
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  onUploadComplete: () => void;
  onSubmit: (assignmentId: string, remarks: string, file: File | null) => Promise<void>;
}

export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpen,
  onClose,
  assignmentId,
  onUploadComplete,
  onSubmit
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    // Reset the input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      alert('Please provide remarks before submitting');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(assignmentId, remarks, file);
      
      // Reset form
      setFile(null);
      setRemarks('');
      onUploadComplete();
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Compliance Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Remarks Section */}
          <div>
            <Label htmlFor="remarks" className="text-sm font-medium">
              Maker Remarks <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="remarks"
              placeholder="Provide details about the compliance task completion, any challenges faced, or additional information..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Please provide detailed remarks about your compliance task completion
            </p>
          </div>

          {/* File Upload Section */}
          <div>
            <Label htmlFor="file-upload" className="text-sm font-medium">
              Supporting Document (Optional)
            </Label>
            
            {!file ? (
              <div className="mt-1">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, XLS, XLSX (MAX. 10MB)
                      </p>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="mt-1 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !remarks.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
