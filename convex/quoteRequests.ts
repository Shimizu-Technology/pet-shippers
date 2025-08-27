import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new quote request from a customer
export const create = mutation({
  args: {
    petName: v.string(),
    petType: v.union(v.literal("dog"), v.literal("cat"), v.literal("other")),
    petBreed: v.string(),
    petWeight: v.number(),
    route: v.object({
      from: v.string(),
      to: v.string(),
    }),
    preferredTravelDate: v.string(),
    specialRequirements: v.string(),
    customerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get customer user data for shipment record
    const customer = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.customerUserId))
      .first();
    
    const customerName = customer?.name || "Customer";
    const customerEmail = customer?.email;

    // Create the quote request
    const quoteRequestId = await ctx.db.insert("quoteRequests", {
      petName: args.petName,
      petType: args.petType,
      petBreed: args.petBreed,
      petWeight: args.petWeight,
      route: args.route,
      preferredTravelDate: args.preferredTravelDate,
      specialRequirements: args.specialRequirements,
      customerUserId: args.customerUserId,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create a conversation for this quote request
    const conversationId = await ctx.db.insert("conversations", {
      title: `Quote Request: ${args.petName} (${args.route.from} → ${args.route.to})`,
      participantIds: [args.customerUserId], // Staff will be added when they respond
      kind: "client",
      lastMessageAt: Date.now(),
    });

    // Create a shipment record for this quote request
    const shipmentId = await ctx.db.insert("shipments", {
      conversationId,
      petName: args.petName,
      petType: args.petType,
      petBreed: args.petBreed,
      petWeight: args.petWeight,
      ownerName: customerName,
      ownerEmail: customerEmail,
      route: args.route,
      status: "quote_requested",
      specialInstructions: args.specialRequirements,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create an initial message in the conversation with full quote details
    await ctx.db.insert("messages", {
      conversationId,
      senderId: args.customerUserId,
      text: `New quote request submitted for ${args.petName}`,
      kind: "status",
      payload: {
        type: "quote_requested",
        quoteRequestId,
        shipmentId,
        petName: args.petName,
        petType: args.petType,
        petBreed: args.petBreed,
        petWeight: args.petWeight,
        route: args.route,
        preferredTravelDate: args.preferredTravelDate,
        specialRequirements: args.specialRequirements,
      },
      createdAt: Date.now(),
    });

    return { quoteRequestId, conversationId, shipmentId };
  },
});

// List quote requests (for admin/staff)
export const list = query({
  args: {
    userId: v.string(),
    userRole: v.union(v.literal("admin"), v.literal("staff"), v.literal("client"), v.literal("partner")),
  },
  handler: async (ctx, args) => {
    if (args.userRole === "client") {
      // Clients can only see their own quote requests
      return await ctx.db
        .query("quoteRequests")
        .filter((q) => q.eq(q.field("customerUserId"), args.userId))
        .order("desc")
        .collect();
    } else {
      // Admin/staff can see all quote requests
      return await ctx.db
        .query("quoteRequests")
        .order("desc")
        .collect();
    }
  },
});

// Update quote request status
export const updateStatus = mutation({
  args: {
    quoteRequestId: v.id("quoteRequests"),
    status: v.union(v.literal("pending"), v.literal("quoted"), v.literal("accepted"), v.literal("declined")),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.quoteRequestId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.quoteRequestId;
  },
});
