# Working Field & Sign Your Quotation - Implementation Guide

## 📋 Overview

This feature integrates three major capabilities:

1. **Working Field** - Unified project management page combining Project Progress and Project Updates
2. **Sign Your Quotation** - Multi-step quotation signing workflow
3. **Role-Based Access Control** - Separate visibility and access for Main Admin, Workers, and Clients

---

## 🎯 Feature Details

### 1. Working Field Page (`/working-field`)

**Components:**

- Client list with expandable sections
- Project overview, progress media, and documents tabs
- Integrated chat system with calling and document sharing
- Project notes and comments section

**Data Structure (Backend):**

```javascript
// Client record with project info
{
  _id: "client1",
  name: "Acme Corporation",
  email: "contact@acme.com",
  projectName: "Website Redesign",
  status: "In Progress",
  assignedWorker: "worker_id",
  assignedDepartment: "development",
  progressMedia: [
    { type: "image", url: "...", uploadedAt: Date },
    { type: "video", url: "...", uploadedAt: Date }
  ],
  documents: [
    { name: "Project Scope", url: "...", uploadedAt: Date }
  ],
  chat: [
    { senderId: "...", text: "...", timestamp: Date }
  ],
  comments: [
    { authorId: "...", text: "...", timestamp: Date }
  ]
}
```

**Role-Based Access:**

- **Main Admin**: Sees ALL clients and workers
- **Worker/Department**: Sees ONLY assigned clients
- **Client**: Sees ONLY their own project status

---

### 2. Sign Your Quotation (`/sign-quotation`)

**Process Flow:**

```
Main Admin Creates Quotation
           ↓
Client Receives & Reviews
           ↓
Client Completes 3 Steps:
  - E-Signature (Canvas)
  - National ID Upload (Front & Back)
  - Advance Payment Proof (50%)
           ↓
Client Submits for Review
           ↓
Main Admin Reviews Documents
           ↓
Main Admin Approves & Assigns to Worker
           ↓
Project Assigned to Worker/Department
```

**Data Structure (Backend):**

```javascript
{
  _id: "quote1",
  clientId: "client1",
  mainAdminId: "admin1",
  quotationDetails: {
    items: [
      { name: "Service", qty: 1, rate: 5000 }
    ],
    totalAmount: 15000,
    advanceRequired: 7500 // 50%
  },
  status: "pending", // pending, signed, approved, rejected, paid
  clientSubmission: {
    signature: "data:image/png...",
    nationalIdFront: "document_url",
    nationalIdBack: "document_url",
    paymentProof: "document_url",
    submittedAt: Date
  },
  adminApproval: {
    approvedBy: "admin1",
    approvedAt: Date,
    assignedWorker: "worker_id",
    assignedDepartment: "development"
  }
}
```

**Visibility/Access:**

- **Main Admin**: Can create, edit, review, approve quotations
- **Client**: Can only view and sign their own quotations
- **Workers**: Cannot see this section at all

---

## 🔐 Role-Based Access Control Implementation

### Backend User Model

```javascript
// User Schema
{
  _id: ObjectId,
  fullname: String,
  email: String,
  role: "main_admin" | "admin" | "worker" | "client", // Main role
  designation: {
    // For admin panel hierarchy
    _id: ObjectId,
    title: "Main Admin" | "Admin" | "Worker",
    routes: [
      { path: "/", permissions: { isView: true, isEdit: true } }
    ]
  },
  assignedClients: [ObjectId], // For workers - array of client IDs
  assignedDepartment: "development" | "design" | "marketing", // For workers
  status: "active" | "inactive"
}
```

### Frontend Implementation

**In Working Field Component:**

```javascript
import { useUserStore } from "../../zustand/useUserStore";

const WorkingField = () => {
  const user = useUserStore((s) => s.user);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem("token");

    let url = `${API_URL}/api/clients`;

    // Filter based on user role
    if (user.role === "worker") {
      // Workers see only assigned clients
      url += `?assignedWorker=${user._id}`;
    }
    // Main Admin sees all clients (no filter)

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    setClients(data);
  };

  // For workers - restrict edits to assigned clients only
  const canEditClient = (clientId) => {
    if (user.role === "main_admin") return true;
    if (user.role === "worker") {
      return user.assignedClients?.includes(clientId);
    }
    return false;
  };

  return (
    // ... JSX using fetchClients and canEditClient
  );
};
```

**In Sign Your Quotation Component:**

```javascript
// Check access before rendering
const SignYourQuotation = () => {
  const user = useUserStore((s) => s.user);

  const isMainAdmin = user?.designation?.title === "Main Admin";
  const isClient = user?.role === "client";

  if (!isMainAdmin && !isClient) {
    return <AccessDenied />;
  }

  // Main Admin view: All quotations
  if (isMainAdmin) {
    return <MainAdminQuotationPanel />;
  }

  // Client view: Only their quotations
  return <ClientQuotationPanel clientId={user._id} />;
};
```

---

## 🔄 Worker Assignment Workflow

### Step 1: Main Admin Assigns Client to Worker

**Backend Endpoint (to create):**

```
PUT /api/clients/:clientId/assign-worker
Request Body:
{
  workerId: "worker_id",
  department: "development"
}

Response:
{
  success: true,
  client: {
    _id: "client1",
    assignedWorker: "worker_id",
    assignedDepartment: "development"
  }
}
```

### Step 2: Update User Model

Update worker/user record with assigned clients:

```
PUT /api/users/:workerId/add-client
Request Body:
{
  clientId: "client1"
}

Response:
{
  _id: "worker_id",
  assignedClients: ["client1", "client2"],
  assignedDepartment: "development"
}
```

### Step 3: Auto-Filter in Frontend

Working Field automatically lists:

