import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all active document templates
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("documentTemplates")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .collect();
  },
});

// List document templates by category
export const listByCategory = query({
  args: { category: v.union(v.literal("domestic"), v.literal("international"), v.literal("special_needs"), v.literal("general")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documentTemplates")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("active"), true))
      .order("desc")
      .collect();
  },
});

// Get a specific document template
export const get = query({
  args: { id: v.id("documentTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new document template
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(v.literal("domestic"), v.literal("international"), v.literal("special_needs"), v.literal("general")),
    requirements: v.array(v.object({
      name: v.string(),
      description: v.string(),
      required: v.boolean(),
      category: v.union(
        v.literal("health_certificate"),
        v.literal("vaccination_record"),
        v.literal("import_permit"),
        v.literal("export_permit"),
        v.literal("photo"),
        v.literal("other")
      ),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("documentTemplates", {
      ...args,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a document template
export const update = mutation({
  args: {
    id: v.id("documentTemplates"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(v.literal("domestic"), v.literal("international"), v.literal("special_needs"), v.literal("general"))),
    requirements: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      required: v.boolean(),
      category: v.union(
        v.literal("health_certificate"),
        v.literal("vaccination_record"),
        v.literal("import_permit"),
        v.literal("export_permit"),
        v.literal("photo"),
        v.literal("other")
      ),
      notes: v.optional(v.string()),
    }))),
    active: v.optional(v.boolean()),
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

// Delete (deactivate) a document template
export const remove = mutation({
  args: { id: v.id("documentTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      active: false,
      updatedAt: Date.now(),
    });
    
    return args.id;
  },
});

// Get default document requirements for different shipping types
export const getDefaultRequirements = query({
  args: { 
    shippingType: v.union(v.literal("domestic"), v.literal("international")),
    petType: v.optional(v.union(v.literal("dog"), v.literal("cat"), v.literal("other")))
  },
  handler: async (ctx, args) => {
    // Get the most appropriate template based on shipping type
    const templates = await ctx.db
      .query("documentTemplates")
      .withIndex("by_category", (q) => q.eq("category", args.shippingType))
      .filter((q) => q.eq(q.field("active"), true))
      .order("desc")
      .take(1);
    
    if (templates.length > 0) {
      return templates[0];
    }
    
    // Fallback to general template
    const generalTemplates = await ctx.db
      .query("documentTemplates")
      .withIndex("by_category", (q) => q.eq("category", "general"))
      .filter((q) => q.eq(q.field("active"), true))
      .order("desc")
      .take(1);
    
    return generalTemplates.length > 0 ? generalTemplates[0] : null;
  },
});
