# 🐾 Pet Shippers - Real-time Pet Transportation Platform

A modern, real-time web application for managing pet shipping services with live messaging, quote requests, and shipment tracking.

## 🏗️ **Architecture Overview**

### **Frontend: React + TypeScript + Vite**
- **React 18** with TypeScript for type-safe component development
- **Vite** for fast development and optimized production builds
- **Tailwind CSS** for responsive, utility-first styling
- **React Router v6** for client-side routing
- **TanStack Query** for server state management (legacy, being phased out)
- **Lucide React** for consistent iconography

### **Backend: Convex Real-time Database**
- **Convex** - Real-time backend-as-a-service with live queries
- **Real-time messaging** - Messages appear instantly across all connected clients
- **Type-safe API** - Generated TypeScript types for all database operations
- **Serverless functions** - Mutations and queries run on Convex's infrastructure
- **Automatic scaling** - No server management required

### **Deployment: Netlify + Convex Cloud**
- **Frontend**: Deployed on Netlify with automatic GitHub integration
- **Backend**: Deployed on Convex Cloud with global edge distribution
- **Environment Variables**: Production Convex URL configured in Netlify

## 🚀 **Key Features**

### **Real-time Messaging System**
- **Live conversations** between customers, staff, and partners
- **Instant message delivery** with no page refresh required
- **Message types**: Text, quotes, product recommendations, status updates
- **System messages** for automated updates (quote requests, status changes)

### **Quote Request Workflow**
- **Customer portal** for submitting pet shipping quote requests
- **Automatic conversation creation** when quotes are submitted
- **Staff dashboard** for managing and responding to quote requests
- **Real-time notifications** when new requests arrive

### **User Role Management**
- **Admin**: Full access to all features and data
- **Staff**: Can manage conversations, quotes, and shipments
- **Client**: Can request quotes, view shipments, and chat with staff
- **Partner**: Collaborative shipping company access (future feature)

### **Shipment Tracking**
- **Real-time status updates** for pet shipments
- **Document management** with expiry tracking
- **Route visualization** from origin to destination
- **Mobile-optimized** tracking interface

## 🛠️ **Technology Stack**

### **Frontend Dependencies**
```json
{
  "react": "^18.3.1",                    // UI framework
  "typescript": "^5.6.2",               // Type safety
  "vite": "^6.0.1",                     // Build tool
  "tailwindcss": "^3.4.17",            // Styling
  "react-router-dom": "^7.8.1",        // Routing
  "@tanstack/react-query": "^5.85.5",  // Server state (legacy)
  "convex": "^1.25.4",                 // Real-time backend
  "lucide-react": "^0.344.0"           // Icons
}
```

### **Backend (Convex) Features**
- **Real-time queries** that update automatically when data changes
- **Mutations** for secure data modifications
- **Schema validation** with TypeScript integration
- **Automatic indexing** for optimal query performance
- **Built-in authentication** (demo mode for POC)

## 📁 **Project Structure**

```
pet-shippers/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx      # Main app layout with navigation
│   │   └── ui/             # Basic UI primitives (Button, Input, Modal)
│   ├── pages/              # Route components
│   │   ├── Login.tsx       # Authentication page
│   │   ├── CustomerDashboard.tsx  # Client portal home
│   │   ├── Inbox.tsx       # Message list view
│   │   ├── Conversation.tsx # Real-time chat interface
│   │   ├── Shipments.tsx   # Shipment tracking
│   │   └── Admin.tsx       # Admin management panel
│   ├── contexts/           # React context providers
│   │   └── AuthContext.tsx # User authentication state
│   ├── lib/                # Utility functions
│   │   ├── utils.ts        # Helper functions
│   │   └── queryClient.ts  # TanStack Query setup
│   └── types.ts            # TypeScript type definitions
├── convex/                 # Backend functions and schema
│   ├── schema.ts           # Database schema definition
│   ├── auth.ts             # Authentication functions
│   ├── messages.ts         # Real-time messaging
│   ├── conversations.ts    # Conversation management
│   ├── quoteRequests.ts    # Quote request system
│   ├── shipments.ts        # Shipment tracking
│   └── seedData.ts         # Development data seeding
└── public/                 # Static assets
    └── _redirects          # Netlify SPA routing config
```

## 🔧 **Development Setup**

### **Prerequisites**
- **Node.js** 18+ and npm
- **Git** for version control
- **Convex account** (free tier available)

### **1. Clone and Install**
```bash
git clone https://github.com/Shimizu-Technology/pet-shippers.git
cd pet-shippers
npm install
```

### **2. Start the Application**

#### **Option A: Quick Start (Recommended)**
```bash
# Terminal 1: Start Convex backend
npx convex dev
# When prompted, select "choose an existing project" → "pet-shippers"

# Terminal 2: Start React frontend  
npm run dev
```

