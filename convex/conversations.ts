import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get conversations filtered by user role and participation
export const list = query({
  args: { 
    userId: v.string(),
    userRole: v.union(v.literal("admin"), v.literal("staff"), v.literal("client"), v.literal("partner"))
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db.query("conversations").collect();
    
    // Admin and staff can see all conversations
    if (args.userRole === "admin" || args.userRole === "staff") {
      return conversations;
    }
    
    // Clients and partners can only see conversations they're part of
    return conversations.filter(conv => 
      conv.participantIds.includes(args.userId)
    );
  },
});

// Get conversation by ID
export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    title: v.string(),
    participantIds: v.array(v.string()),
    kind: v.union(v.literal("client"), v.literal("partner"), v.literal("internal")),
  },
  handler: async (ctx, args) => {
    const conversationId = await ctx.db.insert("conversations", {
      title: args.title,
      participantIds: args.participantIds,
      kind: args.kind,
      lastMessageAt: Date.now(),
    });
    return conversationId;
  },
});

// Update conversation
export const update = mutation({
  args: {
    id: v.id("conversations"),
    title: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});
