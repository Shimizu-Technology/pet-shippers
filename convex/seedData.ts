import { mutation } from "./_generated/server";

// Seed initial data for testing
export const seedUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if users already exist
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return "Users already exist";
    }

    // Create test users
    const users = [
      // Demo users for easy login
      {
        name: "Admin User",
        email: "admin@example.com",
        role: "admin" as const,
        orgId: "org_petshippers",
      },
      {
        name: "Staff User",
        email: "staff@example.com", 
        role: "staff" as const,
        orgId: "org_petshippers",
      },
      {
        name: "Client User",
        email: "client@example.com",
        role: "client" as const,
      },
      // Original users
      {
        name: "Ada Admin",
        email: "ada@petshippers.com",
        role: "admin" as const,
        orgId: "org_petshippers",
      },
      {
        name: "Ken Staff",
        email: "ken@petshippers.com", 
        role: "staff" as const,
        orgId: "org_petshippers",
      },
      {
        name: "Sarah Johnson",
        email: "sarah@example.com",
        role: "client" as const,
      },
      {
        name: "Hawaii Pet Express",
        email: "contact@hawaiipetexpress.com",
        role: "partner" as const,
        orgId: "org_hawaii_pets",
      },
    ];

    const userIds = [];
    for (const user of users) {
      const userId = await ctx.db.insert("users", user);
      userIds.push(userId);
    }

    return `Created ${userIds.length} users`;
  },
});

// Seed complete test data including conversations, messages, and shipments
// Clear all data (useful for testing)
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all data in order (to avoid foreign key issues)
    const messages = await ctx.db.query("messages").collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    const paymentRequests = await ctx.db.query("paymentRequests").collect();
    for (const paymentRequest of paymentRequests) {
      await ctx.db.delete(paymentRequest._id);
    }
    
    // Delete documents (and their associated files)
    const documents = await ctx.db.query("documents").collect();
    for (const document of documents) {
      // Delete the file from storage first
      await ctx.storage.delete(document.fileId);
      // Then delete the document record
      await ctx.db.delete(document._id);
    }
    
    const conversations = await ctx.db.query("conversations").collect();
    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id);
    }
    
    const shipments = await ctx.db.query("shipments").collect();
    for (const shipment of shipments) {
      await ctx.db.delete(shipment._id);
    }
    
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      await ctx.db.delete(product._id);
    }
    
    const quoteTemplates = await ctx.db.query("quoteTemplates").collect();
    for (const template of quoteTemplates) {
      await ctx.db.delete(template._id);
    }
    
    const documentTemplates = await ctx.db.query("documentTemplates").collect();
    for (const template of documentTemplates) {
      await ctx.db.delete(template._id);
    }
    
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    
    return "All data cleared successfully (users, conversations, messages, shipments, documents, products, quote templates, document templates, payment requests)";
  },
});