- **Main Admin**: All clients
- **Worker**: Only clients in user.assignedClients array

---

## 📡 Backend API Endpoints Needed

### Clients API

```
GET /api/clients
  - Main Admin: Returns all clients
  - Worker: Returns only assigned clients
  - Filter: ?assignedWorker=workerID

GET /api/clients/:id

PUT /api/clients/:id
  - Update project status, progress, documents

POST /api/clients/:id/assign-worker
  - Assign client to worker (Main Admin only)
```

### Quotations API

```
GET /api/quotations
  - Main Admin: All quotations
  - Client: Only their quotations

POST /api/quotations
  - Create new quotation (Main Admin only)

PUT /api/quotations/:id
  - Edit quotation details (Main Admin only)

POST /api/quotations/:id/submit
  - Client submits signed documents

PUT /api/quotations/:id/approve
  - Main Admin approves quotation
```

### Chat API (Extended)

```
POST /api/chats/:chatId/messages
  - Send message in chat

POST /api/chats/:chatId/documents
  - Upload document to chat

POST /api/chats/:chatId/call
  - Initiate call (webhook to call service)
```

---

## 🎨 Routing & Navigation Setup

### Update sidebar navigation in MainLayout

```javascript
// In layout/index.jsx

const routesToShow =
  user?.role === "main_admin"
    ? [
        { id: 14, name: "Working Field", path: "/working-field" },
        { id: 14.5, name: "Sign Your Quotation", path: "/sign-quotation" },
        // ... other admin routes
      ]
    : user?.role === "worker"
      ? [
          { id: 14, name: "Working Field", path: "/working-field" },
          // No Sign Quotation for workers
          // ... worker routes
        ]
      : [
          // Client doesn't see these in admin dashboard
        ];
```

---

## 💾 Database Schema Updates

### Clients Collection (Update)

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  projectName: String,

  // Assignment
  assignedWorker: ObjectId,  // NEW
  assignedDepartment: String, // NEW

  // Project tracking
  status: "In Progress" | "Completed" | "On Hold",
  progressMedia: [
    {
      type: "image" | "video",
      url: String,
      uploadedAt: Date,
      uploadedBy: ObjectId
    }
  ],
  documents: [
    {
      name: String,
      url: String,
      uploadedAt: Date
    }
  ],

  // Comments
  comments: [
    {
      authorId: ObjectId,
      text: String,
      timestamp: Date
    }
  ]
}
```

### Quotations Collection (New)

```javascript
{
  _id: ObjectId,
  clientId: ObjectId,
  mainAdminId: ObjectId,

  quotationDetails: {
    items: [
      { name: String, qty: Number, rate: Number }
    ],
    totalAmount: Number,
    advanceRequired: Number,
    description: String
  },

  status: "pending" | "signed" | "approved" | "rejected" | "paid",

  clientSubmission: {
    signature: String, // Canvas data URL
    nationalIdFront: String, // Document URL
    nationalIdBack: String,
    paymentProof: String,
    submittedAt: Date
  },

  adminApproval: {
    approvedBy: ObjectId,
    approvedAt: Date,
    assignedWorker: ObjectId,
    assignedDepartment: String,
    notes: String
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔍 Permission Checks Flowchart

```
Working Field Access?
├─ Main Admin → ✅ View ALL clients
├─ Worker → ✅ View only assigned clients
├─ Client → ❌ NO ACCESS (redirect)
└─ Other → ❌ NO ACCESS

Sign Quotation Access?
├─ Main Admin → ✅ Full access (create, edit, review, approve)
├─ Client → ✅ Sign documents only
└─ Worker → ❌ NO ACCESS

Can Edit Client?
├─ Main Admin → ✅ Always
├─ Worker → ✅ Only assigned clients
├─ Client → ❌ NO

Can Approve Quotation?
├─ Main Admin → ✅ YES
├─ Others → ❌ NO
```

---

## 📊 Integration Checklist

- [ ] Create Working Field component ✅
- [ ] Create Sign Your Quotation component ✅
- [ ] Update routes in index.jsx ✅
- [ ] Create backend endpoints for clients API
- [ ] Create backend endpoints for quotations API
- [ ] Add client assignment logic in admin
- [ ] Implement Socket.io for real-time chat
- [ ] Add file upload handlers for documents
- [ ] Implement e-signature canvas save
- [ ] Add payment integration for advance payment
- [ ] Create worker dashboard for assigned clients
- [ ] Add notifications for quotation status
- [ ] Implement audit logs for all changes
- [ ] Add permission enforcement in backend

---

## 🚀 Next Steps

1. **Backend Development**
   - Create API endpoints listed above
   - Implement role-based filtering
   - Setup database indexes

2. **Frontend Integration**
   - Connect API calls in components
   - Replace mock data with real API
   - Implement error handling

3. **Testing**
   - Test role-based access
   - Verify worker-client filtering
   - Test quotation workflow

4. **Deployment**
   - Deploy frontend and backend
   - Monitor permissions enforcement
   - Setup audit logging

---

## 📝 Notes

- All components use mock data currently
- Backend endpoints are placeholders
- Role-based access is implemented at UI level; enforce at API level too
- E-signature data should be stored securely (consider hashing)
- National ID images should be uploaded to secure storage (S3, etc.)
- Payment proof should be verified before approval

---

## 🆘 Troubleshooting

**Workers not seeing assigned clients?**

- Check `assignedClients` array in user record
- Verify API filter is working correctly
- Check browser console for errors

**Main Admin can't approve quotations?**

- Verify user role is "Main Admin"
- Check database permissions
- Clear browser cache and reload

**Chat not sending messages?**

- Verify Socket.io connection
- Check API endpoint is responding
- Check authentication token
