import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { Modal } from './ui/Modal';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
  contentType: string;
  onDownload: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  contentType,
  onDownload
}) => {
  if (!isOpen || !fileUrl) return null;

  const isImage = contentType.startsWith('image/');
  const isPdf = contentType === 'application/pdf';

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500">
              {contentType} • Preview
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={onDownload}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Download document"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 bg-gray-50">
          {isImage ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={fileName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Preview not available
              </h4>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onDownload}
                  className="inline-flex items-center px-4 py-2 bg-[#0E2A47] text-white rounded-lg hover:bg-[#1a3a5c] transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download to view
                </button>
                <button
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in new tab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