export const seedAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if users already exist
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return "Users already exist - use clearAllData first if you want to reseed";
    }

    // Create comprehensive test users
    const userIds = {
      // Admin users
      admin1: await ctx.db.insert("users", {
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        orgId: "org_petshippers",
      }),
      admin2: await ctx.db.insert("users", {
        name: "Ada Admin",
        email: "ada@petshippers.com",
        role: "admin",
        orgId: "org_petshippers",
      }),
      
      // Staff users
      staff1: await ctx.db.insert("users", {
        name: "Staff User", 
        email: "staff@example.com",
        role: "staff",
        orgId: "org_petshippers",
      }),
      staff2: await ctx.db.insert("users", {
        name: "Ken Staff", 
        email: "ken@petshippers.com",
        role: "staff",
        orgId: "org_petshippers",
      }),
      staff3: await ctx.db.insert("users", {
        name: "Maria Rodriguez",
        email: "maria@petshippers.com",
        role: "staff",
        orgId: "org_petshippers",
      }),
      
      // Client users
      client1: await ctx.db.insert("users", {
        name: "Client User",
        email: "client@example.com", 
        role: "client",
      }),
      client2: await ctx.db.insert("users", {
        name: "Sarah Johnson",
        email: "sarah@example.com", 
        role: "client",
      }),
      client3: await ctx.db.insert("users", {
        name: "Michael Chen",
        email: "michael.chen@gmail.com",
        role: "client",
      }),
      client4: await ctx.db.insert("users", {
        name: "Emily Davis",
        email: "emily.davis@yahoo.com",
        role: "client",
      }),
      
      // Partner
      partner: await ctx.db.insert("users", {
        name: "Hawaii Pet Express",
        email: "contact@hawaiipetexpress.com",
        role: "partner",
        orgId: "org_hawaii_pets",
      }),
    };

    // Create basic products for testing
    await ctx.db.insert("products", {
      name: "Large IATA Crate (36x25x27)",
      sku: "CRATE-L-001",
      priceCents: 25000, // $250
      active: true,
    });

    await ctx.db.insert("products", {
      name: "Pet Health Certificate Processing",
      sku: "HEALTH-CERT-001", 
      priceCents: 15000, // $150
      active: true,
    });

    // Create quote templates for staff to use
    await ctx.db.insert("quoteTemplates", {
      title: "Standard Pet Shipping - Domestic",
      body: "This quote includes: IATA-approved crate, health certificate processing, door-to-door pickup and delivery, flight booking, and 24/7 tracking. All pets travel in climate-controlled cargo areas with experienced handlers.",
      defaultPriceCents: 125000, // $1,250
    });

    await ctx.db.insert("quoteTemplates", {
      title: "Premium Pet Shipping - International", 
      body: "Our premium service includes: Custom IATA crate, expedited health certificates, VIP handling, direct flights when possible, real-time GPS tracking, and dedicated customer support. Perfect for international relocations.",
      defaultPriceCents: 285000, // $2,850
    });

    await ctx.db.insert("quoteTemplates", {
      title: "Express Pet Shipping - Same Day",
      body: "Emergency same-day service includes: Immediate pickup, priority flight booking, expedited processing, and real-time updates. Available for urgent relocations and emergency situations.",
      defaultPriceCents: 450000, // $4,500
    });

    // Create document templates for different shipping scenarios
    await ctx.db.insert("documentTemplates", {
      title: "Domestic Pet Shipping Requirements",
      description: "Standard documents required for domestic pet shipping within the US",
      category: "domestic",
      requirements: [
        {
          name: "Health Certificate",
          description: "USDA-endorsed health certificate issued within 10 days of travel",
          required: true,
          category: "health_certificate",
          notes: "Must be signed by a USDA-accredited veterinarian"
        },
        {
          name: "Current Vaccination Records",
          description: "Up-to-date vaccination records including Rabies, DHPP, and Bordetella",
          required: true,
          category: "vaccination_record",
          notes: "Rabies vaccination must be at least 21 days old"
        },
        {
          name: "Pet Photos",
          description: "Recent clear photos of your pet for identification purposes",
          required: true,
          category: "photo",
          notes: "Include front view and side profile photos"
        }
      ],
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("documentTemplates", {
      title: "International Pet Shipping Requirements",
      description: "Comprehensive documents required for international pet relocation",
      category: "international",
      requirements: [
        {
          name: "Health Certificate",
          description: "USDA-endorsed international health certificate issued within 10 days of travel",
          required: true,
          category: "health_certificate",
          notes: "Must include USDA endorsement for international travel"
        },
        {
          name: "Vaccination Records",
          description: "Complete vaccination history including Rabies, DHPP, Bordetella, and destination-specific requirements",
          required: true,
          category: "vaccination_record",
          notes: "Some destinations require additional vaccinations"
        },
        {
          name: "Import Permit",
          description: "Official import permit from destination country",
          required: true,
          category: "import_permit",
          notes: "Must be obtained before travel - processing time varies by country"
        },
        {
          name: "Export Permit",
          description: "USDA export permit for international pet transport",
          required: true,
          category: "export_permit",
          notes: "Required for most international destinations"
        },
        {
          name: "Pet Identification Photos",
          description: "High-quality identification photos of your pet",
          required: true,
          category: "photo",
          notes: "Include multiple angles and any distinctive markings"
        }
      ],
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("documentTemplates", {
      title: "Special Needs Pet Requirements",
      description: "Additional documentation for pets with special medical needs",
      category: "special_needs",
      requirements: [
        {
          name: "Veterinary Medical Records",
          description: "Complete medical history and current treatment plans",
          required: true,
          category: "health_certificate",
          notes: "Include any ongoing medications or treatments"
        },
        {
          name: "Medication Documentation",
          description: "Detailed list of all medications with veterinary authorization",
          required: true,
          category: "other",
          notes: "Include dosage instructions and emergency contact information"
        },
        {
          name: "Special Care Instructions",
          description: "Detailed care instructions for handling during transport",
          required: true,
          category: "other",
          notes: "Include emergency veterinary contact information"
        }
      ],
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return `Seeded clean test data: 10 users (2 admins, 3 staff, 4 clients, 1 partner), 2 products, 3 quote templates, and 3 document templates - ready for fresh testing!`;
  },
});

// Backfill shipment records for existing quote requests that don't have them
export const backfillMissingShipments = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all conversations
    const conversations = await ctx.db.query("conversations").collect();
    
    // Get all existing shipments to check which conversations already have them
    const existingShipments = await ctx.db.query("shipments").collect();
    const conversationsWithShipments = new Set(existingShipments.map(s => s.conversationId));
    
    let shipmentsCreated = 0;
    
    for (const conversation of conversations) {
      // Skip if this conversation already has a shipment
      if (conversationsWithShipments.has(conversation._id)) {
        continue;
      }
      
      // Look for quote request messages in this conversation
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
        .collect();
      
      // Find the first quote request message with payload data
      const quoteRequestMessage = messages.find(msg => 
        msg.kind === "status" && 
        msg.payload && 
        msg.payload.type === "quote_requested"
      );
      
      if (quoteRequestMessage && quoteRequestMessage.payload) {
        const payload = quoteRequestMessage.payload;
        
        // Get customer info from the conversation participants
        const customerUserId = conversation.participantIds.find(id => id !== "system");
        let customerName = "Customer";
        let customerEmail = undefined;
        
        if (customerUserId) {
          const customer = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), customerUserId))
            .first();
          
          if (customer) {
            customerName = customer.name;
            customerEmail = customer.email;
          }
        }
        
        // Create shipment record from the quote request data
        await ctx.db.insert("shipments", {
          conversationId: conversation._id,
          petName: payload.petName || "Pet",
          petType: payload.petType || "other",
          petBreed: payload.petBreed || "",
          petWeight: payload.petWeight || 0,
          ownerName: customerName,
          ownerEmail: customerEmail,
          route: payload.route || { from: "Unknown", to: "Unknown" },
          status: "quote_requested",
          specialInstructions: payload.specialRequirements || "",
          createdAt: conversation.lastMessageAt || Date.now(),
          updatedAt: conversation.lastMessageAt || Date.now(),
        });
        
        shipmentsCreated++;
      }
    }
    
    return `Backfill completed: ${shipmentsCreated} shipment records created`;
  },
});
