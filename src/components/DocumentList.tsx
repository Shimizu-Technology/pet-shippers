import React, { useState } from 'react';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from 'convex/react';
import { 
  FileText, 
  Image, 
  Download, 
  Eye, 
  Trash2, 
  Check, 
  X, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Button } from './ui/Button';
import { formatRelativeTime } from '../lib/utils';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface DocumentListProps {
  conversationId?: Id<"conversations">;
  shipmentId?: Id<"shipments">;
  uploadedBy?: string;
  userRole: 'admin' | 'staff' | 'client' | 'partner';
  showActions?: boolean;
  className?: string;
}

const CATEGORY_LABELS = {
  health_certificate: "Health Certificate",
  vaccination_record: "Vaccination Record",
  import_permit: "Import Permit",
  export_permit: "Export Permit",
  photo: "Photo",
  other: "Other Document",
};

const STATUS_COLORS = {
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  approved: "text-green-600 bg-green-50 border-green-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
};

const STATUS_ICONS = {
  pending: Clock,
  approved: Check,
  rejected: X,
};

export const DocumentList: React.FC<DocumentListProps> = ({
  conversationId,
  shipmentId,
  uploadedBy,
  userRole,
  showActions = true,
  className = ""
}) => {
  const [previewDocument, setPreviewDocument] = useState<{
    fileId: Id<"_storage">;
    fileName: string;
    contentType: string;
  } | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<Id<"_storage"> | null>(null);

  // Always call hooks, but skip queries we don't need
  const conversationDocs = useConvexQuery(
    api.documents.getByConversation,
    conversationId ? { conversationId } : "skip"
  );
  
  const shipmentDocs = useConvexQuery(
    api.documents.getByShipment,
    shipmentId ? { shipmentId } : "skip"
  );
  
  const userDocs = useConvexQuery(
    api.documents.getByUploader,
    uploadedBy ? { uploadedBy, userRole } : "skip"
  );

  // Get file URL for preview or download
  const fileUrl = useConvexQuery(
    api.documents.getFileUrl,
    previewDocument?.fileId || downloadingFileId ? { fileId: previewDocument?.fileId || downloadingFileId } : "skip"
  );

  // Determine which documents to show - handle undefined from skipped queries
  const documents = (conversationId && conversationDocs) || 
                   (shipmentId && shipmentDocs) || 
                   (uploadedBy && userDocs) || 
                   [];

  // Mutations
  const updateDocumentStatus = useConvexMutation(api.documents.updateStatus);
  const deleteDocument = useConvexMutation(api.documents.deleteDocument);

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const handleStatusUpdate = async (docId: Id<"documents">, status: "approved" | "rejected") => {
    try {
      await updateDocumentStatus({ id: docId, status });
      // Success feedback could be added here if needed
    } catch (error) {
      console.error('Failed to update document status:', error);
      alert(`Failed to ${status === 'approved' ? 'approve' : 'reject'} document. Please try again.`);
    }
  };

  const handleDelete = async (docId: Id<"documents">) => {
    const docName = documents.find(doc => doc._id === docId)?.name || 'this document';
    if (!confirm(`Are you sure you want to delete "${docName}"? This action cannot be undone.`)) return;
    
    try {
      await deleteDocument({ id: docId });
      // Success feedback could be added here if needed
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleDownload = (fileId: Id<"_storage">, fileName: string) => {
    setDownloadingFileId(fileId);
  };

  const handleView = (fileId: Id<"_storage">, fileName: string, contentType: string) => {
    setPreviewDocument({ fileId, fileName, contentType });
  };

  const handleClosePreview = () => {
    setPreviewDocument(null);
  };

  const handleDownloadFromPreview = () => {
    if (previewDocument) {
      setDownloadingFileId(previewDocument.fileId);
    }
  };

  // Helper function to clean filename for download
  const cleanFilename = (filename: string): string => {
    // Remove or replace problematic characters
    return filename
      .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Effect to handle download when URL is available
  React.useEffect(() => {
    if (fileUrl && downloadingFileId) {
      const targetDoc = documents.find(doc => doc.fileId === downloadingFileId);
      if (targetDoc) {
        // Force download by fetching the file and creating a blob
        fetch(fileUrl)
          .then(response => response.blob())
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            // Clean the filename to avoid encoding issues
            link.download = cleanFilename(targetDoc.name);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          })
          .catch(error => {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
          })
          .finally(() => {
            setDownloadingFileId(null);
          });
      } else {
        setDownloadingFileId(null);
      }
    }
  }, [fileUrl, downloadingFileId, documents]);

  const canApprove = userRole === 'admin' || userRole === 'staff';
  const canDelete = userRole === 'admin' || userRole === 'staff';

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {documents.map((doc) => {
          const StatusIcon = STATUS_ICONS[doc.status];
          const isDownloading = downloadingFileId === doc.fileId;
          
          return (
            <div key={doc._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
              {/* Document header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  {/* Left: File icon and basic info */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {getFileIcon(doc.contentType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                        {doc.name}
                      </h4>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">{CATEGORY_LABELS[doc.category]}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Status badge */}
                  <div className="flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[doc.status]}`}>
                      <StatusIcon className="w-3 h-3 mr-1.5" />
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                {/* Document metadata */}
                <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                  <span>{(doc.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>Uploaded {formatRelativeTime(new Date(doc.createdAt).toISOString())}</span>
                </div>
              </div>

              {/* Notes section */}
              {doc.notes && (
                <div className="px-4 pb-3">
                  <div className="p-3 bg-gray-50 rounded-md border-l-4 border-blue-200">
                    <p className="text-xs text-gray-700">
                      <span className="font-medium text-gray-900">Note:</span> {doc.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions bar */}
              {showActions && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-center space-x-3">
                    {/* View */}
                    <button
                      onClick={() => handleView(doc.fileId, doc.name, doc.contentType)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Preview document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {/* Download */}
                    <button
                      onClick={() => handleDownload(doc.fileId, doc.name)}
                      disabled={isDownloading}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download document"
                    >
                      {isDownloading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>

                    {/* Approval actions for admin/staff */}
                    {canApprove && doc.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(doc._id, 'approved')}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Approve document"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleStatusUpdate(doc._id, 'rejected')}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Reject document"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Delete action for admin/staff */}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDocument}
        onClose={handleClosePreview}
        fileUrl={previewDocument ? fileUrl : null}
        fileName={previewDocument?.fileName || ''}
        contentType={previewDocument?.contentType || ''}
        onDownload={handleDownloadFromPreview}
      />
    </>
  );
};
