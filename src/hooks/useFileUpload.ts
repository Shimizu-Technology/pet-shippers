import { useState } from 'react';
import { useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

// Allowed file types for document uploads
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export type DocumentCategory = 
  | "health_certificate"
  | "vaccination_record"
  | "import_permit"
  | "export_permit"
  | "photo"
  | "other";

export interface UploadOptions {
  conversationId?: Id<"conversations">;
  shipmentId?: Id<"shipments">;
  category: DocumentCategory;
  notes?: string;
  uploadedBy: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  });

  const generateUploadUrl = useConvexMutation(api.documents.generateUploadUrl);
  const createDocument = useConvexMutation(api.documents.createDocument);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File size too large (${fileSizeMB}MB). Maximum size is 10MB.`;
    }

    // Check content type
    if (!ALLOWED_CONTENT_TYPES.includes(file.type as any)) {
      return `Invalid file type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File, options: UploadOptions): Promise<Id<"documents"> | null> => {
    try {
      // Reset state
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        success: false,
      });

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          error: validationError,
        }));
        return null;
      }

      // Generate upload URL
      setUploadState(prev => ({ ...prev, progress: 10 }));
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      setUploadState(prev => ({ ...prev, progress: 30 }));
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();
      setUploadState(prev => ({ ...prev, progress: 70 }));

      // Create document record
      const documentId = await createDocument({
        name: file.name,
        fileId: storageId,
        contentType: file.type,
        size: file.size,
        ...options,
      });

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true,
      });

      return documentId;

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error.message || 'Upload failed. Please try again.',
        success: false,
      });
      return null;
    }
  };

  const resetUploadState = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
    });
  };

  return {
    uploadFile,
    uploadState,
    resetUploadState,
    validateFile,
  };
};
