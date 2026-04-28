# Backend API Specification - Working Field & Sign Your Quotation

## 📌 Base URL

```
http://localhost:8003/api
```

---

## 👥 CLIENTS ENDPOINTS

### 1. Get All Clients (with role-based filtering)

**GET** `/clients`

**Query Parameters:**

- `assignedWorker` (optional) - Filter by assigned worker ID
- `role` (optional) - User role for filtering
- `status` (optional) - Project status filter
- `limit` (optional) - Page limit (default: 10)
- `page` (optional) - Page number (default: 1)

**Response:**

```javascript
{
  success: true,
  data: [
    {
      _id: "client1",
      name: "Acme Corporation",
      email: "contact@acme.com",
      phone: "+1234567890",
      projectName: "Website Redesign",
      status: "In Progress",
      assignedWorker: "worker_id",
      assignedDepartment: "development",
      budget: 15000,
      progressMedia: [
        {
          type: "image",
          url: "/uploads/progress_1.jpg",
          uploadedAt: "2026-03-20T10:30:00Z",
          uploadedBy: "worker_id"
        }
      ],
      documents: [
        {
          name: "Project Scope",
          url: "/uploads/scope.pdf",
          uploadedAt: "2026-03-15T14:20:00Z"
        }
      ],
      comments: [
        {
          _id: "comment1",
          authorId: "worker_id",
          text: "Design approved, proceeding with development",
          timestamp: "2026-03-18T09:00:00Z"
        }
      ],
      createdAt: "2026-03-01T00:00:00Z"
    }
  ],
  total: 10,
  page: 1,
  pages: 1
}
```

**Error Response:**

```javascript
{
  success: false,
  message: "Unauthorized access"
}
```

---

### 2. Get Single Client

**GET** `/clients/:clientId`

**Response:**

```javascript
{
  success: true,
  data: { /* client object */ }
}
```

---

### 3. Update Client Project Status/Details

**PUT** `/clients/:clientId`

**Request Body:**

```javascript
{
  status: "In Progress", // "In Progress", "Completed", "On Hold"
  progressUpdate: "Current work status...",
  notes: "Internal notes"
}
```

**Response:**

```javascript
{
  success: true,
  message: "Client updated successfully",
  data: { /* updated client object */ }
}
```

---

### 4. Upload Progress Media

**POST** `/clients/:clientId/media`

**Content-Type:** `multipart/form-data`

**Form Data:**

- `file` (File) - Image or video file
- `type` (string) - "image" or "video"
- `description` (string) - Optional media description

**Response:**

```javascript
{
  success: true,
  message: "Media uploaded successfully",
  data: {
    type: "image",
    url: "/uploads/progress_20260320_123456.jpg",
    uploadedAt: "2026-03-20T10:30:00Z",
    uploadedBy: "worker_id"
  }
}
```

---

### 5. Assign Worker to Client

**PUT** `/clients/:clientId/assign-worker`

**Authentication:** Required (Main Admin only)

**Request Body:**

```javascript
{
  workerId: "worker_id",
  department: "development"
}
```

**Backend Logic:**

```
1. Verify user is Main Admin
2. Check if worker exists and belongs to department
3. Update client record:
   - Set assignedWorker = workerId
   - Set assignedDepartment = department
4. Update worker record:
   - Add clientId to assignedClients array
5. Return updated client + worker info
```

**Response:**

```javascript
{
  success: true,
  message: "Worker assigned successfully",
  data: {
    client: {
      _id: "client1",
      name: "Acme Corporation",
      assignedWorker: "worker_id",
      assignedDepartment: "development"
    },
    worker: {
      _id: "worker_id",
      fullname: "John Doe",
      assignedClients: ["client1", "client2"]
    }
  }
}
```

---

### 6. Add Comment to Client Project

**POST** `/clients/:clientId/comments`

**Request Body:**

```javascript
{
  text: "Great progress! Ready for next phase.",
  visibility: "all" // "all", "admin_only", "worker_only"
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    _id: "comment1",
    authorId: "user_id",
    authorName: "Admin Name",
    text: "Great progress! Ready for next phase.",
    timestamp: "2026-03-20T10:30:00Z",
    visibility: "all"
  }
}
```

---

## 📋 QUOTATIONS ENDPOINTS

### 1. Get All Quotations (Role-Based)

**GET** `/quotations`

**Logic:**

- Main Admin sees all quotations
- Client sees only their quotations
- Worker cannot see this endpoint

**Response:**

```javascript
{
  success: true,
  data: [
    {
      _id: "quote1",
      clientId: "client1",
      clientName: "Acme Corporation",
      mainAdminId: "admin1",
      quotationDetails: {
        items: [
          {
            name: "Web Design",
            qty: 1,
            rate: 5000,
            description: "Complete UI/UX design"
          },
          {
            name: "Frontend Development",
            qty: 1,
            rate: 8000,
            description: "React implementation"
          }
        ],
        totalAmount: 13000,
        advanceRequired: 6500,
        description: "Website Redesign Project",
        currency: "PKR"
      },
      status: "pending", // pending, signed, approved, rejected, paid
      createdAt: "2026-03-20T00:00:00Z",
      expiryDate: "2026-04-20T00:00:00Z"
    }
  ],
  total: 5,
  page: 1
}
```

