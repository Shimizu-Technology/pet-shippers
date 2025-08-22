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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  documents: defineTable({
    name: v.string(),
    type: v.union(v.literal("rabies_cert"), v.literal("health_cert"), v.literal("other")),
    url: v.string(),
    expiresOn: v.optional(v.string()),
    shipmentId: v.optional(v.id("shipments")),
    conversationId: v.optional(v.id("conversations")),
    uploadedBy: v.string(),
    createdAt: v.number(),
  }).index("by_shipment", ["shipmentId"]),

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
});
