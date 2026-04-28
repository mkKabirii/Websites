# Implementation Checklist & Quick Reference

## 🚀 Quick Start - What to Implement First

### Week 1: Core Backend Infrastructure

- [ ] Create `quotationModel.js` (copy from BACKEND-IMPLEMENTATION-EXAMPLES.md)
- [ ] Update `clientModel.js` with new fields
- [ ] Update `userModel.js` with assignedClients and assignedDepartment
- [ ] Create `quotationsController.js`
- [ ] Create `quotationsRoutes.js`
- [ ] Update `clientsController.js` with new methods
- [ ] Create upload directories: `uploads/progress`, `uploads/documents`, `uploads/signatures`
- [ ] Install dependencies: `multer`, `crypto`, `path`

### Week 2: API Integration

- [ ] Test all endpoints with Postman
- [ ] Implement email notification system for quotations
- [ ] Add Socket.io integration for real-time messages
- [ ] Verify role-based access control on all endpoints

### Week 3: Frontend Connection

- [ ] Update frontend to call backend `/api/clients`
- [ ] Update frontend to call backend `/api/quotations`
- [ ] Connect file uploads to S3 or local storage
- [ ] Test full workflow end-to-end

---

## 📋 Database Schema Validation

Run these commands in MongoDB to verify schema:

```javascript
// Check Clients collection indexes
db.clients.getIndexes();

// Check Quotations collection exists
db.quotations.findOne();

// Check User has new fields
db.users.findOne();
```

---

## 🔌 API Endpoint Checklist

### Clients API

- [ ] GET `/api/clients` - List all (with role filtering)
- [ ] GET `/api/clients/{id}` - Get single client
- [ ] PUT `/api/clients/{id}` - Update client details
- [ ] PUT `/api/clients/{id}/assign-worker` - Assign worker
- [ ] POST `/api/clients/{id}/media` - Upload progress media
- [ ] POST `/api/clients/{id}/comments` - Add comment

### Quotations API

- [ ] GET `/api/quotations` - List all (with role filtering)
- [ ] POST `/api/quotations` - Create quotation
- [ ] PUT `/api/quotations/{id}` - Update quotation
- [ ] POST `/api/quotations/{id}/submit` - Client submits signed
- [ ] POST `/api/quotations/{id}/send` - Admin sends to client
- [ ] PUT `/api/quotations/{id}/approve` - Admin approves + assigns worker
- [ ] PUT `/api/quotations/{id}/reject` - Admin rejects

---

## 🔐 Permission Matrix

| Endpoint                        | Main Admin | Worker           | Client      |
| ------------------------------- | ---------- | ---------------- | ----------- |
| GET /clients                    | ✅ All     | ✅ Assigned Only | ❌          |
| GET /quotations                 | ✅ All     | ❌               | ✅ Own Only |
| POST /quotations                | ✅         | ❌               | ❌          |
| POST /quotations/{id}/submit    | ❌         | ❌               | ✅          |
| PUT /quotations/{id}/approve    | ✅         | ❌               | ❌          |
| PUT /clients/{id}/assign-worker | ✅         | ❌               | ❌          |

---

## 📁 File Structure After Implementation

```
wgtech-backend/
├── model/
│   ├── clientModel.js (updated)
│   ├── userModel.js (updated)
│   └── quotationModel.js (new)
├── controllers/
│   ├── clientsController.js (updated)
│   └── quotationsController.js (new)
├── routes/
│   ├── clientsRoutes.js (updated or new)
│   └── quotationsRoutes.js (new)
├── uploads/
│   ├── progress/
│   ├── documents/
│   └── signatures/
├── middleware/
│   └── authMiddleware.js
├── app.js
├── server.js
└── package.json (add multer if not present)
```

---

## 🧪 Test Sequence

### 1. Basic Client Operations

```
POST /api/clients
GET /api/clients
GET /api/clients/{id}
PUT /api/clients/{id}
```

### 2. Worker Assignment

```
PUT /api/clients/{id}/assign-worker
Verify: Client now has assignedWorker
Verify: Worker now has client in assignedClients
```

### 3. Quotation Creation & Sending

```
POST /api/quotations
POST /api/quotations/{id}/send
```

### 4. Client Submission (with files)

```
POST /api/quotations/{id}/submit (with multipart files)
Verify: All files saved correctly
Verify: Status changed to "signed"
```

### 5. Admin Approval & Worker Assignment

```
PUT /api/quotations/{id}/approve
Verify: Client assigned to worker
Verify: Worker has client in assignedClients
```

---

## 🐛 Common Issues & Solutions

### Issue: "File uploads not working"

**Solution:**

- [ ] Check `/uploads/{directory}` exists
- [ ] Check multer configuration in routes
- [ ] Verify file size limits in middleware
- [ ] Check file permissions

### Issue: "Role-based filtering not working"

**Solution:**

- [ ] Verify `req.user` is populated correctly
- [ ] Check user role value in database
- [ ] Add console.logs to verify user data