---

### 2. Create New Quotation

**POST** `/quotations`

**Authentication:** Main Admin only

**Request Body:**

```javascript
{
  clientId: "client1",
  items: [
    {
      name: "Service Name",
      qty: 1,
      rate: 5000,
      description: "Service description"
    }
  ],
  description: "Project scope overview",
  notes: "Internal notes for admin"
}
```

**Calculation Logic:**

```
totalAmount = sum(qty * rate for each item)
advanceRequired = totalAmount * 0.5 (50%)
```

**Response:**

```javascript
{
  success: true,
  message: "Quotation created successfully",
  data: {
    _id: "quote1",
    clientId: "client1",
    quotationDetails: { /* as shown above */ },
    status: "pending",
    createdAt: "2026-03-20T10:30:00Z"
  }
}
```

---

### 3. Update Quotation (Before Client Signature)

**PUT** `/quotations/:quotationId`

**Authentication:** Main Admin only

**Constraint:** Only allowed if status is "pending"

**Request Body:**

```javascript
{
  items: [ /* updated items array */ ],
  description: "Updated description",
  notes: "admin notes"
}
```

**Response:**

```javascript
{
  success: true,
  message: "Quotation updated successfully",
  data: { /* updated quotation */ }
}
```

---

### 4. Client Submits Signed Quotation

**POST** `/quotations/:quotationId/submit`

**Authentication:** Required (Client only)

**Constraint:** Quotation must be sent to client first

**Request Body:**

```
{
  signature: "data:image/png;base64,...", // Canvas data URL
  nationalIdFront: File, // Multipart form data
  nationalIdBack: File,
  paymentProof: File
}
```

**Backend Logic:**

```
1. Verify user is the quotation's client
2. Save signature as image (convert from data URL)
3. Upload ID images to secure storage (S3)
4. Upload payment proof to secure storage
5. Update quotation status to "signed"
6. Send notification to Main Admin
```

**Response:**

```javascript
{
  success: true,
  message: "Quotation submitted successfully",
  data: {
    _id: "quote1",
    status: "signed",
    clientSubmission: {
      signature: "/uploads/signatures/quote1_sig.png",
      nationalIdFront: "/uploads/documents/client1_id_front.jpg",
      nationalIdBack: "/uploads/documents/client1_id_back.jpg",
      paymentProof: "/uploads/documents/client1_payment.jpg",
      submittedAt: "2026-03-20T14:30:00Z"
    }
  }
}
```

---

### 5. Main Admin Approves Quotation

**PUT** `/quotations/:quotationId/approve`

**Authentication:** Main Admin only

**Constraint:** Quotation must be in "signed" status

**Request Body:**

```javascript
{
  workerId: "worker_id",
  department: "development",
  notes: "Approved - proceeding with assignment"
}
```

**Backend Logic:**

```
1. Verify user is Main Admin
2. Verify quotation is in "signed" status
3. Update quotation:
   - status = "approved"
   - adminApproval = { approvedBy, approvedAt, assignedWorker, assignedDepartment }
4. Update/Create client record:
   - Set assignedWorker = workerId
   - Set assignedDepartment = department
5. Assign worker to client (call worker assignment logic)
6. Send notifications to:
   - Client: "Your quotation approved. Project assigned to [Worker Name]"
   - Worker: "New client assigned: [Client Name]"
```

**Response:**

```javascript
{
  success: true,
  message: "Quotation approved and project assigned",
  data: {
    quotation: {
      _id: "quote1",
      status: "approved",
      adminApproval: {
        approvedBy: "admin_id",
        approvedAt: "2026-03-20T15:00:00Z",
        assignedWorker: "worker_id",
        assignedDepartment: "development"
      }
    },
    clientAssignment: {
      _id: "client1",
      assignedWorker: "worker_id",
      assignedDepartment: "development"
    }
  }
}
```

---

### 6. Main Admin Rejects Quotation

**PUT** `/quotations/:quotationId/reject`

**Authentication:** Main Admin only

**Request Body:**

```javascript
{
  reason: "Payment proof insufficient. Please resubmit.";
}
```

**Response:**

```javascript
{
  success: true,
  message: "Quotation rejected",
  data: {
    _id: "quote1",
    status: "rejected",
    rejectionReason: "Payment proof insufficient. Please resubmit.",
    rejectedAt: "2026-03-20T15:00:00Z",
    rejectedBy: "admin_id"
  }
}
```

---

### 7. Send Quotation to Client

**POST** `/quotations/:quotationId/send`

**Authentication:** Main Admin only

**Backend Logic:**

