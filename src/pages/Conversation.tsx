import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  ShoppingCart,
  Plus,
  CheckCircle,
  LayoutDashboard,
  Inbox,
  CreditCard,
  Heart,
  MapPin,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { http } from '../lib/http';
import { Message, Document, User } from '../types';
import { formatDate, formatCurrency, getStatusLabel, formatRelativeTime } from '../lib/utils';
// import { Layout } from '../components/Layout'; // Not needed since we use fixed layout
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
// Convex imports for real-time messaging
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export const ConversationPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [message, setMessage] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // 🚀 USE CONVEX ONLY (no more mock API)
  const useConvex = true;

  // 🚀 CONVEX REAL-TIME QUERIES (New!) - MOVED TO TOP
  // Only query Convex when we're in Convex mode AND have a valid Convex conversation ID
  const isValidConvexId = conversationId && !conversationId.startsWith('c') && conversationId.length > 10;
  
  const convexMessages = useConvexQuery(
    api.messages.list, 
    (useConvex && isValidConvexId) ? { conversationId: conversationId as Id<"conversations"> } : "skip"
  );
  
  const convexUsers = useConvexQuery(api.users.list, useConvex ? {} : "skip");
  
  const convexConversations = useConvexQuery(
    api.conversations.list, 
    user ? { userId: user.id, userRole: user.role } : "skip"
  );
  
  const convexProducts = useConvexQuery(api.products.listActive, useConvex ? {} : "skip");
  
  const convexQuoteTemplates = useConvexQuery(api.quoteTemplates.list, useConvex ? {} : "skip");
  
  // 🚀 Get shipment data for this conversation
  const convexShipments = useConvexQuery(
    api.shipments.list,
    (useConvex && user) ? { userId: user.id, userRole: user.role } : "skip"
  );

  // Utility to normalize Convex data to match our existing types
  const normalizeConvexMessage = (convexMsg: any): Message => ({
    id: convexMsg._id,
    conversationId: convexMsg.conversationId,
    senderId: convexMsg.senderId,
    text: convexMsg.text,
    kind: convexMsg.kind,
    payload: convexMsg.payload,
    createdAt: new Date(convexMsg.createdAt).toISOString(),
  });

  // Choose data source based on toggle
  const activeMessages = useConvex 
    ? convexMessages?.map(normalizeConvexMessage) 
    : [];

  const isActiveLoading = useConvex 
    ? convexMessages === undefined
    : false;

  // Removed initial app load tracking - not needed with new approach

  // Use Convex quote templates
  const quoteTemplates = useConvex ? convexQuoteTemplates : [];
  const products = useConvex ? convexProducts : [];

  // 🚀 All data now comes from Convex - using convex queries defined above
  // Get conversation data from Convex conversations
  const conversation = convexConversations?.find(conv => conv._id === conversationId) || null;
  
  // Transform Convex data to match existing types
  const users = convexUsers;
  
  // Get shipment data for this conversation
  const shipment = convexShipments?.find(ship => ship.conversationId === conversationId) || null;
  const documents: Document[] = []; // TODO: Add Convex documents query

  // 🚀 CONVEX REAL-TIME MUTATIONS (New!)
  const convexSendMessage = useConvexMutation(api.messages.send);

  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => 
      http.post(`/conversations/${conversationId}/messages`, messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    },
  });

  // 🚀 Use Convex for sending quotes
  const convexSendQuote = useConvexMutation(api.messages.sendQuote);

  const sendQuoteMutation = useMutation({
    mutationFn: async (data: { templateId: string; priceCents?: number }) => {
      if (!isValidConvexId || !user?.id) throw new Error('Invalid conversation or user');
      
      const template = quoteTemplates?.find(t => t._id === data.templateId);
      if (!template) throw new Error('Template not found');
      
      return await convexSendQuote({
        conversationId: conversationId as Id<"conversations">,
        senderId: user.id,
        payload: {
          templateId: data.templateId,
          title: template.title,
          body: template.body,
          priceCents: data.priceCents || template.defaultPriceCents,
        },
      });
    },
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
      setShowQuoteModal(false);
    },
  });

  const sendProductMutation = useMutation({
    mutationFn: (productId: string) =>
      http.post(`/conversations/${conversationId}/products`, { productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowProductModal(false);
    },
  });

  // 🚀 Use Convex mutations for payment requests and status messages
  const convexCreatePaymentRequest = useConvexMutation(api.payments.createRequest);
  const convexSendStatus = useConvexMutation(api.messages.sendStatus);

  const requestPaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!conversationId || !user?.id) throw new Error('Missing required data');
      
      // Create meaningful description based on available context
      let description = `Payment request for pet shipping services`;
      
      if (shipment) {
        const route = `${shipment.route?.from || 'Origin'} → ${shipment.route?.to || 'Destination'}`;
        description = `Pet shipping for ${shipment.petName} (${route})`;
      } else if (conversation) {
        description = `Pet shipping services - ${conversation.title}`;
      }
      
      // Create payment request in Convex
      const paymentId = await convexCreatePaymentRequest({
        conversationId: conversationId as Id<"conversations">,
        amountCents: Math.round(amount * 100), // Convert dollars to cents
        description: description,
      });

      // Send status message to conversation
      await convexSendStatus({
        conversationId: conversationId as Id<"conversations">,
        senderId: user.id,
        text: `Payment request sent: $${amount.toFixed(2)}`,
        payload: {
          type: 'payment_requested',
          paymentId,
          amountCents: Math.round(amount * 100), // Convert dollars to cents for storage
          description: `Payment request for pet shipping services`,
        },
      });

      return { paymentId };
    },
    onSuccess: () => {
      // No need to invalidate queries - Convex updates automatically!
      setShowPaymentModal(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // 🎯 Prevent body scroll when conversation is active
  useEffect(() => {
    document.body.classList.add('conversation-active');
    return () => {
      document.body.classList.remove('conversation-active');
    };
  }, []);

  // 🎯 Prevent scroll when mobile details modal is open
  useEffect(() => {
    if (showMobileDetails) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore scroll position and body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showMobileDetails]);

  // 🎯 Mobile keyboard detection and handling
  useEffect(() => {
    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        
        // Keyboard is likely open if viewport height decreased significantly
        const keyboardOpen = heightDifference > 150;
        setIsKeyboardOpen(keyboardOpen);
        
        // Update CSS custom property for dynamic height
        document.documentElement.style.setProperty('--vh', `${currentHeight * 0.01}px`);
      }
    };

    const handleResize = () => {
      // Update initial height on orientation change
      setTimeout(() => {
        initialViewportHeight = window.visualViewport?.height || window.innerHeight;
        handleViewportChange();
      }, 100);
    };

    // Listen for viewport changes (keyboard show/hide)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }
    
    // Fallback for older browsers
    window.addEventListener('resize', handleResize);
    
    // Initial setup
    handleViewportChange();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle input focus/blur for additional keyboard detection
  const handleInputFocus = () => {
    setIsKeyboardOpen(true);
    // Scroll to bottom when keyboard opens
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleInputBlur = () => {
    // Small delay to prevent flickering
    setTimeout(() => {
      setIsKeyboardOpen(false);
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      if (useConvex && isValidConvexId) {
        // 🚀 Use Convex for real-time messaging
        convexSendMessage({
          conversationId: conversationId as Id<"conversations">,
          senderId: user?.id || 'unknown',
          text: message.trim(),
        });
        setMessage(''); // Clear message immediately for better UX
      } else {
        // Use existing mock API
      sendMessageMutation.mutate({
        kind: 'text',
        text: message.trim(),
      });
      }
    }
  };

  const handleSendQuote = (templateId: string, customPrice?: number) => {
    const template = quoteTemplates?.find(t => t._id === templateId);
    if (template) {
      sendQuoteMutation.mutate({
        templateId,
        priceCents: customPrice || template.defaultPriceCents,
      });
    }
  };

  // 🚀 Use Convex for sending status messages (shared for quote responses and payment requests)

  const handleQuoteResponse = (action: 'accept' | 'decline', quoteMessageId: string) => {
    if (!isValidConvexId || !user?.id) return;
    
    console.log(`Sending quote ${action} response...`); // Debug log
    
    // Send a status message about the quote response
    convexSendStatus({
      conversationId: conversationId as Id<"conversations">,
      senderId: user.id,
      text: `Quote ${action}ed by customer`,
      payload: {
        type: `quote_${action}ed`,
        quoteMessageId,
        action,
      },
    }).then(() => {
      console.log(`Quote ${action} response sent successfully`);
    }).catch((error) => {
      console.error(`Error sending quote ${action} response:`, error);
    });
  };

  const handleNextStep = (step: 'documents' | 'crate') => {
    if (!isValidConvexId || !user?.id) return;
    
    const stepMessages = {
      documents: {
        text: "Document requirements sent",
        payload: {
          type: "documents_requested",
          requirements: [
            "Health Certificate (within 10 days of travel)",
            "Vaccination Records (Rabies, DHPP)",
            "Import Permit (if required by destination)",
            "IATA Crate Certificate"
          ]
        }
      },
      crate: {
        text: "IATA crate selection initiated",
        payload: {
          type: "crate_selection",
          petWeight: 15, // From quote request
          recommendedSize: "Large (36x25x27)",
          options: [
            { size: "Large", dimensions: "36x25x27", price: 25000 },
            { size: "Extra Large", dimensions: "40x27x30", price: 35000 }
          ]
        }
      }
    };

    const message = stepMessages[step];
    
    convexSendStatus({
      conversationId: conversationId as Id<"conversations">,
      senderId: user.id,
      text: message.text,
      payload: message.payload,
    });
  };

  // Define isStaffOrAdmin at component level
  const isStaffOrAdmin = ['admin', 'staff'].includes(user?.role || '');

  const getParticipantDetails = (participantIds: string[]) => {
    if (!users) return { participants: [] };
    
    const participants = participantIds
      .map(id => users.find(u => u._id === id || (u as any).id === id))
      .filter(Boolean)
      .map(u => u && ({
        id: u._id || (u as any).id,
        name: u.name,
        email: u.email,
        role: u.role,
        orgId: u.orgId
      }))
      .filter(Boolean) as User[];
    
    return { participants };
  };



  const renderMessage = (msg: Message) => {
    const isSystem = msg.senderId === 'system';
    const isCurrentUser = msg.senderId === user?.id;

    if (msg.kind === 'status' && (isSystem || (msg.payload as any)?.type?.includes('quote_') || (msg.payload as any)?.type?.includes('payment_'))) {
      const payload = msg.payload as any;
      if (payload.type === 'payment_requested') {
        const isCustomer = user?.role === 'client';
        
        // Enhanced payment request card for customers
        if (isCustomer) {
        return (
            <div className="flex justify-center my-4 sm:my-6 px-4">
              <div className="bg-white border-2 border-[#8EB9D4] rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#F3C0CF] flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-[#0E2A47]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0E2A47] text-lg">Payment Request</h3>
                    <p className="text-sm text-gray-600">Payment required to proceed</p>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <p className="text-2xl sm:text-3xl font-bold text-[#0E2A47] mb-2">
                    {formatCurrency(payload.amountCents || payload.amount || 0)}
                  </p>
                  <p className="text-sm text-gray-600">{payload.description || 'Payment for pet shipping services'}</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <Link 
                    to="/portal/billing"
                    className="w-full bg-[#0E2A47] hover:bg-[#1a3a5c] text-white text-sm py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
              <DollarSign className="w-4 h-4" />
                    <span>View & Pay Now</span>
                  </Link>
                </div>
                
                {/* Timestamp */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Requested {formatDate(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        // Simple status message for admin/staff
        return (
          <div className="flex flex-col items-center my-3 sm:my-4 px-4 space-y-2">
            <div className="bg-[#F3C0CF] text-[#0E2A47] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 max-w-full">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Payment requested: {formatCurrency(payload.amountCents || payload.amount || 0)}</span>
            </div>
            <p className="text-xs text-gray-500">
              Requested {formatDate(msg.createdAt)}
            </p>
          </div>
        );
      } else if (payload.type === 'payment_completed') {
        return (
          <div className="flex flex-col items-center my-3 sm:my-4 px-4 space-y-2">
            <div className="bg-green-100 text-green-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 max-w-full">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Payment completed: {formatCurrency(payload.amountCents)}</span>
            </div>
            <p className="text-xs text-gray-500">
              Completed {formatDate(msg.createdAt)}
            </p>
          </div>
        );
      } else if (payload.type === 'quote_requested') {
        return (
          <div className="flex justify-center my-4 sm:my-6 px-4">
            <div className="bg-white border-2 border-[#8EB9D4] rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F3C0CF] flex items-center justify-center">
                  <Plane className="w-4 h-4 text-[#0E2A47]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0E2A47] text-lg">Quote Request</h3>
                  <p className="text-sm text-gray-600">New request submitted</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pet Name</p>
                    <p className="text-sm font-semibold text-[#0E2A47]">{payload.petName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type & Breed</p>
                    <p className="text-sm text-[#0E2A47]">{payload.petType} • {payload.petBreed}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Route</p>
                  <p className="text-sm font-semibold text-[#0E2A47]">
                    {payload.route?.from} → {payload.route?.to}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weight</p>
                    <p className="text-sm text-[#0E2A47]">{payload.petWeight} lbs</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Travel Date</p>
                    <p className="text-sm text-[#0E2A47]">{payload.preferredTravelDate}</p>
                  </div>
                </div>
                
                {payload.specialRequirements && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Special Requirements</p>
                    <p className="text-sm text-[#0E2A47] bg-gray-50 p-2 rounded">{payload.specialRequirements}</p>
                  </div>
                )}
                
                {/* Generate Quote Button for Admin/Staff - Only show if no quote sent yet */}
                {isStaffOrAdmin && !activeMessages?.some(msg => msg.kind === 'quote') && (
                  <div className="pt-3 border-t border-gray-200">
                    <Button 
                      onClick={() => setShowQuoteModal(true)}
                      className="w-full bg-[#0E2A47] hover:bg-[#1a3a5c] text-white"
                    >
                      Generate Quote Response
                    </Button>
                  </div>
                )}
                
                {/* Show status if quote already sent */}
                {isStaffOrAdmin && activeMessages?.some(msg => msg.kind === 'quote') && (
                  <div className="pt-3 border-t border-gray-200">
                    {/* Check if customer has responded to quote */}
                    {activeMessages?.some(m => 
                      m.kind === 'status' && 
                      ((m.payload as any)?.type === 'quote_accepted' || 
                       (m.payload as any)?.type === 'quote_declined')
                    ) ? (
                      <div className="flex items-center justify-center py-2 text-sm text-blue-600 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Customer has responded - check conversation below
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-2 text-sm text-green-600 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Quote sent - awaiting customer response
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Submitted {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      } else if (payload.type === 'quote_accepted') {
        return (
          <div className="flex justify-center my-4 sm:my-6 px-4">
            <div className="bg-white border-2 border-[#8EB9D4] rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F3C0CF] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#0E2A47]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0E2A47] text-lg">Quote Accepted!</h3>
                  <p className="text-sm text-gray-600">Ready to proceed with booking</p>
                </div>
              </div>
              
              {/* Next Steps for Admin/Staff */}
              {isStaffOrAdmin && (
                <div className="space-y-4">
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-[#0E2A47] text-sm mb-3">Next Steps:</h4>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          // Find the quote message to get the actual amount
                          const quoteMessage = activeMessages?.find(msg => msg.kind === 'quote');
                          const quoteAmount = quoteMessage ? (quoteMessage.payload as any)?.priceCents / 100 : 4500;
                          console.log('Quote message:', quoteMessage);
                          console.log('Quote amount (dollars):', quoteAmount);
                          setPaymentAmount(quoteAmount);
                          setShowPaymentModal(true);
                        }}
                        className="w-full bg-[#0E2A47] hover:bg-[#1a3a5c] text-white text-sm py-2.5 flex items-center justify-center space-x-2"
                      >
              <DollarSign className="w-4 h-4" />
                        <span>Request Payment ({(() => {
                          const quoteMessage = activeMessages?.find(msg => msg.kind === 'quote');
                          const quoteAmount = quoteMessage ? (quoteMessage.payload as any)?.priceCents / 100 : 4500;
                          return formatCurrency(quoteAmount * 100);
                        })()})</span>
                      </Button>
                      <Button
                        onClick={() => handleNextStep('documents')}
                        className="w-full bg-[#8EB9D4] hover:bg-[#7ba8c7] text-[#0E2A47] text-sm py-2.5 flex items-center justify-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Request Documents</span>
                      </Button>
                      <Button
                        onClick={() => handleNextStep('crate')}
                        className="w-full bg-[#F3C0CF] hover:bg-[#e8a8bc] text-[#0E2A47] text-sm py-2.5 flex items-center justify-center space-x-2"
                      >
                        <Package className="w-4 h-4" />
                        <span>Select IATA Crate</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Status for Customer */}
              {!isStaffOrAdmin && (
                <div className="bg-[#F3C0CF]/20 border border-[#F3C0CF]/40 p-3 rounded-lg">
                  <p className="text-sm text-[#0E2A47]">
                    <strong>Great!</strong> Our team will contact you shortly with next steps including payment, document requirements, and crate selection.
                  </p>
                </div>
              )}
              
              {/* Timestamp */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Accepted {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      } else if (payload.type === 'quote_declined') {
        return (
          <div className="flex flex-col items-center my-3 sm:my-4 px-4 space-y-2">
            <div className="bg-[#F3C0CF] text-[#0E2A47] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 max-w-full">
              <Plane className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate font-medium">Quote Declined - New quote may be needed</span>
            </div>
            <p className="text-xs text-gray-500">
              Declined {formatDate(msg.createdAt)}
            </p>
          </div>
        );
      } else if (payload.type === 'documents_requested') {
        return (
          <div className="flex justify-center my-4 sm:my-6 px-4">
            <div className="bg-white border-2 border-[#8EB9D4] rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F3C0CF] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#0E2A47]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0E2A47] text-lg">Document Requirements</h3>
                  <p className="text-sm text-gray-600">Please prepare the following documents</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {payload.requirements?.map((req: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-[#8EB9D4] rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-[#0E2A47]">{req}</p>
                  </div>
                ))}
              </div>
              
              {/* Timestamp */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Requested {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      } else if (payload.type === 'crate_selection') {
        return (
          <div className="flex justify-center my-4 sm:my-6 px-4">
            <div className="bg-white border-2 border-[#8EB9D4] rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F3C0CF] flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#0E2A47]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0E2A47] text-lg">IATA Crate Selection</h3>
                  <p className="text-sm text-gray-600">Recommended for {payload.petWeight}lb pet</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-[#0E2A47] mb-3">
                  <strong>Recommended:</strong> {payload.recommendedSize}
                </p>
                
                {payload.options?.map((option: any, index: number) => (
                  <div key={index} className="border border-[#8EB9D4] rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#0E2A47]">{option.size} Crate</p>
                        <p className="text-sm text-gray-600">{option.dimensions} inches</p>
                      </div>
                      <p className="font-bold text-[#0E2A47]">{formatCurrency(option.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Timestamp */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Initiated {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center my-3 sm:my-4 px-4 space-y-2">
            <div className="bg-[#F3C0CF] text-[#0E2A47] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 max-w-full">
              <Plane className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Status updated to: {getStatusLabel(payload.to || payload.type)}</span>
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(msg.createdAt)}
            </p>
          </div>
        );
      }
    }

    if (msg.kind === 'quote') {
      const payload = msg.payload as any;
      const isCustomer = user?.role === 'client';
      const hasQuoteResponse = activeMessages?.some(m => 
        m.kind === 'status' && 
        ((m.payload as any)?.type?.includes('quote_accepted') || 
         (m.payload as any)?.type?.includes('quote_declined'))
      );
      
      return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 sm:mb-6 px-2`}>
          <div className="max-w-[320px] sm:max-w-sm lg:max-w-lg bg-white border-2 border-[#8EB9D4] rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#8EB9D4] flex items-center justify-center flex-shrink-0">
                <Quote className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[#0E2A47] text-base sm:text-lg break-words">{payload.title}</h4>
                <p className="text-2xl sm:text-3xl font-bold text-[#0E2A47] mt-1">
                  {formatCurrency(payload.priceCents)}
                </p>
              </div>
            </div>
            
            {/* Quote description */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {payload.body}
              </p>
            </div>
            
            {/* Customer action buttons - only show if customer and no response yet */}
            {isCustomer && !hasQuoteResponse && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleQuoteResponse('accept', msg.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5"
                  >
                    Accept Quote
                  </Button>
                  <Button
                    onClick={() => handleQuoteResponse('decline', msg.id)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5"
                  >
                    Decline Quote
                  </Button>
                </div>
              </div>
            )}
            
            {/* Show response status if already responded */}
            {hasQuoteResponse && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-center py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
                  Quote response submitted
                </div>
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-500 text-right">
              Quote sent {formatDate(msg.createdAt)}
            </div>
          </div>
        </div>
      );
    }

    if (msg.kind === 'product') {
      const payload = msg.payload as any;
      const isCustomer = user?.role === 'client';
      return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-2`}>
          <div className="max-w-[280px] sm:max-w-xs lg:max-w-md bg-white border border-[#F3C0CF] rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#F3C0CF] flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-[#0E2A47]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-[#0E2A47] text-sm sm:text-base break-words">{payload.productName}</h4>
                <p className="text-xs text-gray-600">SKU: {payload.productSku}</p>
                <p className="text-xl sm:text-2xl font-bold text-[#0E2A47] mt-1">
                  {formatCurrency(payload.priceCents)}
                </p>
                {isCustomer && (
                  <Button
                    onClick={() => requestPaymentMutation.mutate(payload.priceCents / 100)}
                    disabled={requestPaymentMutation.isPending}
                    className="mt-3 w-full bg-[#F3C0CF] hover:bg-[#e8a8bc] text-[#0E2A47] text-sm py-2"
                  >
                    {requestPaymentMutation.isPending ? 'Processing...' : 'Add to Order'}
                  </Button>
                )}
                <p className="text-xs text-gray-500 mt-2">{formatDate(msg.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Get sender name for attribution
    const senderName = (() => {
      if (isCurrentUser) return 'You';
      if (isSystem) return 'System';
      const sender = users?.find(u => u._id === msg.senderId);
      return sender?.name || 'Unknown User';
    })();

    return (
      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-2`}>
        <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl break-words ${
          isCurrentUser 
            ? 'bg-[#0E2A47] text-white' 
            : 'bg-white text-gray-900 border border-gray-200'
        }`}>
          {!isCurrentUser && !isSystem && (
            <p className="text-xs font-medium text-gray-600 mb-1">{senderName}</p>
          )}
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
          <p className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-300' : 'text-gray-500'}`}>
            {formatDate(msg.createdAt)}
          </p>
        </div>
      </div>
    );
  };

  // Never show full-page loading for conversation switching - always show the layout

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">
      {/* Header - Always visible */}
      <div className="flex-shrink-0 border-b border-gray-200 p-3 sm:p-4 bg-white">
            <div className="flex items-center space-x-3">
              <Link 
            to={user?.role === 'client' ? '/portal/inbox' : '/app/inbox'}
            className="text-gray-400 hover:text-gray-600 transition-colors lg:hidden p-1 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h1 className="text-base sm:text-lg font-semibold text-[#0E2A47] truncate">
                  {conversation?.title}
                </h1>

            </div>
            {conversation && (
              <div className="mt-1">
                {(() => {
                  const { participants } = getParticipantDetails(conversation.participantIds);
                  const clients = participants.filter(p => p.role === 'client');
                  const staff = participants.filter(p => p.role === 'admin' || p.role === 'staff');
                  const partners = participants.filter(p => p.role === 'partner');
                  
                  return (
                    <div className="text-xs sm:text-sm text-gray-600 truncate">
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
          {/* Mobile details button */}
          <button
            onClick={() => setShowMobileDetails(true)}
            className="lg:hidden p-2 text-gray-400 hover:text-[#0E2A47] transition-colors flex-shrink-0"
            title="Conversation Details"
          >
            <Package className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Conversations List - Hidden on mobile */}
        <div className="hidden lg:block flex-shrink-0">
          <ConversationsList />
        </div>
        
        {/* 🎯 MAIN CHAT AREA - Full height with proper flex layout */}
        <div className="flex-1 flex flex-col lg:border-l border-gray-200 min-w-0">
          {/* 🎯 SCROLLABLE MESSAGES AREA - Only this area scrolls */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 bg-gray-50">
              {/* Show warning when trying to use Convex with mock conversation */}
              {useConvex && !isValidConvexId && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0">⚠️</div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-yellow-800">Convex Mode - No Data</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        You're viewing a mock API conversation. To test Convex real-time messaging:
                      </p>
                      <ol className="text-sm text-yellow-700 mt-2 ml-4 list-decimal">
                        <li>Go to Customer Dashboard</li>
                        <li>Click "Seed All Data" to create Convex conversations</li>
                        <li>Navigate to a Convex conversation from the inbox</li>
                      </ol>
              </div>
            </div>
          </div>
              )}
              
                            {/* Loading indicator for conversation switching */}
              {isActiveLoading && conversationId && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#0E2A47]"></div>
                    <span>Loading conversation...</span>
                  </div>
                </div>
              )}
              
              {/* Show messages when not loading or when we have messages */}
              {(!isActiveLoading || (activeMessages && activeMessages.length > 0)) && (
                <div className={`space-y-3 sm:space-y-4 pb-4 transition-opacity duration-200 ${
                  isActiveLoading ? 'opacity-50' : 'opacity-100'
                }`}>
                  {activeMessages?.map((msg) => (
                <div key={msg.id}>
                  {renderMessage(msg)}
                </div>
              ))}
              <div ref={messagesEndRef} />
                </div>
              )}
              
              {/* Show empty state when no messages and not loading */}
              {!isActiveLoading && (!activeMessages || activeMessages.length === 0) && conversationId && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start the conversation below</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🎯 FIXED COMPOSER - Always visible at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 p-3 sm:p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2 sm:space-x-3">
              <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
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
                <button
                  type="button"
                      onClick={() => setShowProductModal(true)}
                      className="p-2 text-gray-400 hover:text-[#0E2A47] transition-colors touch-manipulation"
                      title="Recommend Product"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
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
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Type a message..."
                className="flex-1 text-sm sm:text-base min-w-0"
                style={{ fontSize: '16px' }} // Prevent zoom on iOS
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="px-3 py-2 touch-manipulation flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* 🎯 RIGHT SIDEBAR - Conversation Details */}
        <div className="hidden lg:block w-80 border-l border-gray-200 bg-white flex-shrink-0">
          <div className="h-full overflow-y-auto overflow-x-hidden">
          <div className="p-4 space-y-6">
              
              {/* Shipment Overview */}
            {shipment && (
              <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-[#0E2A47]">Shipment Details</h3>
                    </div>
                    <Link
                      to={`${user?.role === 'client' ? '/portal/shipments' : '/app/shipments'}?focus=${shipment._id}`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#0E2A47] hover:bg-[#1a3a5c] rounded-lg transition-colors w-full justify-center"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      View Shipment Details
                    </Link>
                  </div>
                  
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {/* Pet Info */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span className="text-sm font-medium text-gray-900">Pet Information</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <p className="text-sm text-gray-700">
                    <span className="font-medium">{shipment.petName}</span>
                          {shipment.petType && (
                            <span className="text-gray-500"> • {shipment.petType}</span>
                          )}
                        </p>
                        {shipment.petBreed && (
                          <p className="text-xs text-gray-500">{shipment.petBreed}</p>
                        )}
                        {shipment.petWeight && (
                          <p className="text-xs text-gray-500">{shipment.petWeight} lbs</p>
                        )}
                  </div>
                    </div>

                    {/* Route */}
                    {shipment.route && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">Route</span>
                        </div>
                        <div className="ml-6">
                          <p className="text-sm text-gray-700">
                      {shipment.route.from} → {shipment.route.to}
                          </p>
                  </div>
                      </div>
                    )}

                    {/* Estimated Departure */}
                    {shipment.estimatedDeparture && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-900">Estimated Departure</span>
                        </div>
                        <div className="ml-6">
                          <p className="text-sm text-gray-700">
                            {new Date(shipment.estimatedDeparture).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-900">Status</span>
                      </div>
                      <div className="ml-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          shipment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shipment.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pending'}
                    </span>
                  </div>
                    </div>

                    {/* Special Instructions */}
                    {shipment.specialInstructions && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-gray-900">Special Instructions</span>
                        </div>
                        <div className="ml-6">
                          <p className="text-sm text-gray-700">{shipment.specialInstructions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Conversation Participants */}
              {conversation && (
                <div>
                  <h3 className="text-lg font-medium text-[#0E2A47] mb-3">Participants</h3>
                  <div className="space-y-2">
                    {(() => {
                      const { participants } = getParticipantDetails(conversation.participantIds);
                      return participants.map((participant) => (
                        <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                          <div className="w-8 h-8 bg-[#0E2A47] rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {participant.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {participant.role === 'client' ? 'Customer' : participant.role}
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
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
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
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
                          <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
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
      </div>

      {/* 🎯 MOBILE DETAILS MODAL */}
      {showMobileDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          style={{ position: 'fixed' }}
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowMobileDetails(false);
            }
          }}
        >
          <div 
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#0E2A47]">Conversation Details</h2>
              <button
                onClick={() => setShowMobileDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
              <div className="p-4 space-y-6">
                
                {/* Shipment Overview */}
                {shipment && (
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-[#0E2A47]">Shipment Details</h3>
                  </div>
                  <Link 
                        to={`${user?.role === 'client' ? '/portal/shipments' : '/app/shipments'}?focus=${shipment._id}`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#0E2A47] hover:bg-[#1a3a5c] rounded-lg transition-colors w-full justify-center"
                        onClick={() => setShowMobileDetails(false)}
                  >
                        <Package className="w-4 h-4 mr-2" />
                        View Shipment Details
                  </Link>
                </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {/* Pet Info */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Heart className="w-4 h-4 text-pink-500" />
                          <span className="text-sm font-medium text-gray-900">Pet Information</span>
              </div>
                        <div className="ml-6 space-y-1">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{shipment.petName}</span>
                            {shipment.petType && (
                              <span className="text-gray-500"> • {shipment.petType}</span>
                            )}
                          </p>
                          {shipment.petBreed && (
                            <p className="text-xs text-gray-500">{shipment.petBreed}</p>
                          )}
                          {shipment.petWeight && (
                            <p className="text-xs text-gray-500">{shipment.petWeight} lbs</p>
                          )}
                        </div>
                      </div>

                      {/* Route */}
                      {shipment.route && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-900">Route</span>
                          </div>
                          <div className="ml-6">
                            <p className="text-sm text-gray-700">
                              {shipment.route.from} → {shipment.route.to}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Estimated Departure */}
                      {shipment.estimatedDeparture && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-900">Estimated Departure</span>
                          </div>
                          <div className="ml-6">
                            <p className="text-sm text-gray-700">
                              {new Date(shipment.estimatedDeparture).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Package className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-900">Status</span>
                        </div>
                        <div className="ml-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shipment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shipment.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {shipment.specialInstructions && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-900">Special Instructions</span>
                          </div>
                          <div className="ml-6">
                            <p className="text-sm text-gray-700">{shipment.specialInstructions}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conversation Participants */}
                {conversation && (
                  <div>
                    <h3 className="text-lg font-medium text-[#0E2A47] mb-3">Participants</h3>
                    <div className="space-y-2">
                      {(() => {
                        const { participants } = getParticipantDetails(conversation.participantIds);
                        return participants.map((participant) => (
                          <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                            <div className="w-8 h-8 bg-[#0E2A47] rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {participant.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {participant.name}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {participant.role === 'client' ? 'Customer' : participant.role}
                              </p>
                            </div>
                          </div>
                        ));
                      })()}
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
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
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
                            <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
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
        </div>
      )}

      {/* 🎯 MOBILE BOTTOM NAVIGATION - Fixed at bottom */}
      <div className={`md:hidden flex-shrink-0 transition-transform duration-300 z-50 ${
        isKeyboardOpen ? 'transform translate-y-full' : 'transform translate-y-0'
      }`}>
        <nav className="bg-white border-t border-gray-200">
          <div className="grid grid-cols-4 h-16">
            <Link
              to="/portal/dashboard"
              className="flex flex-col items-center justify-center space-y-1 transition-colors text-gray-400 hover:text-[#0E2A47]"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-xs font-medium">Dashboard</span>
            </Link>
            <Link
              to="/portal/inbox"
              className="flex flex-col items-center justify-center space-y-1 transition-colors text-[#0E2A47] bg-[#F3C0CF]/10"
            >
              <Inbox className="w-5 h-5" />
              <span className="text-xs font-medium">Inbox</span>
            </Link>
            <Link
              to="/portal/shipments"
              className="flex flex-col items-center justify-center space-y-1 transition-colors text-gray-400 hover:text-[#0E2A47]"
            >
              <Package className="w-5 h-5" />
              <span className="text-xs font-medium">Shipments</span>
            </Link>
            <Link
              to="/portal/billing"
              className="flex flex-col items-center justify-center space-y-1 transition-colors text-gray-400 hover:text-[#0E2A47]"
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-medium">Billing</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Quote Modal */}
      <Modal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        title="Send Quote to Customer"
        size="lg"
      >
        <div className="space-y-6">
          {/* Improved tip section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">💡</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0E2A47] mb-1">Quick Tip</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Select a quote template below. The customer will receive the quote and can accept it to proceed with booking.
                </p>
              </div>
            </div>
          </div>

          {/* Redesigned quote template cards */}
        <div className="space-y-4">
          {quoteTemplates && quoteTemplates.map((template) => (
              <div key={template._id} className="group border-2 border-gray-100 rounded-xl p-6 hover:border-[#F3C0CF] hover:shadow-lg transition-all duration-200 bg-white">
                {/* Header with title and price */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <h4 className="text-lg font-semibold text-[#0E2A47] mb-1 group-hover:text-[#1a3a5c] transition-colors">
                      {template.title}
                    </h4>
                    <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                      Starting at {formatCurrency(template.defaultPriceCents)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold text-[#0E2A47] leading-none">
                  {formatCurrency(template.defaultPriceCents)}
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div className="mb-5">
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {template.body}
                  </p>
                </div>
                
                {/* Action button - full width and prominent */}
                <div className="pt-4 border-t border-gray-100">
                <Button
                    onClick={() => handleSendQuote(template._id)}
                  disabled={sendQuoteMutation.isPending}
                    className="w-full bg-[#F3C0CF] hover:bg-[#E8A5B8] text-[#0E2A47] font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-base"
                  >
                    {sendQuoteMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0E2A47] mr-3"></div>
                        <span>Sending Quote...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Send className="w-5 h-5 mr-3" />
                        <span>Send This Quote</span>
                      </div>
                    )}
                </Button>
              </div>
            </div>
          ))}
          </div>

          {(!quoteTemplates || quoteTemplates.length === 0) && (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quote Templates Available</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                Create quote templates in the Admin section to send professional quotes to customers quickly and efficiently.
              </p>
              <Link
                to="/app/admin"
                className="inline-flex items-center px-6 py-3 bg-[#0E2A47] hover:bg-[#1a3a5c] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Quote Templates
              </Link>
            </div>
          )}
        </div>
      </Modal>

      {/* Product Recommendation Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Recommend Product"
        size="lg"
      >
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-blue-800">
            <strong>Recommend a product to your customer.</strong> They'll see the product details and can purchase it directly from the conversation.
          </p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {products && products.filter(p => p.active).map((product) => (
            <div
              key={product._id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {formatCurrency(product.priceCents)}
                  </p>
                </div>
                <Button
                  onClick={() => sendProductMutation.mutate(product._id)}
                  disabled={sendProductMutation.isPending}
                  className="ml-4"
                >
                  {sendProductMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Recommend
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          {(!products || products.filter(p => p.active).length === 0) && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
              <p className="text-gray-600 mb-4">
                Add products in the Admin section to recommend them to customers.
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
          defaultAmount={paymentAmount}
        />
      </Modal>
    </div>
  );
};

const PaymentRequestForm: React.FC<{
  onSubmit: (amount: number) => void;
  isLoading: boolean;
  defaultAmount?: number;
}> = ({ onSubmit, isLoading, defaultAmount = 0 }) => {
  const [amount, setAmount] = useState(defaultAmount > 0 ? defaultAmount.toString() : '');

  // Update amount when defaultAmount changes
  useEffect(() => {
    if (defaultAmount > 0) {
      setAmount(defaultAmount.toString());
    }
  }, [defaultAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInDollars = parseFloat(amount);
    if (amountInDollars > 0) {
      onSubmit(amountInDollars); // Pass dollars, not cents
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
  
  // 🚀 Use Convex data instead of TanStack Query
  const convexConversations = useConvexQuery(
    api.conversations.list, 
    user ? { userId: user.id, userRole: user.role } : "skip"
  );
  const convexUsers = useConvexQuery(api.users.list);
  
  // Transform to match existing types
  const conversations = convexConversations?.map((conv: any) => ({
    id: conv._id,
    title: conv.title,
    participantIds: conv.participantIds,
    lastMessageAt: new Date(conv.lastMessageAt).toISOString(),
    kind: conv.kind,
  })) || [];
  
  const users = convexUsers;
  const isLoading = convexConversations === undefined;

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
      .map(id => users.find(u => u._id === id || (u as any).id === id))
      .filter(Boolean)
      .map(u => u && ({
        id: u._id || (u as any).id,
        name: u.name,
        email: u.email,
        role: u.role,
        orgId: u.orgId
      }))
      .filter(Boolean) as User[];
    
    return { participants };
  };



  const basePrefix = user?.role === 'client' ? '/portal' : '/app';

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#0E2A47]">Conversations</h2>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
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