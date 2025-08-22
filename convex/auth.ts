import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Simple login function that finds a user by email and password
export const login = mutation({
  args: { 
    email: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    // Find user by email
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    // If user doesn't exist and it's a demo email, create it
    if (!user && args.email.endsWith("@example.com")) {
      console.log(`Creating demo user for ${args.email}`);
      
      let role: "admin" | "staff" | "client" = "client";
      let name = "Demo User";
      
      if (args.email.startsWith("admin@")) {
        role = "admin";
        name = "Admin User";
      } else if (args.email.startsWith("staff@")) {
        role = "staff";
        name = "Staff User";
      } else if (args.email.startsWith("client@")) {
        role = "client";
        name = "Client User";
      }
      
      const userId = await ctx.db.insert("users", {
        name,
        email: args.email,
        role,
        orgId: role === "client" ? "org_client" : "org_petshippers",
      });
      
      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // For demo purposes, we'll accept any password for existing users
    // In production, you'd hash and compare passwords properly
    console.log(`Login successful for ${args.email} (${user.role})`);
    
    // Return user data (excluding password)
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

// Get current user by ID
export const getCurrentUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as any);
    
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

// Logout (for now, just a placeholder - in production you'd handle tokens)
export const logout = mutation({
  args: {},
  handler: async (ctx, args) => {
    // In a real app, you'd invalidate tokens here
    return { success: true };
  },
});
