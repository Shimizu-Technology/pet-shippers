import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all documents
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").collect();
  },
});

// Get documents by shipment
export const getByShipment = query({
  args: { shipmentId: v.id("shipments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_shipment", (q) => q.eq("shipmentId", args.shipmentId))
      .collect();
  },
});

// Create a new document
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("rabies_cert"), v.literal("health_cert"), v.literal("other")),
    url: v.string(),
    expiresOn: v.optional(v.string()),
    shipmentId: v.optional(v.id("shipments")),
    conversationId: v.optional(v.id("conversations")),
    uploadedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const documentId = await ctx.db.insert("documents", {
      ...args,
      createdAt: Date.now(),
    });
    return documentId;
  },
});

// Attach document to shipment
export const attachToShipment = mutation({
  args: {
    id: v.id("documents"),
    shipmentId: v.id("shipments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      shipmentId: args.shipmentId,
    });
    return args.id;
  },
});

// Delete document
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
