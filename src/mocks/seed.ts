import { Conversation, Document, Message, Product, QuoteTemplate, Shipment, User, PaymentRequest } from '../types';

export const seed = {
  users: [
    { id: 'u_admin', name: 'Ada Admin', role: 'admin', orgId: 'org1' },
    { id: 'u_staff', name: 'Ken Staff', role: 'staff', orgId: 'org1' },
    { id: 'u_staff2', name: 'Lisa Rodriguez', role: 'staff', orgId: 'org1' },
    { id: 'u_partner', name: 'Hawaii Pet Express', role: 'partner', orgId: 'org_hawaii_pets' },
    { id: 'u_partner2', name: 'Mainland Pet Transport', role: 'partner', orgId: 'org_mainland_pets' },
    { id: 'u_client1', name: 'Sarah Johnson', role: 'client', orgId: 'org_client1' },
    { id: 'u_client2', name: 'Mike Chen', role: 'client', orgId: 'org_client2' },
    { id: 'u_client3', name: 'Emma Williams', role: 'client', orgId: 'org_client3' },
    { id: 'u_client4', name: 'David Martinez', role: 'client', orgId: 'org_client4' },
    { id: 'u_client5', name: 'Jennifer Kim', role: 'client', orgId: 'org_client5' },
  ] as User[],
  conversations: [
    { 
      id: 'c1', 
      title: 'HNL ⇄ GUM — Max (Beagle)', 
      participantIds: ['u_admin', 'u_staff', 'u_partner', 'u_client1'], 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), 
      kind: 'client' 
    },
    { 
      id: 'c2', 
      title: 'LAX ⇄ GUM — Luna (Golden Retriever)', 
      participantIds: ['u_admin', 'u_client2'], 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), 
      kind: 'client' 
    },
    { 
      id: 'c3', 
      title: 'SEA ⇄ HNL — Buddy & Bella (French Bulldogs)', 
      participantIds: ['u_admin', 'u_staff', 'u_client3'], 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
      kind: 'client' 
    },
    { 
      id: 'c4', 
      title: 'Partner | Hawaii Pet Express - Route Coordination', 
      participantIds: ['u_admin', 'u_staff', 'u_partner'], 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), 
      kind: 'partner' 
    },
    { 
      id: 'c5', 
      title: 'DEN ⇄ GUM — Charlie (Maine Coon Cat)', 
      participantIds: ['u_admin', 'u_client4'], 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), 
      kind: 'client' 
    },
    { 
      id: 'c6', 
      title: 'NYC ⇄ HNL — Mochi (Shiba Inu)', 
      participantIds: ['u_staff', 'u_client5'], 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), 
      kind: 'client' 
    },
    { 
      id: 'c7', 
      title: 'Partner | Mainland Pet Transport - West Coast Routes', 
      participantIds: ['u_admin', 'u_staff', 'u_partner2'], 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), 
      kind: 'partner' 
    },
    { 
      id: 'c8', 
      title: 'Internal | Staff Meeting Notes', 
      participantIds: ['u_admin', 'u_staff'], 
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
      kind: 'internal' 
    },
  ] as Conversation[],
  messages: [
    // Conversation 1: Max (Beagle) - Complete workflow
    { 
      id: 'm1', 
      conversationId: 'c1', 
      senderId: 'u_client1', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), 
      kind: 'text', 
      text: 'Hi! Can we ship Max next month? He\'s a 2-year-old Beagle, about 25 lbs.' 
    },
    { 
      id: 'm2', 
      conversationId: 'c1', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), 
      kind: 'text', 
      text: 'Absolutely! Let me send you a quote for our door-to-door service.' 
    },
    { 
      id: 'm3', 
      conversationId: 'c1', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.4).toISOString(), 
      kind: 'quote', 
      payload: { quoteId: 'q1', title: 'Door-to-Door Service', priceCents: 85000 } 
    },
    { 
      id: 'm4', 
      conversationId: 'c1', 
      senderId: 'u_client1', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
      kind: 'text', 
      text: 'Perfect! I\'ll upload his documents now.' 
    },
    { 
      id: 'm5', 
      conversationId: 'c1', 
      senderId: 'system', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(), 
      kind: 'status', 
      payload: { shipmentId: 's1', from: 'requested', to: 'docs_ok' } 
    },
    { 
      id: 'm6', 
      conversationId: 'c1', 
      senderId: 'u_partner', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), 
      kind: 'text', 
      text: 'We can handle Max\'s transfer in Honolulu. Our team will coordinate the HNL-GUM connection and ensure all documentation is ready.' 
    },
    { 
      id: 'm7', 
      conversationId: 'c1', 
      senderId: 'system', 
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), 
      kind: 'status', 
      payload: { shipmentId: 's1', from: 'docs_ok', to: 'booked' } 
    },
    { 
      id: 'm8', 
      conversationId: 'c1', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), 
      kind: 'text', 
      text: 'Great news! Max is all booked. We\'ll pick him up at 8 AM on departure day.' 
    },

    // Conversation 2: Luna (Golden Retriever) - In progress
    { 
      id: 'm9', 
      conversationId: 'c2', 
      senderId: 'u_client2', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
      kind: 'text', 
      text: 'Hi, I need to ship my Golden Retriever Luna from LAX to Guam. She\'s 65 lbs and very friendly.' 
    },
    { 
      id: 'm10', 
      conversationId: 'c2', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString(), 
      kind: 'text', 
      text: 'Hi Mike! I\'d be happy to help with Luna\'s transport. Let me get you some pricing options.' 
    },
    { 
      id: 'm11', 
      conversationId: 'c2', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.7).toISOString(), 
      kind: 'quote', 
      payload: { quoteId: 'q2', title: 'Standard Door-to-Door', priceCents: 95000 } 
    },
    { 
      id: 'm12', 
      conversationId: 'c2', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.6).toISOString(), 
      kind: 'quote', 
      payload: { quoteId: 'q3', title: 'Airport-to-Airport', priceCents: 65000 } 
    },
    { 
      id: 'm13', 
      conversationId: 'c2', 
      senderId: 'u_client2', 
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), 
      kind: 'text', 
      text: 'The door-to-door service looks perfect. When can we schedule this?' 
    },

    // Conversation 3: Buddy & Bella (French Bulldogs) - Multiple pets
    { 
      id: 'm14', 
      conversationId: 'c3', 
      senderId: 'u_client3', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), 
      kind: 'text', 
      text: 'I need to relocate to Hawaii and bring my two French Bulldogs, Buddy and Bella. They\'re both around 20 lbs each.' 
    },
    { 
      id: 'm15', 
      conversationId: 'c3', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7.5).toISOString(), 
      kind: 'text', 
      text: 'Hi Emma! French Bulldogs require special care due to their breathing. We have experience with brachycephalic breeds.' 
    },
    { 
      id: 'm16', 
      conversationId: 'c3', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(), 
      kind: 'text', 
      text: 'We\'ll need health certificates within 10 days of travel and will coordinate with a vet for pre-flight checkups.' 
    },
    { 
      id: 'm17', 
      conversationId: 'c3', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6.5).toISOString(), 
      kind: 'quote', 
      payload: { quoteId: 'q4', title: 'Express Service (2 Pets)', priceCents: 220000 } 
    },
    { 
      id: 'm18', 
      conversationId: 'c3', 
      senderId: 'u_client3', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
      kind: 'text', 
      text: 'That sounds comprehensive. I appreciate the special attention for their breed. Let\'s proceed!' 
    },

    // Conversation 4: Partner coordination
    { 
      id: 'm19', 
      conversationId: 'c4', 
      senderId: 'u_partner', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), 
      kind: 'text', 
      text: 'Weekly capacity update: We can handle 15 pet transfers through Hawaii next week, 8 the following week. All health certificate requirements are up to date.' 
    },
    { 
      id: 'm20', 
      conversationId: 'c4', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11.5).toISOString(), 
      kind: 'text', 
      text: 'Perfect timing. We have 6 shipments ready for next week and 4 more pending documentation.' 
    },
    { 
      id: 'm21', 
      conversationId: 'c4', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), 
      kind: 'text', 
      text: 'Temperature restrictions still in effect for the summer months?' 
    },

    // Conversation 5: Charlie (Maine Coon Cat)
    { 
      id: 'm22', 
      conversationId: 'c5', 
      senderId: 'u_client4', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), 
      kind: 'text', 
      text: 'I\'m moving from Denver to Guam for work. My Maine Coon cat Charlie needs to come with me. He\'s about 15 lbs.' 
    },
    { 
      id: 'm23', 
      conversationId: 'c5', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 17).toISOString(), 
      kind: 'text', 
      text: 'Hi David! Cats have different requirements than dogs. We\'ll need a health certificate and rabies vaccination records.' 
    },
    { 
      id: 'm24', 
      conversationId: 'c5', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16.5).toISOString(), 
      kind: 'quote', 
      payload: { quoteId: 'q5', title: 'Standard Door-to-Door', priceCents: 78000 } 
    },
    { 
      id: 'm25', 
      conversationId: 'c5', 
      senderId: 'u_client4', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), 
      kind: 'text', 
      text: 'Charlie has all his shots up to date. When do you need the health certificate?' 
    },

    // Conversation 6: Mochi (Shiba Inu) - Payment example
    { 
      id: 'm26', 
      conversationId: 'c6', 
      senderId: 'u_client5', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
      kind: 'text', 
      text: 'Hi! I need to ship my Shiba Inu Mochi from NYC to Honolulu. She\'s 22 lbs and very well-behaved.' 
    },
    { 
      id: 'm27', 
      conversationId: 'c6', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), 
      kind: 'text', 
      text: 'Hello Jennifer! Shiba Inus are wonderful travelers. Let me get you a quote for the NYC to HNL route.' 
    },
    { 
      id: 'm28', 
      conversationId: 'c6', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22.5).toISOString(), 
      kind: 'quote', 
      payload: { quoteId: 'q6', title: 'Door-to-Door Service', priceCents: 125000 } 
    },
    { 
      id: 'm29', 
      conversationId: 'c6', 
      senderId: 'u_client5', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), 
      kind: 'text', 
      text: 'Looks good! How do I proceed with payment and scheduling?' 
    },
    { 
      id: 'm30', 
      conversationId: 'c6', 
      senderId: 'system', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), 
      kind: 'status', 
      payload: { type: 'payment_requested', amountCents: 62500, paymentRequestId: 'pr3' } 
    },

    // Conversation 7: Partner discussion
    { 
      id: 'm31', 
      conversationId: 'c7', 
      senderId: 'u_partner2', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), 
      kind: 'text', 
      text: 'We\'re expanding our pet shipping network and can now offer direct West Coast to Guam routes starting next month. This will reduce transit time by 2 days.' 
    },
    { 
      id: 'm32', 
      conversationId: 'c7', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 35).toISOString(), 
      kind: 'text', 
      text: 'That\'s excellent news! What are the capacity and scheduling details?' 
    },
    { 
      id: 'm33', 
      conversationId: 'c7', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), 
      kind: 'text', 
      text: 'This could significantly reduce our transit times for West Coast clients.' 
    },

    // Conversation 8: Internal staff meeting
    { 
      id: 'm34', 
      conversationId: 'c8', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), 
      kind: 'text', 
      text: 'Team meeting notes: We\'re seeing increased demand for cat transport. Let\'s review our feline protocols.' 
    },
    { 
      id: 'm35', 
      conversationId: 'c8', 
      senderId: 'u_staff', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(), 
      kind: 'text', 
      text: 'Agreed. We should also update our crate size recommendations for larger cat breeds.' 
    },
    { 
      id: 'm36', 
      conversationId: 'c8', 
      senderId: 'u_admin', 
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
      kind: 'text', 
      text: 'I\'ll draft updated guidelines for cat transport and share them for review.' 
    },
  ] as Message[],
  shipments: [
    { 
      id: 's1', 
      conversationId: 'c1', 
      petName: 'Max', 
      petType: 'dog',
      petBreed: 'Beagle',
      petWeight: 25,
      ownerName: 'Sarah Johnson',
      ownerEmail: 'sarah.johnson@email.com',
      ownerPhone: '+1 (555) 123-4567',
      route: { from: 'GUM', to: 'HNL' }, 
      status: 'booking_confirmed',
      estimatedDeparture: '2024-03-15T08:00:00Z',
      estimatedArrival: '2024-03-15T14:30:00Z',
      flightNumber: 'AA1234',
      crateSize: 'IATA Size 2 (Medium)',
      specialInstructions: 'Friendly dog, no special requirements',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    { 
      id: 's2', 
      conversationId: 'c2', 
      petName: 'Luna', 
      petType: 'dog',
      petBreed: 'Golden Retriever',
      petWeight: 65,
      ownerName: 'Mike Chen',
      ownerEmail: 'mike.chen@email.com',
      ownerPhone: '+1 (555) 234-5678',
      route: { from: 'LAX', to: 'GUM' }, 
      status: 'quote_sent',
      crateSize: 'IATA Size 4 (X-Large)',
      specialInstructions: 'Very friendly, loves treats',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    { 
      id: 's3', 
      conversationId: 'c3', 
      petName: 'Buddy', 
      petType: 'dog',
      petBreed: 'French Bulldog',
      petWeight: 20,
      ownerName: 'Emma Williams',
      ownerEmail: 'emma.williams@email.com',
      ownerPhone: '+1 (555) 345-6789',
      route: { from: 'SEA', to: 'HNL' }, 
      status: 'documents_pending',
      crateSize: 'IATA Size 2 (Medium)',
      specialInstructions: 'Brachycephalic breed - temperature sensitive, requires climate control',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    { 
      id: 's4', 
      conversationId: 'c3', 
      petName: 'Bella', 
      petType: 'dog',
      petBreed: 'French Bulldog',
      petWeight: 18,
      ownerName: 'Emma Williams',
      ownerEmail: 'emma.williams@email.com',
      ownerPhone: '+1 (555) 345-6789',
      route: { from: 'SEA', to: 'HNL' }, 
      status: 'documents_pending',
      crateSize: 'IATA Size 2 (Medium)',
      specialInstructions: 'Brachycephalic breed - temperature sensitive, travels with Buddy',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    { 
      id: 's5', 
      conversationId: 'c5', 
      petName: 'Charlie', 
      petType: 'cat',
      petBreed: 'Maine Coon',
      petWeight: 15,
      ownerName: 'David Martinez',
      ownerEmail: 'david.martinez@email.com',
      ownerPhone: '+1 (555) 456-7890',
      route: { from: 'DEN', to: 'GUM' }, 
      status: 'flight_scheduled',
      estimatedDeparture: '2024-03-20T10:00:00Z',
      estimatedArrival: '2024-03-20T18:45:00Z',
      flightNumber: 'UA789',
      crateSize: 'IATA Size 3 (Large)',
      specialInstructions: 'Large cat, very calm temperament',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
    },
    { 
      id: 's6', 
      conversationId: 'c6', 
      petName: 'Mochi', 
      petType: 'dog',
      petBreed: 'Shiba Inu',
      petWeight: 22,
      ownerName: 'Jennifer Kim',
      ownerEmail: 'jennifer.kim@email.com',
      ownerPhone: '+1 (555) 567-8901',
      route: { from: 'NYC', to: 'HNL' }, 
      status: 'in_transit',
      estimatedDeparture: '2024-03-12T06:00:00Z',
      estimatedArrival: '2024-03-12T16:30:00Z',
      actualDeparture: '2024-03-12T06:15:00Z',
      flightNumber: 'UA456',
      crateSize: 'IATA Size 2 (Medium)',
      specialInstructions: 'Well-behaved, no special requirements',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
    },
    // Some completed shipments for history
    { 
      id: 's7', 
      conversationId: 'c_old1', 
      petName: 'Rocco', 
      petType: 'dog',
      petBreed: 'German Shepherd',
      petWeight: 75,
      ownerName: 'Michael Brown',
      ownerEmail: 'michael.brown@email.com',
      route: { from: 'LAX', to: 'GUM' }, 
      status: 'completed',
      actualDeparture: '2024-03-08T09:00:00Z',
      actualArrival: '2024-03-08T15:30:00Z',
      flightNumber: 'DL789',
      crateSize: 'IATA Size 4 (X-Large)',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    { 
      id: 's8', 
      conversationId: 'c_old2', 
      petName: 'Princess', 
      petType: 'cat',
      petBreed: 'Persian',
      petWeight: 8,
      ownerName: 'Lisa Anderson',
      ownerEmail: 'lisa.anderson@email.com',
      route: { from: 'SFO', to: 'HNL' }, 
      status: 'arrived',
      actualDeparture: '2024-03-04T11:00:00Z',
      actualArrival: '2024-03-04T16:00:00Z',
      flightNumber: 'AS123',
      crateSize: 'IATA Size 1 (Small)',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
    },
    { 
      id: 's9', 
      conversationId: 'c_old3', 
      petName: 'Zeus', 
      petType: 'dog',
      petBreed: 'Great Dane',
      petWeight: 120,
      ownerName: 'Robert Taylor',
      ownerEmail: 'robert.taylor@email.com',
      route: { from: 'PDX', to: 'GUM' }, 
      status: 'completed',
      actualDeparture: '2024-02-28T07:30:00Z',
      actualArrival: '2024-02-28T14:15:00Z',
      flightNumber: 'SW567',
      crateSize: 'IATA Size 5 (Giant)',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString()
    },
  ] as Shipment[],
  documents: [
    // Max (Beagle) - s1
    { 
      id: 'd1', 
      name: 'Max_Rabies_Certificate.pdf', 
      type: 'rabies_cert', 
      url: '#', 
      expiresOn: '2026-01-01', 
      shipmentId: 's1' 
    },
    { 
      id: 'd2', 
      name: 'Max_Health_Certificate.pdf', 
      type: 'health_cert', 
      url: '#', 
      expiresOn: '2025-12-15', 
      shipmentId: 's1' 
    },
    
    // Luna (Golden Retriever) - s2
    { 
      id: 'd3', 
      name: 'Luna_Rabies_Vaccination.pdf', 
      type: 'rabies_cert', 
      url: '#', 
      expiresOn: '2025-08-20', 
      shipmentId: 's2' 
    },
    { 
      id: 'd4', 
      name: 'Luna_Vet_Health_Check.pdf', 
      type: 'health_cert', 
      url: '#', 
      expiresOn: '2024-03-10', // Expires soon - should show orange warning
      shipmentId: 's2' 
    },
    
    // Buddy (French Bulldog) - s3
    { 
      id: 'd5', 
      name: 'Buddy_Rabies_Certificate.pdf', 
      type: 'rabies_cert', 
      url: '#', 
      expiresOn: '2025-11-30', 
      shipmentId: 's3' 
    },
    { 
      id: 'd6', 
      name: 'Buddy_Brachycephalic_Health_Cert.pdf', 
      type: 'health_cert', 
      url: '#', 
      expiresOn: '2024-02-28', // Expires very soon
      shipmentId: 's3' 
    },
    { 
      id: 'd7', 
      name: 'Buddy_Microchip_Registration.pdf', 
      type: 'other', 
      url: '#', 
      shipmentId: 's3' 
    },
    
    // Bella (French Bulldog) - s4
    { 
      id: 'd8', 
      name: 'Bella_Rabies_Certificate.pdf', 
      type: 'rabies_cert', 
      url: '#', 
      expiresOn: '2025-11-30', 
      shipmentId: 's4' 
    },
    { 
      id: 'd9', 
      name: 'Bella_Health_Certificate.pdf', 
      type: 'health_cert', 
      url: '#', 
      expiresOn: '2024-02-28', 
      shipmentId: 's4' 
    },
    
    // Charlie (Maine Coon Cat) - s5
    { 
      id: 'd10', 
      name: 'Charlie_Feline_Rabies_Cert.pdf', 
      type: 'rabies_cert', 
      url: '#', 
      expiresOn: '2025-09-15', 
      shipmentId: 's5' 
    },
    { 
      id: 'd11', 
      name: 'Charlie_Feline_Health_Certificate.pdf', 
      type: 'health_cert', 
      url: '#', 
      expiresOn: '2024-01-20', // Expired - should show red warning
      shipmentId: 's5' 
    },
    { 
      id: 'd12', 
      name: 'Charlie_Vaccination_Record.pdf', 
      type: 'other', 
      url: '#', 
      shipmentId: 's5' 
    },
    
    // Mochi (Shiba Inu) - s6
    { 
      id: 'd13', 
      name: 'Mochi_Rabies_Certificate.pdf', 
      type: 'rabies_cert', 
      url: '#', 
      expiresOn: '2026-03-01', 
      shipmentId: 's6' 
    },
    { 
      id: 'd14', 
      name: 'Mochi_Health_Certificate.pdf', 
      type: 'health_cert', 
      url: '#', 
      expiresOn: '2024-04-15', 
      shipmentId: 's6' 
    },
    { 
      id: 'd15', 
      name: 'Mochi_Import_Permit.pdf', 
      type: 'other', 
      url: '#', 
      expiresOn: '2024-05-01', 
      shipmentId: 's6' 
    },
  ] as Document[],
  quoteTemplates: [
    { 
      id: 'qt1', 
      title: 'Standard Door-to-Door', 
      body: 'Complete service including pickup from your location, airline booking, customs clearance, and delivery to final destination.', 
      defaultPriceCents: 85000 
    },
    { 
      id: 'qt2', 
      title: 'Airport-to-Airport', 
      body: 'We handle airline booking and cargo arrangements. You drop off and pick up at airports.', 
      defaultPriceCents: 55000 
    },
    { 
      id: 'qt3', 
      title: 'Express Service', 
      body: 'Priority handling with expedited processing and next available flight.', 
      defaultPriceCents: 125000 
    },
    { 
      id: 'qt4', 
      title: 'Multi-Pet Discount', 
      body: 'Special pricing for families shipping multiple pets together. Includes coordination and group handling.', 
      defaultPriceCents: 75000 
    },
    { 
      id: 'qt5', 
      title: 'Feline Specialist Service', 
      body: 'Specialized service for cats with extra care protocols and feline-experienced handlers.', 
      defaultPriceCents: 78000 
    },
    { 
      id: 'qt6', 
      title: 'Brachycephalic Breed Care', 
      body: 'Special handling for flat-faced breeds (bulldogs, pugs, etc.) with temperature monitoring and vet coordination.', 
      defaultPriceCents: 95000 
    },
    { 
      id: 'qt7', 
      title: 'Large Breed Service', 
      body: 'Specialized service for dogs over 70 lbs with appropriate crating and handling equipment.', 
      defaultPriceCents: 110000 
    },
  ] as QuoteTemplate[],
  products: [
    // IATA Crates
    { id: 'p1', name: 'IATA Crate Size 1 (Small)', sku: 'CRATE-S', priceCents: 8000, active: true },
    { id: 'p2', name: 'IATA Crate Size 2 (Medium)', sku: 'CRATE-M', priceCents: 12000, active: true },
    { id: 'p3', name: 'IATA Crate Size 3 (Large)', sku: 'CRATE-L', priceCents: 18000, active: true },
    { id: 'p4', name: 'IATA Crate Size 4 (X-Large)', sku: 'CRATE-XL', priceCents: 25000, active: true },
    { id: 'p5', name: 'IATA Crate Size 5 (Giant)', sku: 'CRATE-XXL', priceCents: 35000, active: true },
    
    // Services
    { id: 'p6', name: 'Health Certificate Review', sku: 'HEALTH-REV', priceCents: 5000, active: true },
    { id: 'p7', name: 'Veterinary Consultation', sku: 'VET-CONSULT', priceCents: 15000, active: true },
    { id: 'p8', name: 'Document Preparation Service', sku: 'DOC-PREP', priceCents: 7500, active: true },
    { id: 'p9', name: 'Microchip Scanning', sku: 'MICROCHIP-SCAN', priceCents: 2500, active: true },
    { id: 'p10', name: 'Pet Insurance (Optional)', sku: 'PET-INSURANCE', priceCents: 12000, active: true },
    
    // Add-ons
    { id: 'p11', name: 'Climate-Controlled Transport', sku: 'CLIMATE-CTRL', priceCents: 8500, active: true },
    { id: 'p12', name: 'GPS Tracking Service', sku: 'GPS-TRACK', priceCents: 4000, active: true },
    { id: 'p13', name: 'Photo Updates During Transit', sku: 'PHOTO-UPDATE', priceCents: 3000, active: true },
    { id: 'p14', name: 'Expedited Customs Clearance', sku: 'FAST-CUSTOMS', priceCents: 15000, active: true },
    
    // Discontinued items
    { id: 'p15', name: 'Legacy Wooden Crate', sku: 'WOOD-CRATE', priceCents: 20000, active: false },
  ] as Product[],
  paymentRequests: [
    // Max (Beagle) - Deposit paid, balance due
    {
      id: 'pr1',
      conversationId: 'c1',
      amountCents: 25000, // $250 deposit
      status: 'paid',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      id: 'pr2',
      conversationId: 'c1',
      amountCents: 60000, // $600 balance
      status: 'quote_requested',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    
    // Luna (Golden Retriever) - Initial quote accepted
    {
      id: 'pr3',
      conversationId: 'c2',
      amountCents: 47500, // $475 (50% deposit)
      status: 'quote_requested',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    
    // Buddy & Bella (French Bulldogs) - Express service
    {
      id: 'pr4',
      conversationId: 'c3',
      amountCents: 110000, // $1100 (50% deposit for 2 pets)
      status: 'quote_requested',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    
    // Charlie (Maine Coon Cat) - Deposit paid
    {
      id: 'pr5',
      conversationId: 'c5',
      amountCents: 39000, // $390 (50% deposit)
      status: 'paid',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    },
    
    // Mochi (Shiba Inu) - Payment requested
    {
      id: 'pr6',
      conversationId: 'c6',
      amountCents: 62500, // $625 (50% deposit)
      status: 'quote_requested',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString()
    },
    
    // Historical completed payments
    {
      id: 'pr7',
      conversationId: 'c_old1',
      amountCents: 85000, // $850 - Rocco (completed)
      status: 'paid',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    },
    {
      id: 'pr8',
      conversationId: 'c_old2',
      amountCents: 75000, // $750 - Princess (completed)
      status: 'paid',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
    },
  ] as PaymentRequest[],
};