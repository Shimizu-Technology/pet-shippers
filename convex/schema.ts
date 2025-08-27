import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff"), v.literal("client"), v.literal("partner")),
    orgId: v.optional(v.string()),
  }).index("by_email", ["email"]),

  conversations: defineTable({
    title: v.string(),
    participantIds: v.array(v.string()),
    kind: v.union(v.literal("client"), v.literal("partner"), v.literal("internal")),
    lastMessageAt: v.number(),
  }).index("by_participants", ["participantIds"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.optional(v.string()),
    kind: v.union(v.literal("text"), v.literal("quote"), v.literal("product"), v.literal("status")),
    payload: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  shipments: defineTable({
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
    actualDeparture: v.optional(v.string()),
    actualArrival: v.optional(v.string()),
    flightNumber: v.optional(v.string()),
    crateSize: v.optional(v.string()),
    specialInstructions: v.optional(v.string()),
    
    // Payment Information
    totalAmountCents: v.optional(v.number()),
    paidAmountCents: v.optional(v.number()),
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("partial"), 
      v.literal("paid"),
      v.literal("refunded")
    )),
    paymentDueDate: v.optional(v.number()),
    
    // Line Items for detailed billing
    lineItems: v.optional(v.array(v.object({
      description: v.string(),
      amountCents: v.number(),
      category: v.union(
        v.literal("shipping"),
        v.literal("crate"),
        v.literal("documentation"),
        v.literal("insurance"),
        v.literal("other")
      )
    }))),
    
    // Payment History
    paymentHistory: v.optional(v.array(v.object({
      amountCents: v.number(),
      type: v.union(v.literal("payment"), v.literal("refund")),
      method: v.optional(v.string()), // "stripe", "paypal", "manual", etc.
      transactionId: v.optional(v.string()),
      processedBy: v.optional(v.string()), // userId who processed it
      processedAt: v.number(),
      notes: v.optional(v.string())
    }))),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_conversation", ["conversationId"])
    .index("by_payment_status", ["paymentStatus"]),

  products: defineTable({
    name: v.string(),
    sku: v.string(),
    priceCents: v.number(),
    active: v.boolean(),
  }).index("by_active", ["active"]),

  quoteTemplates: defineTable({
    title: v.string(),
    body: v.string(),
    defaultPriceCents: v.number(),
  }),

  documentTemplates: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("domestic"),
      v.literal("international"), 
      v.literal("special_needs"),
      v.literal("general")
    ),
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
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["active"]).index("by_category", ["category"]),

  paymentRequests: defineTable({
    conversationId: v.id("conversations"),
    amountCents: v.number(),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("cancelled")),
    description: v.optional(v.string()),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
  }).index("by_conversation", ["conversationId"]),

  quoteRequests: defineTable({
    petName: v.string(),
    petType: v.union(v.literal("dog"), v.literal("cat"), v.literal("other")),
    petBreed: v.string(),
    petWeight: v.number(),
    route: v.object({ from: v.string(), to: v.string() }),
    preferredTravelDate: v.string(),
    specialRequirements: v.string(),
    customerUserId: v.string(),
    status: v.union(v.literal("pending"), v.literal("quoted"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_customer", ["customerUserId"]),

  documents: defineTable({
    name: v.string(),
    fileId: v.id("_storage"),
    contentType: v.string(),
    size: v.number(),
    uploadedBy: v.string(), // user ID
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
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_conversation", ["conversationId"])
  .index("by_shipment", ["shipmentId"])
  .index("by_uploader", ["uploadedBy"]),
});
