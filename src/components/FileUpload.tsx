import React, { useState, useRef } from 'react';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useFileUpload, DocumentCategory, UploadOptions } from '../hooks/useFileUpload';
import { Id } from '../../convex/_generated/dataModel';

interface FileUploadProps {
  onUploadComplete: (documentId: Id<"documents">) => void;
  conversationId?: Id<"conversations">;
  shipmentId?: Id<"shipments">;
  uploadedBy: string;
  className?: string;
  multiple?: boolean;
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  health_certificate: "Health Certificate",
  vaccination_record: "Vaccination Record",
  import_permit: "Import Permit",
  export_permit: "Export Permit",
  photo: "Photo",
  other: "Other Document",
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  conversationId,
  shipmentId,
  uploadedBy,
  className = "",
  multiple = true
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [notes, setNotes] = useState("");
  const [showDropzone, setShowDropzone] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploadState, resetUploadState } = useFileUpload();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (multiple) {
      setSelectedFiles(prev => [...prev, ...fileArray]);
    } else {
      setSelectedFiles([fileArray[0]]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const uploadOptions: UploadOptions = {
      conversationId,
      shipmentId,
      category,
      notes: notes.trim() || undefined,
      uploadedBy,
    };

    try {
      // Upload files one by one
      for (const file of selectedFiles) {
        const documentId = await uploadFile(file, uploadOptions);
        if (documentId) {
          onUploadComplete(documentId);
        }
      }

      // Reset form on success
      if (uploadState.success) {
        setSelectedFiles([]);
        setNotes("");
        resetUploadState();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setShowDropzone(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setShowDropzone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setShowDropzone(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          showDropzone
            ? 'border-[#0E2A47] bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or{' '}
          <span className="text-[#0E2A47] font-medium">
            browse
          </span>
        </p>
        <p className="text-xs text-gray-500">
          Supports: PDF, DOC, DOCX, JPG, PNG, WEBP (Max 10MB each)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <File className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
          placeholder="Add any notes about these documents..."
        />
      </div>

      {/* Upload Progress */}
      {uploadState.isUploading && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#0E2A47] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{uploadState.progress}%</span>
          </div>
          <p className="text-sm text-gray-600">Uploading files...</p>
        </div>
      )}

      {/* Error Message */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{uploadState.error}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadState.success && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-600">Files uploaded successfully!</p>
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploadState.isUploading}
        className="w-full bg-[#0E2A47] hover:bg-[#1a3a5c]"
      >
        {uploadState.isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 'Files'}
          </>
        )}
      </Button>
    </div>
  );
};
