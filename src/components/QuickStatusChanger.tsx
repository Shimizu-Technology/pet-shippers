import React, { useState } from 'react';
import { ChevronDown, Package, Edit3 } from 'lucide-react';
import { ShipmentStatus } from '../types';
import { getStatusLabel, getStatusColor } from '../lib/utils';

interface QuickStatusChangerProps {
  currentStatus: ShipmentStatus;
  onStatusChange: (newStatus: ShipmentStatus) => void;
  disabled?: boolean;
  showAllStatuses?: boolean;
}

export const QuickStatusChanger: React.FC<QuickStatusChangerProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
  showAllStatuses = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get next logical statuses or all statuses
  const getAvailableStatuses = (): ShipmentStatus[] => {
    if (showAllStatuses || showAdvanced) {
      return [
        'quote_requested',
        'quote_sent',
        'booking_confirmed',
        'documents_pending',
        'documents_approved',
        'flight_scheduled',
        'ready_for_pickup',
        'in_transit',
        'arrived',
        'delivered',
        'completed',
        'cancelled',
      ];
    }

    // Next logical statuses based on current status
    const statusFlow: Record<ShipmentStatus, ShipmentStatus[]> = {
      quote_requested: ['quote_sent', 'cancelled'],
      quote_sent: ['booking_confirmed', 'cancelled'],
      booking_confirmed: ['documents_pending', 'cancelled'],
      documents_pending: ['documents_approved', 'booking_confirmed'],
      documents_approved: ['flight_scheduled', 'documents_pending'],
      flight_scheduled: ['ready_for_pickup', 'documents_approved'],
      ready_for_pickup: ['in_transit', 'flight_scheduled'],
      in_transit: ['arrived', 'ready_for_pickup'],
      arrived: ['delivered', 'in_transit'],
      delivered: ['completed'],
      completed: [],
      cancelled: [],
    };

    return statusFlow[currentStatus] || [];
  };

  const availableStatuses = getAvailableStatuses().filter(status => status !== currentStatus);

  const handleStatusSelect = (newStatus: ShipmentStatus) => {
    setIsOpen(false);
    onStatusChange(newStatus);
  };

  if (availableStatuses.length === 0 && !showAllStatuses && !showAdvanced) {
    return (
      <div className="text-xs text-gray-500 text-center py-2">
        No status updates available
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Status Display with Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
          disabled 
            ? 'bg-gray-50 cursor-not-allowed' 
            : 'bg-white hover:bg-gray-50 cursor-pointer'
        }`}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Package className="w-3 h-3 text-purple-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(currentStatus)}`}>
              {getStatusLabel(currentStatus)}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Edit3 className="w-3 h-3 text-gray-400" />
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            <div className="p-1">
              {availableStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusSelect(status)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Show All Statuses Toggle */}
              {!showAllStatuses && (
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowAdvanced(!showAdvanced);
                      // Keep dropdown open to show the new options
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-xs text-gray-600"
                  >
                    <div className="flex items-center space-x-2">
                      <Edit3 className="w-3 h-3" />
                      <span>{showAdvanced ? 'Show recommended only' : 'More options...'}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
