import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Package, Filter, Eye, User, Phone, Mail, Calendar, Plane, FileText, AlertTriangle, Clock, MapPin, Edit3, Check, X } from 'lucide-react';
import { Shipment, ShipmentStatus } from '../types';
import { formatDate, formatDateTime, formatRelativeTime, getStatusColor, getStatusLabel, getStatusDescription } from '../lib/utils';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { PaymentSection } from '../components/PaymentSection';
// Convex imports for real-time shipment data
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const statusOptions: { value: ShipmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'quote_requested', label: 'Quote Requested' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'booking_confirmed', label: 'Booking Confirmed' },
  { value: 'documents_pending', label: 'Documents Pending' },
  { value: 'documents_approved', label: 'Documents Approved' },
  { value: 'flight_scheduled', label: 'Flight Scheduled' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const ShipmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [focusProcessed, setFocusProcessed] = useState(false);
  const [manuallyClosing, setManuallyClosing] = useState(false);
  const [showAdvancedStatus, setShowAdvancedStatus] = useState(false);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const focusShipmentId = searchParams.get('focus');
  const { user } = useAuth();
  const isStaffOrAdmin = ['admin', 'staff'].includes(user?.role || '');

  // 🚀 Use Convex for real-time shipment data
  const convexShipments = useConvexQuery(
    api.shipments.list,
    user ? { userId: user.id, userRole: user.role } : "skip"
  );

  // Transform Convex data to match existing types and apply status filter
  const shipments = convexShipments
    ?.map((convexShip: any) => ({
      id: convexShip._id,
      _id: convexShip._id, // Keep Convex ID for PaymentSection
      conversationId: convexShip.conversationId,
      petName: convexShip.petName,
      petType: convexShip.petType,
      petBreed: convexShip.petBreed,
      petWeight: convexShip.petWeight,
      ownerName: convexShip.ownerName,
      ownerEmail: convexShip.ownerEmail,
      ownerPhone: convexShip.ownerPhone,
      route: convexShip.route,
      status: convexShip.status,
      estimatedDeparture: convexShip.estimatedDeparture,
      estimatedArrival: convexShip.estimatedArrival,
      actualDeparture: convexShip.actualDeparture,
      actualArrival: convexShip.actualArrival,
      flightNumber: convexShip.flightNumber,
      crateSize: convexShip.crateSize,
      specialInstructions: convexShip.specialInstructions,
      // Payment fields - CRITICAL for PaymentSection
      totalAmountCents: convexShip.totalAmountCents,
      paidAmountCents: convexShip.paidAmountCents,
      paymentStatus: convexShip.paymentStatus,
      paymentDueDate: convexShip.paymentDueDate,
      lineItems: convexShip.lineItems,
      paymentHistory: convexShip.paymentHistory,
      createdAt: new Date(convexShip.createdAt).toISOString(),
      updatedAt: new Date(convexShip.updatedAt).toISOString(),
    }))
    ?.filter(shipment => statusFilter === 'all' || shipment.status === statusFilter) || [];

  const isLoading = convexShipments === undefined;

  // 🚀 Use Convex for real-time document data
  const convexDocuments = useConvexQuery(api.documents.list, {});
  
  // Transform Convex documents to match existing types
  const documents = convexDocuments?.map((convexDoc: any) => ({
    id: convexDoc._id,
    name: convexDoc.name,
    type: convexDoc.category, // Map category to type for compatibility
    url: null, // Will be fetched when needed via getFileUrl
    expiresOn: null, // Not applicable for our document system
    shipmentId: convexDoc.shipmentId,
    conversationId: convexDoc.conversationId,
    uploadedBy: convexDoc.uploadedBy,
    createdAt: new Date(convexDoc.createdAt).toISOString(),
  })) || [];

  // Auto-open detail modal if focus parameter is provided
  useEffect(() => {
    if (focusShipmentId && shipments && !focusProcessed && !manuallyClosing) {
      const focusedShipment = shipments.find(s => s.id === focusShipmentId);
      if (focusedShipment) {
        setSelectedShipment(focusedShipment);
        setShowDetailModal(true);
        setFocusProcessed(true);
      }
    }
  }, [focusShipmentId, shipments, focusProcessed, manuallyClosing]);

  // Reset focus processed when focusShipmentId changes (but only for new focus, not clearing)
  useEffect(() => {
    if (focusShipmentId) {
      // New focus parameter - reset states to allow opening
      setFocusProcessed(false);
      setManuallyClosing(false);
    }
  }, [focusShipmentId]);

  // Handle modal close - clear URL parameter and reset state
  const handleCloseModal = useCallback(() => {
    setManuallyClosing(true);
    setShowDetailModal(false);
    setSelectedShipment(null);
    setFocusProcessed(false);
    
    // Clear the focus parameter from URL
    if (focusShipmentId) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('focus');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [focusShipmentId, searchParams, navigate]);

  // 🚀 Use Convex mutations for status updates and editing
  const convexUpdateStatus = useConvexMutation(api.shipments.updateStatus);
  const convexUpdateShipment = useConvexMutation(api.shipments.update);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ShipmentStatus }) =>
      convexUpdateStatus({ 
        id: id as Id<"shipments">, 
        status
      }),
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
      handleCloseModal();
      console.log('Shipment status updated via Convex');
    },
  });

  const updateShipmentMutation = useMutation({
    mutationFn: (data: any) =>
      convexUpdateShipment({
        id: data.id as Id<"shipments">,
        ...data.updates
      }),
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
      setEditingSection(null);
      setEditFormData({});
    },
  });

  const handleStatusUpdate = (shipment: Shipment, newStatus: ShipmentStatus) => {
    updateStatusMutation.mutate({ id: shipment.id, status: newStatus });
  };



  const handleStartInlineEdit = (section: string, shipment: Shipment) => {
    setEditingSection(section);
    // Initialize form data based on section
    switch (section) {
      case 'pet':
        setEditFormData({
          petName: shipment.petName || '',
          petBreed: shipment.petBreed || '',
          petWeight: shipment.petWeight?.toString() || '',
          crateSize: shipment.crateSize || '',
          specialInstructions: shipment.specialInstructions || '',
        });
        break;
      case 'owner':
        setEditFormData({
          ownerName: shipment.ownerName || '',
          ownerEmail: shipment.ownerEmail || '',
          ownerPhone: shipment.ownerPhone || '',
        });
        break;
      case 'flight':
        setEditFormData({
          flightNumber: shipment.flightNumber || '',
          estimatedDeparture: shipment.estimatedDeparture || '',
          estimatedArrival: shipment.estimatedArrival || '',
          actualDeparture: shipment.actualDeparture || '',
          actualArrival: shipment.actualArrival || '',
        });
        break;
    }
  };

  const handleSaveInlineEdit = () => {
    if (!selectedShipment || !editingSection) return;
    
    // Prepare updates based on section
    const updates: any = {};
    const shipment = selectedShipment;
    
    switch (editingSection) {
      case 'pet':
        if (editFormData.petName !== shipment.petName) updates.petName = editFormData.petName;
        if (editFormData.petBreed !== (shipment.petBreed || '')) updates.petBreed = editFormData.petBreed || undefined;
        if (editFormData.petWeight !== (shipment.petWeight?.toString() || '')) {
          updates.petWeight = editFormData.petWeight ? parseFloat(editFormData.petWeight) : undefined;
        }
        if (editFormData.crateSize !== (shipment.crateSize || '')) updates.crateSize = editFormData.crateSize || undefined;
        if (editFormData.specialInstructions !== (shipment.specialInstructions || '')) updates.specialInstructions = editFormData.specialInstructions || undefined;
        break;
      case 'owner':
        if (editFormData.ownerName !== shipment.ownerName) updates.ownerName = editFormData.ownerName;
        if (editFormData.ownerEmail !== (shipment.ownerEmail || '')) updates.ownerEmail = editFormData.ownerEmail || undefined;
        if (editFormData.ownerPhone !== (shipment.ownerPhone || '')) updates.ownerPhone = editFormData.ownerPhone || undefined;
        break;
      case 'flight':
        if (editFormData.flightNumber !== (shipment.flightNumber || '')) updates.flightNumber = editFormData.flightNumber || undefined;
        if (editFormData.estimatedDeparture !== (shipment.estimatedDeparture || '')) updates.estimatedDeparture = editFormData.estimatedDeparture || undefined;
        if (editFormData.estimatedArrival !== (shipment.estimatedArrival || '')) updates.estimatedArrival = editFormData.estimatedArrival || undefined;
        if (editFormData.actualDeparture !== (shipment.actualDeparture || '')) updates.actualDeparture = editFormData.actualDeparture || undefined;
        if (editFormData.actualArrival !== (shipment.actualArrival || '')) updates.actualArrival = editFormData.actualArrival || undefined;
        break;
    }

    if (Object.keys(updates).length > 0) {
      updateShipmentMutation.mutate({
        id: selectedShipment.id,
        updates
      });
    }
    
    setEditingSection(null);
    setEditFormData({});
  };

  const handleCancelInlineEdit = () => {
    setEditingSection(null);
    setEditFormData({});
  };

  const handleInlineInputChange = (field: string, value: string) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const openDetailModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowDetailModal(true);
  };

  const getNextStatuses = (currentStatus: ShipmentStatus): ShipmentStatus[] => {
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

  const getAllStatuses = (): ShipmentStatus[] => {
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
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0E2A47] mb-4">Shipments</h1>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | 'all')}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shipments Table/Cards */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E2A47]"></div>
            <p className="mt-2 text-gray-600">Loading shipments...</p>
          </div>
        ) : shipments?.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No shipments found</h3>
            <p className="mt-2 text-gray-600">
              No shipments match your current filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-0">
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pet & Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flight Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shipments?.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                        <div className="text-sm font-medium text-gray-900">
                          {shipment.petName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {shipment.petBreed} • {shipment.petWeight}lbs
                          </div>
                          <div className="text-xs text-gray-500">
                            {shipment.ownerName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {shipment.route.from} → {shipment.route.to}
                        </div>
                        <div className="text-xs text-gray-500">
                          {shipment.crateSize}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(shipment.status)}`}>
                          {getStatusLabel(shipment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {shipment.flightNumber ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {shipment.flightNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {shipment.estimatedDeparture ? formatDate(shipment.estimatedDeparture) : 'TBD'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not scheduled</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shipment.updatedAt ? formatDate(shipment.updatedAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openDetailModal(shipment)}
                          className="text-[#0E2A47] hover:text-[#0E2A47]/80 transition-colors p-1 rounded hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {shipments?.map((shipment) => (
                <div key={shipment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-[#0E2A47]">
                        {shipment.petName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {shipment.petBreed} • {shipment.petWeight}lbs
                      </p>
                      <p className="text-sm text-gray-600">
                        {shipment.route.from} → {shipment.route.to}
                      </p>
                      <p className="text-xs text-gray-500">
                        Owner: {shipment.ownerName}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(shipment.status)} flex-shrink-0`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                  </div>
                  
                  {shipment.flightNumber && (
                    <div className="mb-3 p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Plane className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{shipment.flightNumber}</span>
                        {shipment.estimatedDeparture && (
                          <span className="text-xs text-gray-500">
                            {formatDate(shipment.estimatedDeparture)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Updated {shipment.updatedAt ? formatDate(shipment.updatedAt) : 'N/A'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailModal(shipment)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={handleCloseModal}
          title={`Shipment Details - ${selectedShipment?.petName || ''}`}
          size="lg"
        >
          {selectedShipment && (
            <div className="space-y-6">
              {/* Pet Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#0E2A47] flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Pet Information
                  </h3>
                  {isStaffOrAdmin && editingSection !== 'pet' && (
                    <button
                      onClick={() => handleStartInlineEdit('pet', selectedShipment)}
                      className="p-1 text-gray-400 hover:text-[#0E2A47] transition-colors rounded hover:bg-gray-200"
                      title="Edit pet information"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {editingSection === 'pet' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveInlineEdit}
                        disabled={updateShipmentMutation.isPending}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors rounded hover:bg-green-100"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelInlineEdit}
                        disabled={updateShipmentMutation.isPending}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-gray-200"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {editingSection === 'pet' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name *</label>
                      <input
                        type="text"
                        value={editFormData.petName || ''}
                        onChange={(e) => handleInlineInputChange('petName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                      <input
                        type="text"
                        value={editFormData.petBreed || ''}
                        onChange={(e) => handleInlineInputChange('petBreed', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editFormData.petWeight || ''}
                        onChange={(e) => handleInlineInputChange('petWeight', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Crate Size</label>
                      <input
                        type="text"
                        value={editFormData.crateSize || ''}
                        onChange={(e) => handleInlineInputChange('crateSize', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                        placeholder="e.g., Large (36x25x27)"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                      <textarea
                        value={editFormData.specialInstructions || ''}
                        onChange={(e) => handleInlineInputChange('specialInstructions', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                        placeholder="Any special requirements or notes..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pet Name</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{selectedShipment.petName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type & Breed</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedShipment.petType.charAt(0).toUpperCase() + selectedShipment.petType.slice(1)} - {selectedShipment.petBreed}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weight</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedShipment.petWeight} lbs</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Crate Size</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedShipment.crateSize || 'TBD'}</p>
                    </div>
                    {selectedShipment.specialInstructions && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                        <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                          {selectedShipment.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Owner Information - Only show to staff/admin */}
              {isStaffOrAdmin && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[#0E2A47] flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Owner Information
                    </h3>
                    {editingSection !== 'owner' && (
                      <button
                        onClick={() => handleStartInlineEdit('owner', selectedShipment)}
                        className="p-1 text-gray-400 hover:text-[#0E2A47] transition-colors rounded hover:bg-blue-200"
                        title="Edit owner information"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {editingSection === 'owner' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveInlineEdit}
                          disabled={updateShipmentMutation.isPending}
                          className="p-1 text-green-600 hover:text-green-700 transition-colors rounded hover:bg-green-100"
                          title="Save changes"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          disabled={updateShipmentMutation.isPending}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-gray-200"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingSection === 'owner' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                        <input
                          type="text"
                          value={editFormData.ownerName || ''}
                          onChange={(e) => handleInlineInputChange('ownerName', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editFormData.ownerEmail || ''}
                          onChange={(e) => handleInlineInputChange('ownerEmail', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editFormData.ownerPhone || ''}
                          onChange={(e) => handleInlineInputChange('ownerPhone', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                        <p className="mt-1 text-sm text-gray-900 font-medium">{selectedShipment.ownerName}</p>
                      </div>
                      {selectedShipment.ownerEmail && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900 flex items-center">
                            <Mail className="w-4 h-4 mr-1 text-gray-400" />
                            {selectedShipment.ownerEmail}
                          </p>
                        </div>
                      )}
                      {selectedShipment.ownerPhone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="mt-1 text-sm text-gray-900 flex items-center">
                            <Phone className="w-4 h-4 mr-1 text-gray-400" />
                            {selectedShipment.ownerPhone}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Route & Flight Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#0E2A47] flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Route & Flight Information
                  </h3>
                  {isStaffOrAdmin && editingSection !== 'flight' && (
                    <button
                      onClick={() => handleStartInlineEdit('flight', selectedShipment)}
                      className="p-1 text-gray-400 hover:text-[#0E2A47] transition-colors rounded hover:bg-green-200"
                      title="Edit flight information"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {editingSection === 'flight' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveInlineEdit}
                        disabled={updateShipmentMutation.isPending}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors rounded hover:bg-green-100"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelInlineEdit}
                        disabled={updateShipmentMutation.isPending}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded hover:bg-gray-200"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {editingSection === 'flight' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number</label>
                      <input
                        type="text"
                        value={editFormData.flightNumber || ''}
                        onChange={(e) => handleInlineInputChange('flightNumber', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                        placeholder="e.g., UA123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Departure</label>
                      <input
                        type="datetime-local"
                        value={editFormData.estimatedDeparture || ''}
                        onChange={(e) => handleInlineInputChange('estimatedDeparture', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Arrival</label>
                      <input
                        type="datetime-local"
                        value={editFormData.estimatedArrival || ''}
                        onChange={(e) => handleInlineInputChange('estimatedArrival', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Actual Departure</label>
                      <input
                        type="datetime-local"
                        value={editFormData.actualDeparture || ''}
                        onChange={(e) => handleInlineInputChange('actualDeparture', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Actual Arrival</label>
                      <input
                        type="datetime-local"
                        value={editFormData.actualArrival || ''}
                        onChange={(e) => handleInlineInputChange('actualArrival', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0E2A47] focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Route</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedShipment.route.from} → {selectedShipment.route.to}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Flight Number</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedShipment.flightNumber || 'Not scheduled'}
                      </p>
                    </div>
                    {selectedShipment.estimatedDeparture && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estimated Departure</label>
                        <p className="mt-1 text-sm text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDateTime(selectedShipment.estimatedDeparture)}
                        </p>
                      </div>
                    )}
                    {selectedShipment.estimatedArrival && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estimated Arrival</label>
                        <p className="mt-1 text-sm text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDateTime(selectedShipment.estimatedArrival)}
                        </p>
                      </div>
                    )}
                    {selectedShipment.actualDeparture && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Actual Departure</label>
                        <p className="mt-1 text-sm text-gray-900 flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-green-500" />
                          {formatDateTime(selectedShipment.actualDeparture)}
                        </p>
                      </div>
                    )}
                    {selectedShipment.actualArrival && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Actual Arrival</label>
                        <p className="mt-1 text-sm text-gray-900 flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-green-500" />
                          {formatDateTime(selectedShipment.actualArrival)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#0E2A47] mb-3">Status Information</h3>
                
                {/* Current Status with Description */}
                <div className="mb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(selectedShipment.status)}`}>
                    {getStatusLabel(selectedShipment.status)}
                  </span>
                    <span className="text-sm text-gray-500">
                      Updated {selectedShipment.updatedAt ? formatRelativeTime(selectedShipment.updatedAt) : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                    <p className="text-sm text-gray-700">
                      {getStatusDescription(selectedShipment.status)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</label>
                    <p className="mt-1 text-gray-900">
                      {selectedShipment.updatedAt ? formatDateTime(selectedShipment.updatedAt) : 'N/A'}
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Created</label>
                    <p className="mt-1 text-gray-900">
                      {formatDateTime(selectedShipment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#0E2A47] mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Documents
                </h3>
                {(() => {
                  const shipmentDocs = documents?.filter(doc => doc.shipmentId === selectedShipment.id) || [];
                  return shipmentDocs.length > 0 ? (
                    <div className="space-y-2">
                      {shipmentDocs.map((doc) => {
                        const isExpiringSoon = doc.expiresOn && new Date(doc.expiresOn) <= new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
                        const isExpired = doc.expiresOn && new Date(doc.expiresOn) <= new Date();
                        
                        return (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {doc.expiresOn && (
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  isExpired ? 'bg-red-100 text-red-800' : 
                                  isExpiringSoon ? 'bg-orange-100 text-orange-800' : 
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {isExpired ? 'Expired' : isExpiringSoon ? 'Expires Soon' : 'Valid'}
                                </span>
                              )}
                              {(isExpired || isExpiringSoon) && (
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No documents uploaded yet</p>
                  );
                })()}
              </div>

              {/* Payment & Billing */}
              <PaymentSection 
                shipment={selectedShipment}
                isStaffOrAdmin={isStaffOrAdmin}
                onPaymentUpdate={() => {
                  // Refresh shipment data - Convex will handle this automatically
                }}
              />

              {/* Admin Actions - Only for staff/admin */}
              {isStaffOrAdmin && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#0E2A47] mb-4">Admin Actions</h3>
                  
                  {/* Status Updates */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Update Status</label>
                    {getNextStatuses(selectedShipment.status).length > 0 ? (
                      <div className="space-y-2">
                        {getNextStatuses(selectedShipment.status).map((status) => (
                          <div key={status} className="flex items-center justify-between p-3 bg-white rounded border hover:border-[#0E2A47] transition-colors">
              <div>
                              <div className="font-medium text-sm">{getStatusLabel(status)}</div>
                              <div className="text-xs text-gray-500">{getStatusDescription(status)}</div>
                            </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedShipment, status)}
                      disabled={updateStatusMutation.isPending}
                              className="ml-3 flex-shrink-0"
                            >
                              {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
                            </Button>
                          </div>
                        ))}
                        
                        {/* Advanced Status Options */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex items-center justify-between p-3 bg-amber-50 rounded border border-amber-200">
                            <div>
                              <div className="font-medium text-sm text-amber-800">Advanced Options</div>
                              <div className="text-xs text-amber-600">Set any status (use with caution)</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAdvancedStatus(!showAdvancedStatus)}
                              className="ml-3 flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
                            >
                              {showAdvancedStatus ? 'Hide' : 'Show'}
                            </Button>
                          </div>
                          
                          {showAdvancedStatus && (
                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                              <div className="grid grid-cols-2 gap-2">
                                {getAllStatuses().filter(status => status !== selectedShipment.status).map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(selectedShipment, status)}
                                    disabled={updateStatusMutation.isPending}
                                    className={`p-2 text-left rounded border text-xs hover:border-[#0E2A47] transition-colors ${
                                      updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                                  >
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 bg-white rounded border">
                        <p className="text-sm">No status updates available</p>
                        <p className="text-xs mt-1">
                          {selectedShipment.status === 'completed' ? 'Shipment is complete' : 
                           selectedShipment.status === 'cancelled' ? 'Shipment was cancelled' :
                           'Contact system administrator'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
                    <div className="grid grid-cols-2 gap-2">

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          // TODO: Implement send notification
                          alert('Send customer notification - Coming soon!');
                        }}
                      >
                        Notify Customer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          handleCloseModal();
                          navigate(`/app/inbox/${selectedShipment.conversationId}`);
                        }}
                      >
                        View Chat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          // TODO: Implement print label
                          alert('Print shipping label - Coming soon!');
                        }}
                      >
                        Print Label
                    </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Read-only message for clients */}
              {!isStaffOrAdmin && (
                <div className="bg-blue-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      You can view shipment details but cannot make changes. Contact our team for updates.
                    </p>
                  </div>
              </div>
              )}
            </div>
          )}
        </Modal>


      </div>
    </Layout>
  );
};

