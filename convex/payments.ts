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
    await ctx.db.patch(args.id, {
      status: "paid",
      paidAt: Date.now(),
    });
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
