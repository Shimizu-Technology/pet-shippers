import MockAdapter from 'axios-mock-adapter';
import { http } from '../lib/http';
import { seed } from './seed';
import { v4 as uuid } from 'uuid';

export function setupMockApi() {
  const mock = new MockAdapter(http, { delayResponse: 300 });

  // Helper function to get current user from localStorage
  const getCurrentUser = () => {
    try {
      const stored = localStorage.getItem('pet_shipper_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  // Auth
  mock.onPost('/session').reply((config) => {
    const { role } = JSON.parse(config.data || '{}');
    
    // Return appropriate user based on role
    let user;
    if (role === 'client') {
      user = seed.users.find(u => u.role === 'client') || seed.users[5]; // Sarah Johnson
    } else if (role === 'partner') {
      user = seed.users.find(u => u.role === 'partner') || seed.users[3]; // Hawaii Pet Express
    } else if (role === 'staff') {
      user = seed.users.find(u => u.role === 'staff') || seed.users[1]; // Ken Staff
    } else {
      user = seed.users[0]; // Ada Admin (default for admin role)
    }
    
    return [200, { user }];
  });

  // Users
  mock.onGet('/users').reply(() => {
    return [200, { users: seed.users }];
  });

  // Conversations
  mock.onGet('/conversations').reply((config) => {
    try {
      console.log('Mock API: GET /conversations called', config);
      
      const currentUser = getCurrentUser();
      let conversations = [...seed.conversations];
      
      // Role-based filtering
      if (currentUser) {
        if (currentUser.role === 'client' || currentUser.role === 'partner') {
          // Clients and partners only see conversations they're participating in
          conversations = conversations.filter(c => 
            c.participantIds.includes(currentUser.id)
          );
        }
        // Admin and staff see all conversations (no additional filtering)
      }
      
      // Apply query parameter filters
      if (config.params) {
        const { kind, search } = config.params;
        
        if (kind && kind !== 'All') {
          const filterValue = kind.toLowerCase();
          conversations = conversations.filter(c => c.kind === filterValue);
        }
        
        if (search && search.trim()) {
          const searchLower = search.toLowerCase();
          conversations = conversations.filter(c => 
            c.title.toLowerCase().includes(searchLower)
          );
        }
      }
      
      // Sort by lastMessageAt desc
      conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      
      console.log('Mock API: Returning conversations for user:', currentUser?.role, conversations);
      return [200, { conversations }];
    } catch (error) {
      console.error('Mock API error:', error);
      return [500, { error: 'Internal server error' }];
    }
  });

  mock.onGet(/\/conversations\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').pop()!;
    const conv = seed.conversations.find(c => c.id === id);
    return conv ? [200, { conversation: conv }] : [404, { error: 'Conversation not found' }];
  });

  mock.onGet(/\/conversations\/[^/]+\/messages/).reply((config) => {
    const id = config.url!.split('/')[2];
    const msgs = seed.messages
      .filter(m => m.conversationId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return [200, { messages: msgs }];
  });

  mock.onPost(/\/conversations\/[^/]+\/messages/).reply((config) => {
    const id = config.url!.split('/')[2];
    const body = JSON.parse(config.data || '{}');
    const currentUser = getCurrentUser();
    const msg = { 
      id: uuid(), 
      conversationId: id, 
      senderId: currentUser?.id || 'u_staff', 
      createdAt: new Date().toISOString(), 
      ...body 
    };
    seed.messages.push(msg);
    
    // Update conversation lastMessageAt
    const conv = seed.conversations.find(c => c.id === id);
    if (conv) {
      conv.lastMessageAt = msg.createdAt;
    }
    
    return [201, { message: msg }];
  });

  // Shipments
  mock.onGet('/shipments').reply((config) => {
    try {
      const currentUser = getCurrentUser();
      let list = [...seed.shipments];
      
      // Role-based filtering
      if (currentUser) {
        if (currentUser.role === 'client') {
          // Clients only see their own shipments (by conversation participation)
          const userConversationIds = seed.conversations
            .filter(c => c.participantIds.includes(currentUser.id))
            .map(c => c.id);
          list = list.filter(s => userConversationIds.includes(s.conversationId));
        } else if (currentUser.role === 'partner') {
          // Partners see shipments for conversations they're part of
          const partnerConversationIds = seed.conversations
            .filter(c => c.participantIds.includes(currentUser.id))
            .map(c => c.id);
          list = list.filter(s => partnerConversationIds.includes(s.conversationId));
        }
        // Admin and staff see all shipments (no additional filtering)
      }
      
      if (config.params && config.params.status && config.params.status !== 'all') {
        list = list.filter(s => s.status === config.params.status);
      }
      
      // Sort by updatedAt desc
      list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      
      console.log('Mock API: Returning shipments for user:', currentUser?.role, list.length);
      return [200, { shipments: list }];
    } catch (error) {
      console.error('Mock API shipments error:', error);
      return [500, { error: 'Internal server error' }];
    }
  });

  mock.onGet(/\/shipments\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').pop()!;
    const s = seed.shipments.find(x => x.id === id);
    return s ? [200, { shipment: s }] : [404, { error: 'Shipment not found' }];
  });

  mock.onPatch(/\/shipments\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').pop()!;
    const patch = JSON.parse(config.data || '{}');
    const s = seed.shipments.find(x => x.id === id);
    if (!s) return [404, { error: 'Shipment not found' }];
    
    const oldStatus = s.status;
    s.status = patch.status ?? s.status;
    s.updatedAt = new Date().toISOString();
    
    // Push a system message
    const msg = {
      id: uuid(), 
      conversationId: s.conversationId, 
      senderId: 'system',
      createdAt: new Date().toISOString(), 
      kind: 'status' as const,
      payload: { shipmentId: s.id, from: oldStatus, to: s.status }
    };
    seed.messages.push(msg);
    
    // Update conversation lastMessageAt
    const conv = seed.conversations.find(c => c.id === s.conversationId);
    if (conv) {
      conv.lastMessageAt = msg.createdAt;
    }
    
    return [200, { shipment: s }];
  });

  // Documents
  mock.onGet(/\/shipments\/[^/]+\/documents/).reply((config) => {
    const id = config.url!.split('/')[2];
    const docs = seed.documents.filter(d => d.shipmentId === id);
    return [200, { documents: docs }];
  });

  mock.onGet('/documents').reply(() => {
    const currentUser = getCurrentUser();
    let documents = [...seed.documents];
    
    // Role-based filtering
    if (currentUser) {
      if (currentUser.role === 'client') {
        // Clients only see documents for their own shipments
        const userConversationIds = seed.conversations
          .filter(c => c.participantIds.includes(currentUser.id))
          .map(c => c.id);
        const userShipmentIds = seed.shipments
          .filter(s => userConversationIds.includes(s.conversationId))
          .map(s => s.id);
        documents = documents.filter(d => d.shipmentId && userShipmentIds.includes(d.shipmentId));
      } else if (currentUser.role === 'partner') {
        // Partners see documents for shipments they're involved in
        const partnerConversationIds = seed.conversations
          .filter(c => c.participantIds.includes(currentUser.id))
          .map(c => c.id);
        const partnerShipmentIds = seed.shipments
          .filter(s => partnerConversationIds.includes(s.conversationId))
          .map(s => s.id);
        documents = documents.filter(d => d.shipmentId && partnerShipmentIds.includes(d.shipmentId));
      }
      // Admin and staff see all documents (no additional filtering)
    }
    
    console.log('Mock API: Returning documents for user:', currentUser?.role, documents.length);
    return [200, { documents }];
  });

  mock.onPost('/documents').reply(() => {
    const doc = { 
      id: uuid(), 
      name: 'Uploaded Document.pdf', 
      type: 'other' as const, 
      url: '#upload-placeholder'
    };
    return [201, { document: doc }];
  });

  mock.onPost(/\/documents\/[^/]+\/attach/).reply((config) => {
    const id = config.url!.split('/')[2];
    const body = JSON.parse(config.data || '{}');
    const idx = seed.documents.findIndex(d => d.id === id);
    if (idx === -1) return [404, { error: 'Document not found' }];
    
    seed.documents[idx] = { ...seed.documents[idx], ...body };
    return [200, { document: seed.documents[idx] }];
  });

  // Quote templates & quotes
  mock.onGet('/quote_templates').reply(() => {
    return [200, { quote_templates: seed.quoteTemplates }];
  });

  mock.onPost('/quote_templates').reply((config) => {
    const body = JSON.parse(config.data || '{}');
    const qt = { id: uuid(), ...body };
    seed.quoteTemplates.push(qt);
    return [201, { quote_template: qt }];
  });

  mock.onPut(/\/quote_templates\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').pop()!;
    const body = JSON.parse(config.data || '{}');
    const idx = seed.quoteTemplates.findIndex(qt => qt.id === id);
    if (idx === -1) return [404, { error: 'Template not found' }];
    
    seed.quoteTemplates[idx] = { ...seed.quoteTemplates[idx], ...body };
    return [200, { quote_template: seed.quoteTemplates[idx] }];
  });

  mock.onDelete(/\/quote_templates\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').pop()!;
    const idx = seed.quoteTemplates.findIndex(qt => qt.id === id);
    if (idx === -1) return [404, { error: 'Template not found' }];
    
    seed.quoteTemplates.splice(idx, 1);
    return [200, { success: true }];
  });

  mock.onPost(/\/conversations\/[^/]+\/quotes/).reply((config) => {
    const id = config.url!.split('/')[2];
    const body = JSON.parse(config.data || '{}'); // {templateId, priceCents?}
    const tpl = seed.quoteTemplates.find(t => t.id === body.templateId);
    const currentUser = getCurrentUser();
    const msg = {
      id: uuid(), 
      conversationId: id, 
      senderId: currentUser?.id || 'u_staff',
      createdAt: new Date().toISOString(), 
      kind: 'quote' as const,
      payload: { 
        quoteId: uuid(), 
        title: tpl?.title ?? 'Quote', 
        priceCents: body.priceCents ?? tpl?.defaultPriceCents ?? 0 
      }
    };
    seed.messages.push(msg);
    
    // Update conversation lastMessageAt
    const conv = seed.conversations.find(c => c.id === id);
    if (conv) {
      conv.lastMessageAt = msg.createdAt;
    }

    return [201, { message: msg }];
  });

  mock.onPost(/\/conversations\/[^/]+\/products/).reply((config) => {
    const id = config.url!.split('/')[2];
    const body = JSON.parse(config.data || '{}'); // {productId}
    const product = seed.products.find(p => p.id === body.productId);
    const currentUser = getCurrentUser();
    
    if (!product) {
      return [404, { error: 'Product not found' }];
    }
    
    const msg = {
      id: uuid(), 
      conversationId: id, 
      senderId: currentUser?.id || 'u_staff',
      createdAt: new Date().toISOString(), 
      kind: 'product' as const,
      payload: { 
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        priceCents: product.priceCents
      }
    };
    seed.messages.push(msg);
    
    // Update conversation lastMessageAt
    const conv = seed.conversations.find(c => c.id === id);
    if (conv) {
      conv.lastMessageAt = msg.createdAt;
    }

    return [201, { message: msg }];
  });

  // Products
  mock.onGet('/products').reply(() => {
    return [200, { products: seed.products }];
  });

  mock.onPost('/products').reply((config) => {
    const body = JSON.parse(config.data || '{}');
    const product = { id: uuid(), active: true, ...body };
    seed.products.push(product);
    return [201, { product }];
  });

  mock.onPut(/\/products\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').pop()!;
    const body = JSON.parse(config.data || '{}');
    const idx = seed.products.findIndex(p => p.id === id);
    if (idx === -1) return [404, { error: 'Product not found' }];
    
    seed.products[idx] = { ...seed.products[idx], ...body };
    return [200, { product: seed.products[idx] }];
  });

  mock.onDelete(/\/products\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').pop()!;
    const idx = seed.products.findIndex(p => p.id === id);
    if (idx === -1) return [404, { error: 'Product not found' }];
    
    seed.products.splice(idx, 1);
    return [200, { success: true }];
  });

  // Payment Requests
  mock.onGet('/payment_requests').reply(() => {
    return [200, { payment_requests: seed.paymentRequests }];
  });

  mock.onGet(/\/conversations\/[^/]+\/payments/).reply((config) => {
    const conversationId = config.url!.split('/')[2];
    const payments = seed.paymentRequests.filter(pr => pr.conversationId === conversationId);
    return [200, { payment_requests: payments }];
  });

  mock.onPost(/\/conversations\/[^/]+\/payments/).reply((config) => {
    const conversationId = config.url!.split('/')[2];
    const body = JSON.parse(config.data || '{}');
    
    // Create payment request
    const paymentRequest = {
      id: uuid(),
      conversationId,
      amountCents: body.amountCents,
      status: 'requested' as const,
      createdAt: new Date().toISOString()
    };
    seed.paymentRequests.push(paymentRequest);
    
    // Post system message about payment request
    const msg = {
      id: uuid(),
      conversationId,
      senderId: 'system',
      createdAt: new Date().toISOString(),
      kind: 'status' as const,
      payload: { 
        type: 'payment_requested', 
        amountCents: body.amountCents,
        paymentRequestId: paymentRequest.id
      }
    };
    seed.messages.push(msg);
    
    // Update conversation lastMessageAt
    const conv = seed.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.lastMessageAt = msg.createdAt;
    }
    
    return [201, { payment_request: paymentRequest }];
  });

  mock.onPost(/\/payments\/[^/]+\/mark_paid/).reply((config) => {
    const paymentId = config.url!.split('/')[2];
    const paymentRequest = seed.paymentRequests.find(pr => pr.id === paymentId);
    
    if (!paymentRequest) {
      return [404, { error: 'Payment request not found' }];
    }
    
    // Mark as paid
    paymentRequest.status = 'paid';
    
    // Post system message about payment completion
    const msg = {
      id: uuid(),
      conversationId: paymentRequest.conversationId,
      senderId: 'system',
      createdAt: new Date().toISOString(),
      kind: 'status' as const,
      payload: { 
        type: 'payment_completed', 
        amountCents: paymentRequest.amountCents,
        paymentRequestId: paymentRequest.id
      }
    };
    seed.messages.push(msg);
    
    // Update conversation lastMessageAt
    const conv = seed.conversations.find(c => c.id === paymentRequest.conversationId);
    if (conv) {
      conv.lastMessageAt = msg.createdAt;
    }
    
    return [200, { payment_request: paymentRequest }];
  });

  // Legacy payment endpoint
  mock.onPost('/orders').reply((config) => {
    const body = JSON.parse(config.data || '{}');
    const checkoutUrl = `https://checkout.stripe.com/pay/mock-${uuid()}`;
    
    // Create payment request if conversationId provided
    if (body.conversationId) {
      const paymentRequest = {
        id: uuid(),
        conversationId: body.conversationId,
        amountCents: body.amount || body.amountCents || 0,
        status: 'requested' as const,
        createdAt: new Date().toISOString()
      };
      seed.paymentRequests.push(paymentRequest);
      
      const msg = {
        id: uuid(),
        conversationId: body.conversationId,
        senderId: 'system',
        createdAt: new Date().toISOString(),
        kind: 'status' as const,
        payload: { 
          type: 'payment_requested', 
          amountCents: paymentRequest.amountCents, 
          checkoutUrl,
          paymentRequestId: paymentRequest.id
        }
      };
      seed.messages.push(msg);
      
      // Update conversation lastMessageAt
      const conv = seed.conversations.find(c => c.id === body.conversationId);
      if (conv) {
        conv.lastMessageAt = msg.createdAt;
      }
    }
    
    return [201, { checkoutUrl }];
  });

  // Quote Requests
  mock.onPost('/quote_requests').reply((config) => {
    const data = JSON.parse(config.data);
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      // Fallback to a default client user if no user is found
      const fallbackUser = seed.users.find(u => u.role === 'client') || {
        id: 'temp_user',
        name: 'Guest User',
        email: 'guest@example.com',
        role: 'client' as const
      };
      console.warn('No current user found, using fallback:', fallbackUser);
    }

    const user = currentUser || seed.users.find(u => u.role === 'client') || {
      id: 'temp_user',
      name: 'Guest User', 
      email: 'guest@example.com',
      role: 'client' as const
    };

    // Create a new conversation for the quote request
    const conversationId = `c_${Date.now()}`;
    const conversation = {
      id: conversationId,
      title: `Quote Request - ${data.petName}`,
      participantIds: [user.id, 'admin1'], // Admin will handle the request
      kind: 'client' as const,
      lastMessageAt: new Date().toISOString()
    };

    // Create initial message with quote request details
    const message = {
      id: `m_${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      createdAt: new Date().toISOString(),
      kind: 'text' as const,
      text: `Hi! I'd like to request a quote for shipping my ${data.petType} ${data.petName} from ${data.route.from} to ${data.route.to}.

Pet Details:
- Name: ${data.petName}
- Type: ${data.petType}
- Breed: ${data.petBreed || 'Not specified'}
- Weight: ${data.petWeight || 'Not specified'} lbs

Route: ${data.route.from} → ${data.route.to}
${data.preferredTravelDate ? `Preferred Date: ${data.preferredTravelDate}` : ''}

${data.specialRequirements ? `Special Requirements: ${data.specialRequirements}` : ''}

Please provide a quote when you have a chance. Thank you!`
    };

    // Create a preliminary shipment record
    const shipment = {
      id: `s_${Date.now()}`,
      conversationId,
      petName: data.petName,
      petType: data.petType,
      petBreed: data.petBreed || '',
      petWeight: data.petWeight || 0,
      ownerName: user.name,
      ownerEmail: user.email,
      route: data.route,
      status: 'quote_requested' as const,
      estimatedDeparture: data.preferredTravelDate || undefined,
      specialInstructions: data.specialRequirements || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock data
    seed.conversations.push(conversation);
    seed.messages.push(message);
    seed.shipments.push(shipment);

    return [201, { 
      conversation,
      message,
      shipment,
      success: true 
    }];
  });

  console.log('Mock API setup complete');
  return mock;
}