import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  Paperclip, 
  FileText, 
  Quote, 
  Plane, 
  ArrowLeft, 
  DollarSign,
  Package,
  Calendar,
  Download,
  Users
} from 'lucide-react';
import { http } from '../lib/http';
import { Message, QuoteTemplate, Shipment, Document, Conversation, User } from '../types';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, formatRelativeTime } from '../lib/utils';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';

export const ConversationPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [message, setMessage] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMobileShipmentDetails, setShowMobileShipmentDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await http.get(`/conversations/${conversationId}`);
      return response.data.conversation;
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await http.get(`/conversations/${conversationId}/messages`);
      return response.data.messages as Message[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await http.get('/users');
      return response.data.users as User[];
    },
  });

  const { data: shipment } = useQuery({
    queryKey: ['conversation-shipment', conversationId],
    queryFn: async () => {
      const response = await http.get('/shipments');
      const shipments = response.data.shipments as Shipment[];
      return shipments.find(s => s.conversationId === conversationId);
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['shipment-documents', shipment?.id],
    queryFn: async () => {
      if (!shipment?.id) return [];
      const response = await http.get(`/shipments/${shipment.id}/documents`);
      return response.data.documents as Document[];
    },
    enabled: !!shipment?.id,
  });

  const { data: quoteTemplates } = useQuery({
    queryKey: ['quote-templates'],
    queryFn: async () => {
      const response = await http.get('/quote_templates');
      return response.data.quote_templates as QuoteTemplate[];
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => 
      http.post(`/conversations/${conversationId}/messages`, messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: (data: { templateId: string; priceCents?: number }) =>
      http.post(`/conversations/${conversationId}/quotes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowQuoteModal(false);
    },
  });

  const requestPaymentMutation = useMutation({
    mutationFn: (amount: number) =>
      http.post('/orders', { conversationId, amount }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowPaymentModal(false);
      // In a real app, you'd redirect to the checkout URL
      alert(`Payment request created! Checkout URL: ${response.data.checkoutUrl}`);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate({
        kind: 'text',
        text: message.trim(),
      });
    }
  };

  const handleSendQuote = (templateId: string, customPrice?: number) => {
    const template = quoteTemplates?.find(t => t.id === templateId);
    if (template) {
      sendQuoteMutation.mutate({
        templateId,
        priceCents: customPrice || template.defaultPriceCents,
      });
    }
  };

  // Define isStaffOrAdmin at component level
  const isStaffOrAdmin = ['admin', 'staff'].includes(user?.role || '');

  const getParticipantDetails = (participantIds: string[]) => {
    if (!users) return { participants: [] };
    
    const participants = participantIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as User[];
    
    return { participants };
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      staff: 'bg-blue-100 text-blue-700', 
      partner: 'bg-green-100 text-green-700',
      client: 'bg-gray-100 text-gray-700',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const renderMessage = (msg: Message) => {
    const isSystem = msg.senderId === 'system';
    const isCurrentUser = msg.senderId === user?.id;
    
    // Determine if sender is staff/admin for bubble styling
    const senderUser = msg.senderId === 'u_admin' || msg.senderId === 'u_staff';

    if (msg.kind === 'status' && isSystem) {
      const payload = msg.payload as any;
      if (payload.type === 'payment_requested') {
        return (
          <div className="flex justify-center my-3 sm:my-4 px-4">
            <div className="bg-[#F3C0CF] text-[#0E2A47] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 max-w-full">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Payment requested: {formatCurrency(payload.amountCents || payload.amount || 0)}</span>
            </div>
          </div>
        );
      } else if (payload.type === 'payment_completed') {
        return (
          <div className="flex justify-center my-3 sm:my-4 px-4">
            <div className="bg-green-100 text-green-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 max-w-full">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Payment completed: {formatCurrency(payload.amountCents)}</span>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex justify-center my-3 sm:my-4 px-4">
            <div className="bg-[#F3C0CF] text-[#0E2A47] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 max-w-full">
              <Plane className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Status updated to: {getStatusLabel(payload.to)}</span>
            </div>
          </div>
        );
      }
    }

    if (msg.kind === 'quote') {
      const payload = msg.payload as any;
      return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}>
          <div className="max-w-[280px] sm:max-w-xs lg:max-w-md bg-white border border-[#8EB9D4] rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#8EB9D4] flex items-center justify-center flex-shrink-0">
                <Quote className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[#0E2A47] text-sm sm:text-base">{payload.title}</h4>
                <p className="text-xl sm:text-2xl font-bold text-[#0E2A47] mt-1">
                  {formatCurrency(payload.priceCents)}
                </p>
                <p className="text-xs text-gray-500 mt-2">{formatDate(msg.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}>
        <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
          isCurrentUser 
            ? 'bg-[#0E2A47] text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm sm:text-base leading-relaxed">{msg.text}</p>
          <p className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-300' : 'text-gray-500'}`}>
            {formatDate(msg.createdAt)}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E2A47]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Conversations List - Hidden on mobile */}
        <div className="hidden lg:block">
          <ConversationsList />
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 flex flex-col lg:border-l border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 p-3 sm:p-4 bg-white">
            <div className="flex items-center space-x-3">
              <Link 
                to={user?.role === 'client' ? '/portal/inbox' : '/app/inbox'}
                className="text-gray-400 hover:text-gray-600 transition-colors lg:hidden p-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-[#0E2A47] truncate">
                  {conversation?.title}
                </h1>
                {conversation && (
                  <div className="mt-1">
                    {(() => {
                      const { participants } = getParticipantDetails(conversation.participantIds);
                      const clients = participants.filter(p => p.role === 'client');
                      const staff = participants.filter(p => p.role === 'admin' || p.role === 'staff');
                      const partners = participants.filter(p => p.role === 'partner');
                      
                      return (
                        <div className="text-xs sm:text-sm text-gray-600">
                          {clients.length > 0 && (
                            <span className="mr-2">
                              <span className="font-medium text-gray-900">
                                {clients.map(c => c.name.split(' ')[0]).join(', ')}
                              </span>
                              <span className="text-gray-500"> (Customer{clients.length > 1 ? 's' : ''})</span>
                            </span>
                          )}
                          {staff.length > 0 && (
                            <span className="mr-2">
                              <span className="font-medium text-[#0E2A47]">
                                {staff.map(s => s.name.split(' ')[0]).join(', ')}
                              </span>
                              <span className="text-gray-500"> (Staff)</span>
                            </span>
                          )}
                          {partners.length > 0 && (
                            <span>
                              <span className="font-medium text-green-700">
                                {partners.map(p => p.name.split(' ')[0]).join(', ')}
                              </span>
                              <span className="text-gray-500"> (Partner{partners.length > 1 ? 's' : ''})</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              {/* Mobile shipment info button */}
              {shipment && (
                <button
                  onClick={() => setShowMobileShipmentDetails(!showMobileShipmentDetails)}
                  className="lg:hidden p-2 text-gray-400 hover:text-[#0E2A47] transition-colors"
                  title="Shipment Details"
                >
                  <Package className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Shipment Details */}
          {showMobileShipmentDetails && shipment && (
            <div className="lg:hidden border-b border-gray-200 bg-white p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[#0E2A47]">Shipment Details</h3>
                  <button
                    onClick={() => setShowMobileShipmentDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Pet:</span>
                    <span className="ml-2 font-medium">{shipment.petName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Route:</span>
                    <span className="ml-2 font-medium">{shipment.route.from} → {shipment.route.to}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(shipment.status)}`}>
                    {getStatusLabel(shipment.status)}
                  </span>
                  <Link 
                    to={`${user?.role === 'client' ? '/portal' : '/app'}/shipments?focus=${shipment.id}`}
                    className="text-sm text-[#0E2A47] hover:text-[#0E2A47]/80 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
            <div className="space-y-3 sm:space-y-4">
              {messages?.map((msg) => (
                <div key={msg.id}>
                  {renderMessage(msg)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Composer */}
          <div className="border-t border-gray-200 p-3 sm:p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2 sm:space-x-3">
              <div className="flex space-x-1 sm:space-x-2">
                {/* Only show quote and payment buttons for staff/admin */}
                {isStaffOrAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowQuoteModal(true)}
                      className="p-2 text-gray-400 hover:text-[#0E2A47] transition-colors touch-manipulation"
                      title="Insert Quote"
                    >
                      <Quote className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="p-2 text-gray-400 hover:text-[#0E2A47] transition-colors touch-manipulation"
                      title="Request Payment"
                    >
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-[#0E2A47] transition-colors touch-manipulation"
                  title="Attach File"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm sm:text-base"
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="px-3 py-2 touch-manipulation"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-80 border-l border-gray-200 bg-white">
          <div className="p-4 space-y-6">
            {/* Shipment Summary */}
            {shipment && (
              <div>
                <h3 className="text-lg font-medium text-[#0E2A47] mb-3">Shipment Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pet</span>
                    <span className="font-medium">{shipment.petName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Route</span>
                    <span className="font-medium">
                      {shipment.route.from} → {shipment.route.to}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(shipment.status)}`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                  </div>
                  <Link 
                    to={`${user?.role === 'client' ? '/portal' : '/app'}/shipments?focus=${shipment.id}`}
                    className="block w-full text-center bg-[#8EB9D4] text-[#0E2A47] py-2 rounded-lg text-sm font-medium hover:bg-[#8EB9D4]/90 transition-colors"
                  >
                    <Package className="w-4 h-4 inline mr-2" />
                    View in Shipments
                  </Link>
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <h3 className="text-lg font-medium text-[#0E2A47] mb-3">Documents</h3>
              <div className="space-y-2">
                {documents && documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {doc.type.replace('_', ' ')}
                          </p>
                          {doc.expiresOn && (
                            <DocumentExpiryBadge expiresOn={doc.expiresOn} />
                          )}
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No documents uploaded yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      <Modal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        title="Send Quote to Customer"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-[#0E2A47] mb-2">💡 Quick Tip</h3>
            <p className="text-sm text-gray-700">
              Select a quote template below. The customer will receive the quote and can accept it to proceed with booking.
            </p>
          </div>

          {quoteTemplates?.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#F3C0CF] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-[#0E2A47] mb-2">{template.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{template.body}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#0E2A47]">
                    {formatCurrency(template.defaultPriceCents)}
                  </div>
                  <div className="text-xs text-gray-500">Starting price</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-xs text-gray-500">
                  Includes: {template.body.split('.')[0]}...
                </div>
                <Button
                  onClick={() => handleSendQuote(template.id)}
                  size="sm"
                  disabled={sendQuoteMutation.isPending}
                  className="bg-[#F3C0CF] hover:bg-[#E8A5B8] text-[#0E2A47] font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                >
                  {sendQuoteMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0E2A47] mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Quote
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          {(!quoteTemplates || quoteTemplates.length === 0) && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quote Templates</h3>
              <p className="text-gray-600 mb-4">
                Create quote templates in the Admin section to send quotes to customers.
              </p>
              <Link
                to="/app/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[#0E2A47] bg-[#F3C0CF] hover:bg-[#F3C0CF]/90"
              >
                Go to Admin
              </Link>
            </div>
          )}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Request Payment"
        size="sm"
      >
        <PaymentRequestForm 
          onSubmit={(amount) => requestPaymentMutation.mutate(amount)}
          isLoading={requestPaymentMutation.isPending}
        />
      </Modal>
    </Layout>
  );
};

const PaymentRequestForm: React.FC<{
  onSubmit: (amount: number) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (amountInCents > 0) {
      onSubmit(amountInCents);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="number"
        label="Amount (USD)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        step="0.01"
        min="0"
        required
      />
      <div className="flex space-x-3">
        <Button type="submit" disabled={!amount || isLoading} className="flex-1">
          {isLoading ? 'Creating...' : 'Request Payment'}
        </Button>
      </div>
    </form>
  );
};

// Conversations List Component for Left Sidebar
const ConversationsList: React.FC = () => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId: string }>();
  
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await http.get('/conversations');
      return response.data.conversations as Conversation[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await http.get('/users');
      return response.data.users as User[];
    },
  });

  const getKindColor = (kind: string) => {
    const colors = {
      client: 'bg-blue-100 text-blue-800',
      partner: 'bg-green-100 text-green-800',
      internal: 'bg-purple-100 text-purple-800',
    };
    return colors[kind as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getParticipantDetails = (participantIds: string[]) => {
    if (!users) return { participants: [] };
    
    const participants = participantIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as User[];
    
    return { participants };
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      staff: 'bg-blue-100 text-blue-700', 
      partner: 'bg-green-100 text-green-700',
      client: 'bg-gray-100 text-gray-700',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const basePrefix = user?.role === 'client' ? '/portal' : '/app';

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#0E2A47]">Conversations</h2>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#0E2A47]"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations?.map((conv) => {
              const { participants } = getParticipantDetails(conv.participantIds);
              
              // Separate participants by role for cleaner display
              const clients = participants.filter(p => p.role === 'client');
              const staff = participants.filter(p => p.role === 'admin' || p.role === 'staff');
              const partners = participants.filter(p => p.role === 'partner');
              
              return (
                <Link
                  key={conv.id}
                  to={`${basePrefix}/inbox/${conv.id}`}
                  className={`block p-3 hover:bg-gray-50 transition-colors ${
                    conv.id === conversationId ? 'bg-[#F3C0CF]/20 border-r-2 border-[#F3C0CF]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-[#0E2A47] text-sm truncate pr-2">
                      {conv.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getKindColor(conv.kind)}`}>
                      {conv.kind}
                    </span>
                  </div>
                  
                  {/* Clean participant summary - Compact for sidebar */}
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {clients.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-900">
                          {clients.map(c => c.name.split(' ')[0]).slice(0, 2).join(', ')}
                          {clients.length > 2 && ` +${clients.length - 2}`}
                        </span>
                        <span className="text-gray-500"> (Customer{clients.length > 1 ? 's' : ''})</span>
                      </div>
                    )}
                    {(staff.length > 0 || partners.length > 0) && (
                      <div className="mt-1">
                        {staff.length > 0 && (
                          <span className="font-medium text-[#0E2A47]">
                            {staff.map(s => s.name.split(' ')[0]).slice(0, 1).join(', ')}
                          </span>
                        )}
                        {partners.length > 0 && (
                          <span className="font-medium text-green-700 ml-1">
                            {partners.map(p => p.name.split(' ')[0]).slice(0, 1).join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Document Expiry Badge Component
const DocumentExpiryBadge: React.FC<{ expiresOn: string }> = ({ expiresOn }) => {
  const expiryDate = new Date(expiresOn);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Show warning if expires within 45 days or has expired
  const isExpiringSoon = daysUntilExpiry <= 45;
  const isExpired = daysUntilExpiry < 0;
  
  if (!isExpiringSoon) {
    return (
      <div className="flex items-center text-xs text-gray-500 mt-1">
        <Calendar className="w-3 h-3 mr-1" />
        Expires {expiryDate.toLocaleDateString()}
      </div>
    );
  }
  
  return (
    <div className="flex items-center text-xs mt-1">
      <Calendar className="w-3 h-3 mr-1" />
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        isExpired 
          ? 'bg-red-100 text-red-800' 
          : 'bg-orange-100 text-orange-800'
      }`}>
        {isExpired 
          ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
          : `Expires in ${daysUntilExpiry} days`
        }
      </span>
    </div>
  );
};