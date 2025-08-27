import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all documents
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").order("desc").collect();
  },
});

// File upload mutation - generates upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Create document record after successful upload
export const createDocument = mutation({
  args: {
    name: v.string(),
    fileId: v.id("_storage"),
    contentType: v.string(),
    size: v.number(),
    uploadedBy: v.string(),
    conversationId: v.optional(v.id("conversations")),
    shipmentId: v.optional(v.id("shipments")),
    category: v.union(
      v.literal("health_certificate"),
      v.literal("vaccination_record"),
      v.literal("import_permit"),
      v.literal("export_permit"),
      v.literal("photo"),
      v.literal("other")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const documentId = await ctx.db.insert("documents", {
      ...args,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    
    // Create a message in the conversation about the document upload
    if (args.conversationId) {
      await ctx.db.insert("messages", {
        conversationId: args.conversationId,
        senderId: args.uploadedBy,
        kind: "status",
        payload: {
          type: "document_uploaded",
          documentId,
          documentName: args.name,
          documentCategory: args.category,
          documentSize: args.size,
          notes: args.notes,
        },
        createdAt: now,
      });

      // Update conversation lastMessageAt
      await ctx.db.patch(args.conversationId, {
        lastMessageAt: now,
      });
    }
    
    return documentId;
  },
});

// Get documents by conversation
export const getByConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .collect();
  },
});

// Get documents by shipment
export const getByShipment = query({
  args: { shipmentId: v.id("shipments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_shipment", (q) => q.eq("shipmentId", args.shipmentId))
      .order("desc")
      .collect();
  },
});

// Get all documents for admin/staff
export const listAll = query({
  args: {
    userRole: v.union(v.literal("admin"), v.literal("staff"), v.literal("client"), v.literal("partner"))
  },
  handler: async (ctx, args) => {
    // Only admin and staff can see all documents
    if (args.userRole !== "admin" && args.userRole !== "staff") {
      throw new Error("Unauthorized");
    }
    
    return await ctx.db
      .query("documents")
      .order("desc")
      .collect();
  },
});

// Get documents uploaded by a specific user
export const getByUploader = query({
  args: { 
    uploadedBy: v.string(),
    userRole: v.union(v.literal("admin"), v.literal("staff"), v.literal("client"), v.literal("partner"))
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_uploader", (q) => q.eq("uploadedBy", args.uploadedBy))
      .order("desc")
      .collect();
  },
});

// Update document status (for approval/rejection)
export const updateStatus = mutation({
  args: {
    id: v.id("documents"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
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

// Delete document
export const deleteDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }
    
    // Delete the file from storage
    await ctx.storage.delete(document.fileId);
    
    // Delete the document record
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Get file URL for viewing/downloading
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

// Get document by ID
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});