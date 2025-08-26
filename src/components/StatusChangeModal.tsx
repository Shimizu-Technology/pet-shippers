import React from 'react';
import { AlertTriangle, Package, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ShipmentStatus } from '../types';
import { getStatusLabel, getStatusDescription, getStatusColor } from '../lib/utils';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: ShipmentStatus;
  newStatus: ShipmentStatus;
  petName: string;
  isLoading?: boolean;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  petName,
  isLoading = false,
}) => {
  const isDowngrade = getStatusPriority(newStatus) < getStatusPriority(currentStatus);
  const isSkippingSteps = Math.abs(getStatusPriority(newStatus) - getStatusPriority(currentStatus)) > 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Confirm Status Change</h3>
            <p className="text-sm text-gray-600">
              You're about to change the status for <span className="font-medium">{petName}</span>
            </p>
          </div>
        </div>

        {/* Status Change Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            {/* Current Status */}
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">CURRENT STATUS</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentStatus)}`}>
                <Package className="w-3 h-3 mr-1" />
                {getStatusLabel(currentStatus)}
              </div>
              <p className="text-xs text-gray-600 mt-1 max-w-xs">
                {getStatusDescription(currentStatus)}
              </p>
            </div>

            {/* Arrow */}
            <div className="px-4">
              <div className="w-8 h-0.5 bg-gray-300 relative">
                <div className="absolute right-0 top-[-3px] w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
              </div>
            </div>

            {/* New Status */}
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">NEW STATUS</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(newStatus)}`}>
                <Package className="w-3 h-3 mr-1" />
                {getStatusLabel(newStatus)}
              </div>
              <p className="text-xs text-gray-600 mt-1 max-w-xs">
                {getStatusDescription(newStatus)}
              </p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(isDowngrade || isSkippingSteps) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">
                  {isDowngrade ? 'Status Downgrade Detected' : 'Skipping Status Steps'}
                </h4>
                <p className="text-sm text-amber-700">
                  {isDowngrade 
                    ? 'You\'re moving the shipment backwards in the process. This may confuse customers about the shipment progress.'
                    : 'You\'re skipping intermediate status steps. Consider if all necessary steps have been completed.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-[#0E2A47] hover:bg-[#1a3a5c] text-white"
          >
            {isLoading ? 'Updating...' : 'Confirm Change'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Helper function to determine status priority for warnings
const getStatusPriority = (status: ShipmentStatus): number => {
  const priorities: Record<ShipmentStatus, number> = {
    'quote_requested': 1,
    'quote_sent': 2,
    'booking_confirmed': 3,
    'documents_pending': 4,
    'documents_approved': 5,
    'flight_scheduled': 6,
    'ready_for_pickup': 7,
    'in_transit': 8,
    'arrived': 9,
    'delivered': 10,
    'completed': 11,
    'cancelled': 0, // Special case - can happen at any time
  };
  return priorities[status] || 0;
};
