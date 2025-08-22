import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all quote templates
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("quoteTemplates").collect();
  },
});

// Get quote template by ID
export const get = query({
  args: { id: v.id("quoteTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new quote template
export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    defaultPriceCents: v.number(),
  },
  handler: async (ctx, args) => {
    const templateId = await ctx.db.insert("quoteTemplates", args);
    return templateId;
  },
});

// Update quote template
export const update = mutation({
  args: {
    id: v.id("quoteTemplates"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    defaultPriceCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete quote template
export const remove = mutation({
  args: { id: v.id("quoteTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
