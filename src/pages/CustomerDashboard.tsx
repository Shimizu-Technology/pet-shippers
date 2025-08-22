import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Package, MessageCircle, FileText, Clock, Plus, Send, User } from 'lucide-react';
import { Document } from '../types';
import { getStatusColor, getStatusLabel, formatRelativeTime } from '../lib/utils';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
// Convex imports for testing
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from '../contexts/AuthContext';

export const CustomerDashboardPage: React.FC = () => {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    petName: '',
    petType: 'dog' as 'dog' | 'cat' | 'other',
    petBreed: '',
    petWeight: '',
    fromLocation: '',
    toLocation: '',
    travelDate: '',
    specialRequirements: ''
  });
  const { user } = useAuth();

  // Convex queries for dashboard data
  const convexConversations = useConvexQuery(
    api.conversations.list, 
    user ? { userId: user.id, userRole: user.role } : "skip"
  );

  // 🚀 Use Convex queries instead of mock API
  const convexShipments = useConvexQuery(
    api.shipments.list,
    user ? { userId: user.id, userRole: user.role } : "skip"
  );

  // Transform Convex data to match existing types
  const shipments = convexShipments?.map((convexShip: any) => ({
    id: convexShip._id,
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
    createdAt: new Date(convexShip.createdAt).toISOString(),
    updatedAt: new Date(convexShip.updatedAt).toISOString(),
  })) || [];

  // Transform conversations
  const conversations = convexConversations?.map((convexConv: any) => ({
    id: convexConv._id,
    title: convexConv.title,
    participantIds: convexConv.participantIds,
    lastMessageAt: new Date(convexConv.lastMessageAt).toISOString(),
    kind: convexConv.kind,
  })) || [];

  // For now, use empty documents array (we can add Convex documents later)
  const documents: Document[] = [];

  // Loading states
  const shipmentsLoading = convexShipments === undefined;
  const conversationsLoading = convexConversations === undefined;
  const documentsLoading = false;

  const activeShipments = shipments?.filter(s => 
    s.status !== 'delivered' && s.status !== 'completed'
  ) || [];

  const recentConversations = conversations?.slice(0, 3) || [];

  // 🚀 Use Convex mutation for quote requests
  const convexCreateQuoteRequest = useConvexMutation(api.quoteRequests.create);

  const submitQuoteRequestMutation = useMutation({
    mutationFn: async (data: typeof quoteForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      return await convexCreateQuoteRequest({
        petName: data.petName,
        petType: data.petType,
        petBreed: data.petBreed,
        petWeight: parseInt(data.petWeight) || 0,
        route: {
          from: data.fromLocation,
          to: data.toLocation
        },
        preferredTravelDate: data.travelDate,
        specialRequirements: data.specialRequirements,
        customerUserId: user.id,
      });
    },
    onSuccess: () => {
      // No need to invalidate queries since Convex is real-time
      setShowQuoteModal(false);
      setQuoteForm({
        petName: '',
        petType: 'dog',
        petBreed: '',
        petWeight: '',
        fromLocation: '',
        toLocation: '',
        travelDate: '',
        specialRequirements: ''
      });
    }
  });

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteForm.petName && quoteForm.fromLocation && quoteForm.toLocation) {
      submitQuoteRequestMutation.mutate(quoteForm);
    }
  };

  // Add error handling for data loading
  if (shipmentsLoading || conversationsLoading || documentsLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E2A47] mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">


        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-navy mb-2 sm:mb-3 leading-tight">Reuniting Your Family</h1>
              <p className="text-base sm:text-lg text-brand-sky leading-relaxed max-w-2xl">We're committed to reuniting families with their furry loved ones by providing services that will lessen the stress in your move. We will be with you the whole way!</p>
            </div>
            <div className="w-full sm:w-auto">
              <Button
                onClick={() => setShowQuoteModal(true)}
                className="bg-brand-coral hover:bg-red-500 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto px-6 py-3 text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Request Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-sky/20 flex items-center justify-center mb-2 sm:mb-0">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-brand-sky" />
              </div>
              <div className="sm:ml-4">
                <p className="text-2xl sm:text-3xl font-bold text-brand-navy">{activeShipments.length}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Shipments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-coral/20 flex items-center justify-center mb-2 sm:mb-0">
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-brand-coral" />
              </div>
              <div className="sm:ml-4">
                <p className="text-2xl sm:text-3xl font-bold text-brand-navy">{conversations?.length || 0}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Conversations</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-100 flex items-center justify-center mb-2 sm:mb-0">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              </div>
              <div className="sm:ml-4">
                <p className="text-2xl sm:text-3xl font-bold text-brand-navy">{documents?.length || 0}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Documents</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Active Shipments */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-brand-navy">Active Shipments</h2>
                <Link 
                  to="/shipments"
                  className="text-sm font-medium text-brand-coral hover:text-red-500 transition-colors"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {shipmentsLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#0E2A47]"></div>
                </div>
              ) : activeShipments.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-gray-600">No active shipments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeShipments.map((shipment) => (
                    <div key={shipment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-[#0E2A47]">{shipment.petName}</h3>
                          <p className="text-sm text-gray-600">
                            {shipment.route.from} → {shipment.route.to}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(shipment.status)}`}>
                          {getStatusLabel(shipment.status)}
                        </span>
                      </div>
                      {shipment.updatedAt && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Updated {formatRelativeTime(shipment.updatedAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-brand-navy">Recent Messages</h2>
                <Link 
                  to="/inbox"
                  className="text-sm font-medium text-brand-coral hover:text-red-500 transition-colors"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {conversationsLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#0E2A47]"></div>
                </div>
              ) : recentConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-gray-600">No recent conversations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentConversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      to={`/inbox/${conversation.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-[#F3C0CF] transition-colors"
                    >
                      <h3 className="font-medium text-[#0E2A47] mb-1 truncate">
                        {conversation.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {conversation.participantIds?.length || 0} participants
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Available */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-4 sm:mb-6">Services Now Available</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-5 bg-brand-light rounded-xl hover:shadow-md transition-shadow">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 bg-brand-coral rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-brand-navy mb-1 sm:mb-2">Charter Flight</h3>
              <p className="text-xs sm:text-sm text-gray-600">Dedicated flights for your pet</p>
            </div>
            <div className="text-center p-3 sm:p-5 bg-brand-light rounded-xl hover:shadow-md transition-shadow">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 bg-brand-sky rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-brand-navy mb-1 sm:mb-2">Cargo Shipment</h3>
              <p className="text-xs sm:text-sm text-gray-600">Secure cargo transport</p>
            </div>
            <div className="text-center p-3 sm:p-5 bg-brand-light rounded-xl hover:shadow-md transition-shadow">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 bg-brand-coral rounded-full flex items-center justify-center">
                <User className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-brand-navy mb-1 sm:mb-2">Accompanied Service</h3>
              <p className="text-xs sm:text-sm text-gray-600">Staff accompanies your pet</p>
            </div>
            <div className="text-center p-3 sm:p-5 bg-brand-light rounded-xl hover:shadow-md transition-shadow">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 bg-brand-sky rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-brand-navy mb-1 sm:mb-2">In-Cabin Service</h3>
              <p className="text-xs sm:text-sm text-gray-600">Pet travels in cabin</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-brand-sky/10 to-brand-coral/10 rounded-xl p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/inbox"
              className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-[#F3C0CF] transition-colors"
            >
              <MessageCircle className="w-8 h-8 text-[#0E2A47] mr-3" />
              <div>
                <h3 className="font-medium text-[#0E2A47]">Start a Conversation</h3>
                <p className="text-sm text-gray-600">Get help from our team</p>
              </div>
            </Link>
            <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200">
              <FileText className="w-8 h-8 text-[#0E2A47] mr-3" />
              <div>
                <h3 className="font-medium text-[#0E2A47]">Upload Documents</h3>
                <p className="text-sm text-gray-600">Add required pet documents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Request Modal */}
      <Modal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        title="Step 1: Request an Estimate"
        size="lg"
      >
        <div className="mb-6 p-4 bg-brand-light rounded-lg border-l-4 border-brand-coral">
          <p className="text-sm text-brand-navy">
            <strong>Request for an estimate for your pet's travel.</strong> Your estimate will process 3-5 business days. 
            After you receive and accept your estimate, we'll move forward with booking and reserving a slot for your furry loved one.
          </p>
        </div>
        
        <form onSubmit={handleQuoteSubmit} className="space-y-6">
          {/* Pet Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-[#0E2A47] mb-4">Pet Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Pet Name"
                value={quoteForm.petName}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, petName: e.target.value }))}
                required
                placeholder="e.g., Max"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pet Type</label>
                <select
                  value={quoteForm.petType}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, petType: e.target.value as 'dog' | 'cat' | 'other' }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
                  required
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input
                label="Breed"
                value={quoteForm.petBreed}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, petBreed: e.target.value }))}
                placeholder="e.g., Golden Retriever"
              />
              <Input
                label="Weight (lbs)"
                type="number"
                value={quoteForm.petWeight}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, petWeight: e.target.value }))}
                placeholder="e.g., 25"
              />
            </div>
          </div>

          {/* Travel Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-[#0E2A47] mb-4">Travel Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="From (Airport Code)"
                value={quoteForm.fromLocation}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, fromLocation: e.target.value.toUpperCase() }))}
                required
                placeholder="e.g., LAX"
                maxLength={3}
              />
              <Input
                label="To (Airport Code)"
                value={quoteForm.toLocation}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, toLocation: e.target.value.toUpperCase() }))}
                required
                placeholder="e.g., GUM"
                maxLength={3}
              />
              <Input
                label="Preferred Travel Date"
                type="date"
                value={quoteForm.travelDate}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, travelDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requirements (Optional)
            </label>
            <textarea
              value={quoteForm.specialRequirements}
              onChange={(e) => setQuoteForm(prev => ({ ...prev, specialRequirements: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0E2A47] focus:border-[#0E2A47] sm:text-sm"
              placeholder="Any special needs, medical conditions, or requests..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuoteModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitQuoteRequestMutation.isPending || !quoteForm.petName || !quoteForm.fromLocation || !quoteForm.toLocation}
              className="bg-brand-coral hover:bg-red-500 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-brand-coral"
            >
              {submitQuoteRequestMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Quote Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};