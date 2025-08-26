import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all payment requests
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("paymentRequests").collect();
  },
});

// Get payment requests by conversation
export const getByConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentRequests")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

// Create a new payment request
export const createRequest = mutation({
  args: {
    conversationId: v.id("conversations"),
    amountCents: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("paymentRequests", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    return paymentId;
  },
});

// Mark payment as paid
export const markPaid = mutation({
  args: { id: v.id("paymentRequests") },
  handler: async (ctx, args) => {
    // Get the payment request to find the conversation
    const paymentRequest = await ctx.db.get(args.id);
    if (!paymentRequest) {
      throw new Error("Payment request not found");
    }

    // Mark payment as paid
    await ctx.db.patch(args.id, {
      status: "paid",
      paidAt: Date.now(),
    });

    // Send a status message about payment completion
    await ctx.db.insert("messages", {
      conversationId: paymentRequest.conversationId,
      senderId: "system",
      text: `Payment completed: $${(paymentRequest.amountCents / 100).toFixed(2)}`,
      kind: "status",
      payload: {
        type: "payment_completed",
        amountCents: paymentRequest.amountCents,
        paymentId: args.id,
      },
      createdAt: Date.now(),
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(paymentRequest.conversationId, {
      lastMessageAt: Date.now(),
    });

    // Update shipment status to documents_pending
    const shipments = await ctx.db
      .query("shipments")
      .withIndex("by_conversation", (q) => q.eq("conversationId", paymentRequest.conversationId))
      .collect();
    
    if (shipments.length > 0) {
      await ctx.db.patch(shipments[0]._id, {
        status: "documents_pending",
        updatedAt: Date.now(),
      });
    }

    return args.id;
  },
});

// Cancel payment request
export const cancel = mutation({
  args: { id: v.id("paymentRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "cancelled",
    });
    return args.id;
  },
});
