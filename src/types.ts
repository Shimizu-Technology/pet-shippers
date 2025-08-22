export type Role = 'admin' | 'staff' | 'partner' | 'client';

export type User = { 
  id: string; 
  name: string; 
  role: Role; 
  orgId: string 
};

export type Conversation = {
  id: string;
  title: string;
  participantIds: string[];
  lastMessageAt: string;
  kind: 'client' | 'partner' | 'internal';
};

export type MessageKind = 'text' | 'image' | 'file' | 'quote' | 'product' | 'status';

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  kind: MessageKind;
  text?: string;
  payload?: Record<string, unknown>; // e.g. {quoteId, priceCents} or {status:'booked'}
};

export type ShipmentStatus = 
  | 'quote_requested'     // Initial inquiry
  | 'quote_sent'          // Quote provided to customer
  | 'booking_confirmed'   // Customer accepted and paid deposit
  | 'documents_pending'   // Waiting for health certificates, etc.
  | 'documents_approved'  // All documents verified
  | 'flight_scheduled'    // Flight booked and confirmed
  | 'ready_for_pickup'    // Pet ready to be collected
  | 'in_transit'          // Pet is traveling
  | 'arrived'             // Pet has arrived at destination
  | 'delivered'           // Pet delivered to owner
  | 'completed'           // Shipment fully completed
  | 'cancelled';          // Shipment cancelled

export type Shipment = {
  id: string;
  conversationId: string;
  petName: string;
  petType: 'dog' | 'cat' | 'other';
  petBreed?: string;
  petWeight?: number; // in lbs
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  route: { from: string; to: string };
  status: ShipmentStatus;
  estimatedDeparture?: string;
  estimatedArrival?: string;
  actualDeparture?: string;
  actualArrival?: string;
  flightNumber?: string;
  crateSize?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Document = {
  id: string;
  name: string;
  type: 'rabies_cert' | 'health_cert' | 'other';
  url: string;
  expiresOn?: string;
  conversationId?: string;
  shipmentId?: string;
};

export type QuoteTemplate = {
  id: string;
  title: string;
  body: string; // markdown/plain
  defaultPriceCents: number;
};

export type Product = { 
  id: string; 
  name: string; 
  sku: string; 
  priceCents: number; 
  active: boolean 
};

export type PaymentRequest = { 
  id: string; 
  conversationId: string; 
  amountCents: number; 
  status: 'requested' | 'paid';
  description?: string;
  createdAt: string;
  paidAt?: string;
  context?: {
    conversation?: any;
    shipment?: any;
    title: string;
    petName?: string;
    route?: { from: string; to: string };
    petType?: string;
  };
};