```
1. Update quotation status to "sent"
2. Generate secure access link for client
3. Send email to client with:
   - Quotation details
   - Secure link to view and sign
   - Instructions for submission
```

**Response:**

```javascript
{
  success: true,
  message: "Quotation sent to client",
  data: {
    _id: "quote1",
    status: "sent",
    clientAccessUrl: "https://wgtechsol.com/sign-quotation/token123456",
    sentAt: "2026-03-20T10:30:00Z"
  }
}
```

---

## 💬 CHAT ENDPOINTS (Extended)

### 1. Send Message with File Support

**POST** `/chats/:chatId/messages`

**Request Body (Text):**

```javascript
{
  text: "Here's the updated design",
  type: "text"
}
```

**Request Body (File):**

```
Content-Type: multipart/form-data
{
  file: File,
  type: "document" // "image", "video", "document"
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    _id: "msg1",
    chatId: "chat1",
    senderId: "user_id",
    senderName: "Admin Name",
    text: "Message or file info",
    type: "text", // "text", "image", "video", "document"
    fileUrl: "/uploads/documents/file.pdf", // If file
    timestamp: "2026-03-20T10:30:00Z"
  }
}
```

---

### 2. Initiate Voice/Video Call

**POST** `/chats/:chatId/call`

**Request Body:**

```javascript
{
  callType: "voice"; // "voice", "video"
}
```

**Backend Logic:**

```
1. Create call session in database
2. Send call notification to recipient
3. Generate WebRTC connection tokens
4. Return call details for frontend
```

**Response:**

```javascript
{
  success: true,
  data: {
    callId: "call1",
    callType: "voice",
    initiatedBy: "user_id",
    initiatedAt: "2026-03-20T10:30:00Z",
    rtcTokens: {
      initiator: "token123...",
      participant: "token456..."
    }
  }
}
```

---

## 🔐 WORKERS/USERS ENDPOINTS

### 1. Add Client to Worker

**PUT** `/users/:workerId/add-client`

**Authentication:** Main Admin only

**Request Body:**

```javascript
{
  clientId: "client1";
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    _id: "worker_id",
    fullname: "John Doe",
    assignedClients: ["client1", "client2"],
    assignedDepartment: "development"
  }
}
```

---

### 2. Remove Client from Worker

**PUT** `/users/:workerId/remove-client`

**Authentication:** Main Admin only

**Request Body:**

```javascript
{
  clientId: "client1";
}
```

---

## 🔒 PERMISSION CHECKS (Backend)

All endpoints should implement these checks:

```javascript
// Middleware function
const checkWorkingFieldAccess = (req, res, next) => {
  const user = req.user;

  if (user.role === "main_admin") {
    return next(); // Full access
  }

  if (user.role === "worker") {
    // Check if accessing own clients only
    // req.query.assignedWorker or req.body.workerId must equal user._id
    if (req.query.assignedWorker !== user._id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    return next();
  }

  if (user.role === "client") {
    return res.status(403).json({
      message: "Clients cannot access this endpoint",
    });
  }

  res.status(401).json({ message: "Unauthorized" });
};

// Apply to routes
app.get("/api/clients", checkWorkingFieldAccess, getClients);
app.get("/api/quotations", checkQuotationAccess, getQuotations);
```

---

## 📊 Database Indexes

Create these indexes for performance:

```javascript
// Clients collection
db.clients.createIndex({ assignedWorker: 1 });
db.clients.createIndex({ assignedDepartment: 1 });
db.clients.createIndex({ status: 1 });
db.clients.createIndex({ createdAt: -1 });

// Quotations collection
db.quotations.createIndex({ clientId: 1 });
db.quotations.createIndex({ status: 1 });
db.quotations.createIndex({ mainAdminId: 1 });
db.quotations.createIndex({ createdAt: -1 });

// Users collection
db.users.createIndex({ assignedClients: 1 });
db.users.createIndex({ role: 1 });
```

---

## 🔔 Notifications to Implement

1. **Quotation Sent** → Client receives email + in-app notification
2. **Quotation Signed** → Admin receives notification
3. **Quotation Approved** → Client + Worker receive notifications
4. **Worker Assigned** → Worker receives notification with client details
5. **New Message** → Both parties receive real-time notification
6. **New Media Upload** → Relevant parties notified

---

## ✅ Testing Checklist

- [ ] Main Admin can create quotations for clients
- [ ] Main Admin can view all clients and quotations
- [ ] Main Admin can approve/reject quotations
- [ ] Main Admin can assign workers to clients
- [ ] Workers can only see assigned clients
- [ ] Workers can only communicate with assigned clients
- [ ] Clients can only see their own quotations
- [ ] Clients can submit signatures and documents
- [ ] Payment verification works correctly
- [ ] Role-based access control enforced at all endpoints
- [ ] File uploads are secure
- [ ] Chat messages are stored properly
- [ ] Notifications sent at appropriate times
