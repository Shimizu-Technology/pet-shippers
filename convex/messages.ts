import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper function to update shipment status based on conversation events
const updateShipmentStatus = async (ctx: any, conversationId: string, newStatus: string) => {
  // Find the shipment for this conversation
  const shipments = await ctx.db
    .query("shipments")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
    .collect();
  
  if (shipments.length > 0) {
    const shipment = shipments[0]; // There should only be one shipment per conversation
    await ctx.db.patch(shipment._id, {
      status: newStatus,
      updatedAt: Date.now(),
    });
  }
};

// Get messages by conversation
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

// Send a text message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text,
      kind: "text",
      createdAt: Date.now(),
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

// Send a quote message
export const sendQuote = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      kind: "quote",
      payload: args.payload,
      createdAt: Date.now(),
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    // Update shipment status to "quote_sent"
    await updateShipmentStatus(ctx, args.conversationId, "quote_sent");

    return messageId;
  },
});

// Send a product recommendation
export const sendProduct = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      kind: "product",
      payload: args.payload,
      createdAt: Date.now(),
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

// Send a status message
export const sendStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    payload: v.any(),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text,
      kind: "status",
      payload: args.payload,
      createdAt: Date.now(),
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    // Update shipment status based on the status message type
    const payloadType = args.payload?.type;
    if (payloadType === "quote_accepted") {
      await updateShipmentStatus(ctx, args.conversationId, "booking_confirmed");
    } else if (payloadType === "payment_completed") {
      await updateShipmentStatus(ctx, args.conversationId, "documents_pending");
    } else if (payloadType === "documents_requested") {
      // Status stays "documents_pending" - just a notification
    } else if (payloadType === "quote_declined") {
      await updateShipmentStatus(ctx, args.conversationId, "cancelled");
    }

    return messageId;
  },
});
