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
    
    return "All data cleared successfully";
  },
});

export const seedAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingConversations = await ctx.db.query("conversations").collect();
    if (existingConversations.length > 0) {
      return "Data already exists - use clearAllData first if you want to reseed";
    }

    // Create users first
    const userIds = {
      admin: await ctx.db.insert("users", {
        name: "Ada Admin",
        email: "ada@petshippers.com",
        role: "admin",
        orgId: "org_petshippers",
      }),
      staff: await ctx.db.insert("users", {
        name: "Ken Staff", 
        email: "ken@petshippers.com",
        role: "staff",
        orgId: "org_petshippers",
      }),
      client: await ctx.db.insert("users", {
        name: "Sarah Johnson",
        email: "sarah@example.com", 
        role: "client",
      }),
      partner: await ctx.db.insert("users", {
        name: "Hawaii Pet Express",
        email: "contact@hawaiipetexpress.com",
        role: "partner",
        orgId: "org_hawaii_pets",
      }),
    };

    // Create a test conversation
    const conversationId = await ctx.db.insert("conversations", {
      title: "Bella's Journey to Hawaii",
      participantIds: ["u_client", "u_staff"], // Using string IDs to match existing system
      kind: "client",
      lastMessageAt: Date.now(),
    });

    // Create test messages
    await ctx.db.insert("messages", {
      conversationId,
      senderId: "u_client",
      text: "Hi! I need help shipping my dog Bella to Hawaii. Can you help me with a quote?",
      kind: "text",
      createdAt: Date.now() - 3600000, // 1 hour ago
    });

    await ctx.db.insert("messages", {
      conversationId,
      senderId: "u_staff", 
      text: "Of course! I'd be happy to help you with Bella's journey. Let me get some details and prepare a quote for you.",
      kind: "text",
      createdAt: Date.now() - 3500000, // 55 minutes ago
    });

    // Create a test shipment
    const shipmentId = await ctx.db.insert("shipments", {
      conversationId,
      petName: "Bella",
      petType: "dog",
      petBreed: "Golden Retriever",
      petWeight: 65,
      ownerName: "Sarah Johnson",
      ownerEmail: "sarah@example.com",
      ownerPhone: "(555) 123-4567",
      route: { from: "Guam", to: "Honolulu, HI" },
      status: "quote_requested",
      estimatedDeparture: "2024-09-15",
      estimatedArrival: "2024-09-15",
      flightNumber: "UA154",
      crateSize: "Large (36x25x27)",
      specialInstructions: "Bella is very friendly but gets anxious during travel. Please handle with extra care.",
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    });

    // Create test products
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

    return `Seeded complete test data: users, conversation, messages, shipment, and products`;
  },
});
