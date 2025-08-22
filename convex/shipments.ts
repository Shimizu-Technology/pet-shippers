import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get shipments filtered by user role and participation
export const list = query({
  args: { 
    userId: v.string(),
    userRole: v.union(v.literal("admin"), v.literal("staff"), v.literal("client"), v.literal("partner"))
  },
  handler: async (ctx, args) => {
    const shipments = await ctx.db.query("shipments").collect();
    
    // Admin and staff can see all shipments
    if (args.userRole === "admin" || args.userRole === "staff") {
      return shipments;
    }
    
    // For clients and partners, we need to check if they're part of the conversation
    const conversations = await ctx.db.query("conversations").collect();
    const userConversations = conversations.filter(conv => 
      conv.participantIds.includes(args.userId)
    );
    const userConversationIds = userConversations.map(conv => conv._id);
    
    return shipments.filter(shipment => 
      userConversationIds.includes(shipment.conversationId)
    );
  },
});

// Get shipment by ID
export const get = query({
  args: { id: v.id("shipments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new shipment
export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    petName: v.string(),
    petType: v.union(v.literal("dog"), v.literal("cat"), v.literal("other")),
    petBreed: v.optional(v.string()),
    petWeight: v.optional(v.number()),
    ownerName: v.string(),
    ownerEmail: v.optional(v.string()),
    ownerPhone: v.optional(v.string()),
    route: v.object({ from: v.string(), to: v.string() }),
    status: v.string(),
    estimatedDeparture: v.optional(v.string()),
    estimatedArrival: v.optional(v.string()),
    flightNumber: v.optional(v.string()),
    crateSize: v.optional(v.string()),
    specialInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const shipmentId = await ctx.db.insert("shipments", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return shipmentId;
  },
});

// Update shipment status
export const updateStatus = mutation({
  args: {
    id: v.id("shipments"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Update shipment details
export const update = mutation({
  args: {
    id: v.id("shipments"),
    petName: v.optional(v.string()),
    petBreed: v.optional(v.string()),
    petWeight: v.optional(v.number()),
    ownerName: v.optional(v.string()),
    ownerEmail: v.optional(v.string()),
    ownerPhone: v.optional(v.string()),
    estimatedDeparture: v.optional(v.string()),
    estimatedArrival: v.optional(v.string()),
    actualDeparture: v.optional(v.string()),
    actualArrival: v.optional(v.string()),
    flightNumber: v.optional(v.string()),
    crateSize: v.optional(v.string()),
    specialInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});
