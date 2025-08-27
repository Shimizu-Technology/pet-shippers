import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Update shipment payment information
export const updatePaymentInfo = mutation({
  args: {
    shipmentId: v.id("shipments"),
    totalAmountCents: v.optional(v.number()),
    paymentDueDate: v.optional(v.number()),
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
  },
  handler: async (ctx, args) => {
    const { shipmentId, ...updateData } = args;
    
    // Calculate total from line items if provided
    let totalAmountCents = updateData.totalAmountCents;
    if (updateData.lineItems && updateData.lineItems.length > 0) {
      totalAmountCents = updateData.lineItems.reduce((sum, item) => sum + item.amountCents, 0);
    }
    
    await ctx.db.patch(shipmentId, {
      ...updateData,
      totalAmountCents,
      paymentStatus: totalAmountCents ? "pending" : undefined,
      updatedAt: Date.now(),
    });
    
    return shipmentId;
  },
});

// Process a payment for a shipment
export const processPayment = mutation({
  args: {
    shipmentId: v.id("shipments"),
    amountCents: v.number(),
    method: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    processedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shipment = await ctx.db.get(args.shipmentId);
    if (!shipment) {
      throw new Error("Shipment not found");
    }
    
    const now = Date.now();
    const newPaidAmount = (shipment.paidAmountCents || 0) + args.amountCents;
    const totalAmount = shipment.totalAmountCents || 0;
    
    // Determine new payment status
    let paymentStatus: "pending" | "partial" | "paid" | "refunded";
    if (newPaidAmount <= 0) {
      paymentStatus = "pending";
    } else if (newPaidAmount >= totalAmount) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "partial";
    }
    
    // Create payment history entry
    const paymentHistoryEntry = {
      amountCents: args.amountCents,
      type: "payment" as const,
      method: args.method,
      transactionId: args.transactionId,
      processedBy: args.processedBy,
      processedAt: now,
      notes: args.notes,
    };
    
    // Update shipment
    await ctx.db.patch(args.shipmentId, {
      paidAmountCents: newPaidAmount,
      paymentStatus,
      paymentHistory: [
        ...(shipment.paymentHistory || []),
        paymentHistoryEntry
      ],
      updatedAt: now,
    });
    
    // Send status message to conversation
    await ctx.db.insert("messages", {
      conversationId: shipment.conversationId,
      senderId: args.processedBy,
      text: `Payment received: $${(args.amountCents / 100).toFixed(2)}`,
      kind: "status",
      payload: {
        type: "payment_received",
        amountCents: args.amountCents,
        totalPaidCents: newPaidAmount,
        paymentStatus,
        method: args.method,
        transactionId: args.transactionId,
      },
      createdAt: now,
    });
    
    // Update conversation lastMessageAt
    await ctx.db.patch(shipment.conversationId, {
      lastMessageAt: now,
    });
    
    // Update shipment status if fully paid
    if (paymentStatus === "paid" && shipment.status === "quote_sent") {
      await ctx.db.patch(args.shipmentId, {
        status: "booking_confirmed",
        updatedAt: now,
      });
      
      // Send booking confirmation message
      await ctx.db.insert("messages", {
        conversationId: shipment.conversationId,
        senderId: "system",
        text: "Booking confirmed! Payment received and your shipment is now confirmed.",
        kind: "status",
        payload: {
          type: "booking_confirmed",
          shipmentId: args.shipmentId,
        },
        createdAt: now,
      });
      
      await ctx.db.patch(shipment.conversationId, {
        lastMessageAt: now,
      });
    }
    
    return args.shipmentId;
  },
});

// Process a refund for a shipment
export const processRefund = mutation({
  args: {
    shipmentId: v.id("shipments"),
    amountCents: v.number(),
    method: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    processedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shipment = await ctx.db.get(args.shipmentId);
    if (!shipment) {
      throw new Error("Shipment not found");
    }
    
    const now = Date.now();
    const newPaidAmount = (shipment.paidAmountCents || 0) - args.amountCents;
    const totalAmount = shipment.totalAmountCents || 0;
    
    // Determine new payment status
    let paymentStatus: "pending" | "partial" | "paid" | "refunded";
    if (newPaidAmount <= 0) {
      paymentStatus = newPaidAmount < 0 ? "refunded" : "pending";
    } else if (newPaidAmount >= totalAmount) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "partial";
    }
    
    // Create refund history entry
    const refundHistoryEntry = {
      amountCents: args.amountCents,
      type: "refund" as const,
      method: args.method,
      transactionId: args.transactionId,
      processedBy: args.processedBy,
      processedAt: now,
      notes: args.notes,
    };
    
    // Update shipment
    await ctx.db.patch(args.shipmentId, {
      paidAmountCents: newPaidAmount,
      paymentStatus,
      paymentHistory: [
        ...(shipment.paymentHistory || []),
        refundHistoryEntry
      ],
      updatedAt: now,
    });
    
    // Send status message to conversation
    await ctx.db.insert("messages", {
      conversationId: shipment.conversationId,
      senderId: args.processedBy,
      text: `Refund processed: $${(args.amountCents / 100).toFixed(2)}`,
      kind: "status",
      payload: {
        type: "refund_processed",
        amountCents: args.amountCents,
        totalPaidCents: newPaidAmount,
        paymentStatus,
        method: args.method,
        transactionId: args.transactionId,
      },
      createdAt: now,
    });
    
    // Update conversation lastMessageAt
    await ctx.db.patch(shipment.conversationId, {
      lastMessageAt: now,
    });
    
    return args.shipmentId;
  },
});

// Get payment summary for dashboard
export const getPaymentSummary = query({
  args: {
    userId: v.string(),
    userRole: v.union(v.literal("admin"), v.literal("staff"), v.literal("client"), v.literal("partner"))
  },
  handler: async (ctx, args) => {
    // Get all shipments the user has access to
    const shipments = await ctx.db.query("shipments").collect();
    
    let userShipments = shipments;
    
    // Filter for non-admin/staff users
    if (args.userRole !== "admin" && args.userRole !== "staff") {
      const conversations = await ctx.db.query("conversations").collect();
      const userConversations = conversations.filter(conv => 
        conv.participantIds.includes(args.userId)
      );
      const userConversationIds = userConversations.map(conv => conv._id);
      
      userShipments = shipments.filter(shipment => 
        userConversationIds.includes(shipment.conversationId)
      );
    }
    
    // Calculate summary statistics
    const totalShipments = userShipments.length;
    const pendingPayments = userShipments.filter(s => s.paymentStatus === "pending").length;
    const paidShipments = userShipments.filter(s => s.paymentStatus === "paid").length;
    const partialPayments = userShipments.filter(s => s.paymentStatus === "partial").length;
    
    const totalRevenueCents = userShipments.reduce((sum, s) => sum + (s.paidAmountCents || 0), 0);
    const outstandingCents = userShipments.reduce((sum, s) => {
      const total = s.totalAmountCents || 0;
      const paid = s.paidAmountCents || 0;
      return sum + Math.max(0, total - paid);
    }, 0);
    
    return {
      totalShipments,
      pendingPayments,
      paidShipments,
      partialPayments,
      totalRevenueCents,
      outstandingCents,
    };
  },
});