### Issue: "Worker not assigned after quotation approval"

**Solution:**

- [ ] Verify User document has `assignedClients` field
- [ ] Check `$addToSet` operation in controller
- [ ] Verify workerId matches database \_id

### Issue: "Signature not saving"

**Solution:**

- [ ] Check data URL format received from frontend
- [ ] Verify base64 decoding works
- [ ] Check `/uploads/signatures` directory exists
- [ ] Check file permissions on directory

---

## 📊 Sample Data for Testing

```javascript
// Sample Main Admin User
{
  _id: ObjectId("..."),
  fullname: "Admin User",
  email: "admin@wgtech.com",
  role: "admin",
  designation: { title: "Main Admin" },
  password: "hashed_password"
}

// Sample Worker
{
  _id: ObjectId("..."),
  fullname: "John Doe",
  email: "john@wgtech.com",
  role: "worker",
  assignedDepartment: "development",
  assignedClients: []
}

// Sample Client User
{
  _id: ObjectId("..."),
  fullname: "Ahmed Hassan",
  email: "ahmed@acme.com",
  role: "client"
}

// Sample Client
{
  _id: ObjectId("..."),
  userId: ObjectId("client_user_id"),
  name: "Acme Corporation",
  projectName: "Website Redesign",
  status: "Not Started",
  budget: 15000,
  assignedWorker: null,
  progressMedia: [],
  documents: [],
  comments: []
}

// Sample Quotation
{
  _id: ObjectId("..."),
  clientId: ObjectId("client_id"),
  mainAdminId: ObjectId("admin_id"),
  quotationDetails: {
    items: [
      { name: "Web Design", qty: 1, rate: 5000, description: "UI/UX design" },
      { name: "Development", qty: 1, rate: 8000, description: "Frontend" }
    ],
    totalAmount: 13000,
    advanceRequired: 6500,
    description: "Website Redesign"
  },
  status: "pending",
  expiryDate: new Date(Date.now() + 30*24*60*60*1000)
}
```

---

## 🔄 Frontend-Backend Integration Points

### Working Field Component

Replace in `wg-tech-admin/src/app/workingField/index.jsx`:

**Current:**

```javascript
const [mockClients, setMockClients] = useState([...]);
```

**Backend:**

```javascript
useEffect(() => {
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMockClients(data.data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };
  fetchClients();
}, [token]);
```

### Sign Your Quotation Component

Replace in `wg-tech-admin/src/app/signYourQuotation/index.jsx`:

**Current:**

```javascript
const mockQuotations = [...];
```

**Backend:**

```javascript
useEffect(() => {
  const fetchQuotations = async () => {
    try {
      const response = await fetch("/api/quotations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setQuotations(data.data);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
    }
  };
  fetchQuotations();
}, [token]);
```

---

## 📞 Notification System (To Implement)

### Events to Send Notifications

1. **Quotation Sent** → Email to Client
   - When: Admin clicks "Send Quotation"
   - Include: Quotation link, deadline, items summary

2. **Quotation Signed** → Notification to Admin
   - When: Client submits signed documents
   - Alert: New quotation awaiting review

3. **Quotation Approved** → Email to Client + Notification to Worker
   - When: Admin approves quotation
   - To Client: "Your project approved, assigned to [Worker]"
   - To Worker: "New client: [Client Name]"

4. **Status Updated** → Notification to Client
   - When: Project status changes
   - Show: New status and timeline update

---

## 🔗 Related Documentation

- See [BACKEND-API-SPECIFICATION.md](./BACKEND-API-SPECIFICATION.md) for detailed API specs
- See [BACKEND-IMPLEMENTATION-EXAMPLES.md](./BACKEND-IMPLEMENTATION-EXAMPLES.md) for code examples
- See [CHAT_INTEGRATION_GUIDE.md](./CHAT_INTEGRATION_GUIDE.md) for chat/messaging integration
- See [CHAT_IMPLEMENTATION_COMPLETE.md](./CHAT_IMPLEMENTATION_COMPLETE.md) for WebSocket setup

---

## ✅ Pre-Deploy Checklist

- [ ] All endpoints tested with different user roles
- [ ] File uploads tested with various file types and sizes
- [ ] Error messages user-friendly and logged properly
- [ ] Database backups configured
- [ ] Environment variables set correctly (.env file)
- [ ] CORS configured for frontend domain
- [ ] Rate limiting implemented
- [ ] SQL injection prevention verified
- [ ] JWT token expiration set appropriately
- [ ] Upload directories have proper permissions
- [ ] Multer file size limits configured
- [ ] Error middleware catches all exceptions
- [ ] Logging system operational
- [ ] Database indexes created for performance

---

## 📞 Support Reference

**Frontend Issues?** → Check [CHAT_INTEGRATION_GUIDE.md](./CHAT_INTEGRATION_GUIDE.md)
**API Not Working?** → Check authentication in authMiddleware.js
**Files Not Uploading?** → Check /uploads directory permissions
**Role Access Denied?** → Verify user.designation or user.role in database