#### **Option B: First Time Setup**
If you don't have a Convex account or project yet:
```bash
# Login to Convex (creates account if needed)
npx convex login

# Start local development server
npx convex dev
# Select "choose an existing project" → "pet-shippers"
# OR "create a new project" if pet-shippers isn't available

# In a separate terminal, seed the database
npx convex run seedData:seedAllData

# In another terminal, start frontend
npm run dev
```

### **3. Access Your Local App**
- **Frontend:** http://localhost:5173
- **Convex Backend:** http://127.0.0.1:3210  
- **Convex Dashboard:** http://127.0.0.1:6790

The `.env.local` file will be automatically created with the correct Convex URL.

### **4. Test User Accounts**
- **Admin**: `admin@example.com` (any password)
- **Staff**: `staff@example.com` (any password)  
- **Client**: `client@example.com` (any password)

## 🚀 **Production Deployment**

### **Backend Deployment (Convex)**

1. **Deploy to Convex Cloud:**
```bash
npx convex deploy
```

2. **Seed Production Data:**
```bash
npx convex run --prod seedData:seedAllData
```

3. **Note the Production URL:**
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### **Syncing Production with Latest Changes**

When your production environment is out of sync with local development:

1. **Deploy Latest Functions:**
```bash
npx convex deploy
```

2. **Clear Old Data & Reseed:**
```bash
# Clear existing production data
npx convex run --prod seedData:clearAllData

# Seed fresh data with latest improvements
npx convex run --prod seedData:seedAllData

# Backfill missing shipments (if needed)
npx convex run --prod seedData:backfillMissingShipments
```

3. **Verify Deployment:**
- Check your production app to ensure data is properly populated
- Test key workflows (quote requests, messaging, payments)

### **Frontend Deployment (Netlify)**

1. **Connect GitHub Repository:**
   - Go to Netlify Dashboard → "Add new site" → "Import from Git"
   - Connect your GitHub repository

2. **Configure Build Settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

3. **Set Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add: `VITE_CONVEX_URL` = `https://your-deployment.convex.cloud`

4. **Deploy:**
   - Push to main branch triggers automatic deployment
   - Or manually trigger deploy in Netlify dashboard

### **Custom Domain (Optional)**
- Configure custom domain in Netlify dashboard
- SSL certificates are automatically provisioned

## 🧪 **Testing the Application**

### **Real-time Messaging Test**
1. Open app in two browser tabs
2. Login as different users (admin + client)
3. Start a conversation and send messages
4. Messages should appear instantly in both tabs

### **Quote Request Flow**
1. Login as client → Request Quote
2. Fill out pet shipping details → Submit
3. New conversation appears in inbox
4. Login as admin → Respond to quote request

### **Mobile Responsiveness**
- Test on mobile devices or browser dev tools
- All features should work on small screens
- Navigation adapts to mobile layout

## 🔍 **Key Technical Decisions**

### **Why Convex over Traditional Backend?**
- **Real-time by default**: No WebSocket setup required
- **Type safety**: Generated TypeScript types for all operations
- **Serverless**: No infrastructure management
- **Optimistic updates**: UI updates instantly, syncs in background
- **Offline support**: Built-in handling of network issues

### **Why Vite over Create React App?**
- **Faster development**: Hot module replacement
- **Smaller bundles**: Better tree shaking
- **Modern tooling**: Native ES modules support
- **Better TypeScript**: Faster type checking

### **Why Tailwind CSS?**
- **Utility-first**: Rapid UI development
- **Responsive design**: Mobile-first approach
- **Consistent spacing**: Design system built-in
- **Small bundle size**: Purges unused styles

## 🐛 **Troubleshooting**

### **Common Issues**

**Convex connection errors:**
```bash
# Restart Convex dev server
npx convex dev
```

**Environment variable not found:**
- Check `.env.local` exists with `VITE_CONVEX_URL`
- Restart development server after adding env vars

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Real-time updates not working:**
- Verify Convex URL is correct
- Check browser console for connection errors
- Ensure both tabs use same Convex deployment

**Production data out of sync with local:**
```bash
# Deploy latest code and reseed production
npx convex deploy
npx convex run --prod seedData:clearAllData
npx convex run --prod seedData:seedAllData
```

**Missing shipments in production:**
```bash
# Run backfill to create shipments for existing quote requests
npx convex run --prod seedData:backfillMissingShipments
```

## 📚 **Learning Resources**

### **Convex Documentation**
- [Getting Started](https://docs.convex.dev/getting-started)
- [React Integration](https://docs.convex.dev/client/react)
- [Database Queries](https://docs.convex.dev/database/reading-data)

### **React + TypeScript**
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Vite Guide](https://vitejs.dev/guide/)

### **Deployment**
- [Netlify Docs](https://docs.netlify.com/)
- [Convex Production](https://docs.convex.dev/production)

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ **Support**

For questions or issues:
- Create an issue in this repository
- Check [Convex Community](https://convex.dev/community)
- Review the troubleshooting section above

---

**Built with ❤️ using React, TypeScript, and Convex**
