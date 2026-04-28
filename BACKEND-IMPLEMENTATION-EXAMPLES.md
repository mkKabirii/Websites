# Backend Implementation Examples - Working Field & Sign Your Quotation

This file provides example code implementations for the backend developer.

---

## 📁 Database Models

### Clients Model (Updated)

**File:** `wgtech-backend/model/clientModel.js`

```javascript
const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: String,
    email: String,
    phone: String,
    company: String,
    address: String,

    // Project Information
    projectName: String,
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "On Hold", "Completed"],
      default: "Not Started",
    },
    budget: Number,
    description: String,

    // Worker Assignment
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedDepartment: {
      type: String,
      default: null,
    },

    // Progress Media
    progressMedia: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
        },
        url: String,
        uploadedAt: Date,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Documents
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: Date,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Comments
    comments: [
      {
        authorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        authorName: String,
        text: String,
        timestamp: Date,
        visibility: {
          type: String,
          enum: ["all", "admin_only", "worker_only"],
          default: "all",
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Client", clientSchema);
```

---

### Quotations Model (New)

**File:** `wgtech-backend/model/quotationModel.js`

```javascript
const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    mainAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Quotation Details
    quotationDetails: {
      items: [
        {
          name: String,
          qty: Number,
          rate: Number,
          description: String,
        },
      ],
      totalAmount: Number,
      advanceRequired: Number, // 50% of total
      description: String,
      currency: {
        type: String,
        default: "PKR",
      },
    },

    // Status Tracking
    status: {
      type: String,
      enum: ["pending", "sent", "signed", "approved", "rejected", "paid"],
      default: "pending",
    },

    // Client Submission (after signing)
    clientSubmission: {
      signature: String, // URL to saved signature image
      nationalIdFront: String,
      nationalIdBack: String,
      paymentProof: String,
      submittedAt: Date,
    },

    // Admin Approval
    adminApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      assignedWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      assignedDepartment: String,
    },

    // Rejection Info
    rejectionReason: String,
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Dates
    expiryDate: Date,
    notes: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Quotation", quotationSchema);
```

---

### User Model (Updated)

**File:** `wgtech-backend/model/userModel.js` - Add to existing schema:

```javascript
// Add these fields to the user schema:

assignedClients: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
],

assignedDepartment: String, // e.g., "development", "design", "marketing"
```

---

## 🎮 Controllers

### Clients Controller

**File:** `wgtech-backend/controllers/clientsController.js`

```javascript
const Client = require("../model/clientModel");
const User = require("../model/userModel");

// Get all clients with role-based filtering
exports.getClients = async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    let query = {};

    // Role-based filtering
    if (user.role === "worker") {
      // Workers only see clients assigned to them
      query.assignedWorker = user._id;
    } else if (user.role === "client") {
      // Clients cannot access this endpoint
      return res.status(403).json({
        success: false,
        message: "Clients cannot access this endpoint",
      });
    }
    // Main Admin sees all clients (empty query)

    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const clients = await Client.find(query)
      .populate("assignedWorker", "fullname email")
      .populate("userId", "email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Client.countDocuments(query);

    res.json({
      success: true,
      data: clients,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single client
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId)
      .populate("assignedWorker", "fullname email")
      .populate("userId", "email");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update client details
exports.updateClient = async (req, res) => {
  try {
    const { status, progressUpdate, notes } = req.body;

    const client = await Client.findByIdAndUpdate(
      req.params.clientId,
      {
        status,
        progressUpdate,
        notes,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Client updated successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Assign worker to client
exports.assignWorker = async (req, res) => {
  try {
    // Verify Main Admin
    if (req.user.designation?.title !== "Main Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Main Admin can assign workers",
      });
    }

    const { workerId, department } = req.body;

    // Verify worker exists
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // Update client
    const client = await Client.findByIdAndUpdate(
      req.params.clientId,
      {
        assignedWorker: workerId,
        assignedDepartment: department,
      },
      { new: true },
    ).populate("assignedWorker", "fullname email");

    // Update worker's assigned clients
    await User.findByIdAndUpdate(
      workerId,
      {
        $addToSet: { assignedClients: client._id },
        assignedDepartment: department,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Worker assigned successfully",
      data: {
        client,
        worker: {
          _id: workerId,
          fullname: worker.fullname,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload progress media
exports.uploadProgressMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const mediaUrl = `/uploads/progress/${req.file.filename}`;
    const mediaEntry = {
      type: req.body.type || "image",
      url: mediaUrl,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
    };

    const client = await Client.findByIdAndUpdate(
      req.params.clientId,
      {
        $push: { progressMedia: mediaEntry },
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Media uploaded successfully",
      data: mediaEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text, visibility } = req.body;

    const comment = {
      authorId: req.user._id,
      authorName: req.user.fullname,
      text,
      timestamp: new Date(),
      visibility: visibility || "all",
    };

    const client = await Client.findByIdAndUpdate(
      req.params.clientId,
      {
        $push: { comments: comment },
      },
      { new: true },
    );

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

---

### Quotations Controller

**File:** `wgtech-backend/controllers/quotationsController.js`

```javascript
const Quotation = require("../model/quotationModel");
const Client = require("../model/clientModel");
const User = require("../model/userModel");
const fs = require("fs");
const path = require("path");

// Get all quotations (role-based)
exports.getQuotations = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === "client") {
      // Clients see only their quotations
      const client = await Client.findOne({ userId: user._id });
      if (!client) {
        return res.json({
          success: true,
          data: [],
        });
      }
      query.clientId = client._id;
    } else if (user.role === "worker") {
      // Workers cannot access this endpoint
      return res.status(403).json({
        success: false,
        message: "Workers cannot access quotations",
      });
    }
    // Main Admin sees all (empty query)

    const quotations = await Quotation.find(query)
      .populate("clientId", "name email")
      .populate("mainAdminId", "fullname")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create quotation
exports.createQuotation = async (req, res) => {
  try {
    // Verify Main Admin
    if (req.user.designation?.title !== "Main Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Main Admin can create quotations",
      });
    }

    const { clientId, items, description, notes } = req.body;

    // Calculate total and advance
    const totalAmount = items.reduce(
      (sum, item) => sum + item.qty * item.rate,
      0,
    );
    const advanceRequired = totalAmount * 0.5;

    const quotation = new Quotation({
      clientId,
      mainAdminId: req.user._id,
      quotationDetails: {
        items,
        totalAmount,
        advanceRequired,
        description,
      },
      notes,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await quotation.save();

    res.json({
      success: true,
      message: "Quotation created successfully",
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Submit signed quotation (client)
exports.submitSignedQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.quotationId);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    // Verify client owns this quotation
    const client = await Client.findById(quotation.clientId);
    if (client.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Save signature from data URL
    let signatureUrl = null;
    if (req.body.signature) {
      const signatureData = req.body.signature.replace(
        /^data:image\/png;base64,/,
        "",
      );
      const filename = `signature_${quotation._id}_${Date.now()}.png`;
      const filepath = path.join(__dirname, "../uploads/signatures", filename);

      fs.writeFileSync(filepath, Buffer.from(signatureData, "base64"));
      signatureUrl = `/uploads/signatures/${filename}`;
    }

    // Update quotation with submission
    quotation.clientSubmission = {
      signature: signatureUrl,
      nationalIdFront: req.files?.nationalIdFront
        ? `/uploads/documents/${req.files.nationalIdFront[0].filename}`
        : null,
      nationalIdBack: req.files?.nationalIdBack
        ? `/uploads/documents/${req.files.nationalIdBack[0].filename}`
        : null,
      paymentProof: req.files?.paymentProof
        ? `/uploads/documents/${req.files.paymentProof[0].filename}`
        : null,
      submittedAt: new Date(),
    };
    quotation.status = "signed";

    await quotation.save();

    // Send notification to Main Admin (implement your notification logic)
    // await sendNotification(quotation.mainAdminId, "Quotation signed by client...");

    res.json({
      success: true,
      message: "Quotation submitted successfully",
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve quotation and assign worker
exports.approveQuotation = async (req, res) => {
  try {
    // Verify Main Admin
    if (req.user.designation?.title !== "Main Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Main Admin can approve quotations",
      });
    }

    const { workerId, department, notes } = req.body;
    const quotation = await Quotation.findById(req.params.quotationId);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (quotation.status !== "signed") {
      return res.status(400).json({
        success: false,
        message: "Quotation must be signed before approval",
      });
    }

    // Update quotation
    quotation.status = "approved";
    quotation.adminApproval = {
      approvedBy: req.user._id,
      approvedAt: new Date(),
      assignedWorker: workerId,
      assignedDepartment: department,
    };
    await quotation.save();

    // Update client with worker assignment
    const client = await Client.findByIdAndUpdate(
      quotation.clientId,
      {
        assignedWorker: workerId,
        assignedDepartment: department,
      },
      { new: true },
    );

    // Add client to worker's assigned clients
    await User.findByIdAndUpdate(workerId, {
      $addToSet: { assignedClients: client._id },
      assignedDepartment: department,
    });

    res.json({
      success: true,
      message: "Quotation approved and worker assigned",
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reject quotation
exports.rejectQuotation = async (req, res) => {
  try {
    // Verify Main Admin
    if (req.user.designation?.title !== "Main Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Main Admin can reject quotations",
      });
    }

    const { reason } = req.body;
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.quotationId,
      {
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedBy: req.user._id,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Quotation rejected",
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send quotation to client
exports.sendQuotation = async (req, res) => {
  try {
    // Verify Main Admin
    if (req.user.designation?.title !== "Main Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Main Admin can send quotations",
      });
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.quotationId,
      { status: "sent" },
      { new: true },
    );

    // Generate access token and send email (implement email service)
    const accessToken = require("crypto").randomBytes(32).toString("hex");
    // sendEmailToClient(quotation.clientId, accessToken);

    res.json({
      success: true,
      message: "Quotation sent to client",
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

---

## 📍 Routes

**File:** `wgtech-backend/routes/clientsRoutes.js`

```javascript
const express = require("express");
const router = express.Router();
const clientsController = require("../controllers/clientsController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

// Multer configuration
const upload = multer({ dest: "uploads/progress" });

// Clients routes
router.get("/", auth, clientsController.getClients);
router.get("/:clientId", auth, clientsController.getClientById);
router.put("/:clientId", auth, clientsController.updateClient);
router.put("/:clientId/assign-worker", auth, clientsController.assignWorker);
router.post(
  "/:clientId/media",
  auth,
  upload.single("file"),
  clientsController.uploadProgressMedia,
);
router.post("/:clientId/comments", auth, clientsController.addComment);

module.exports = router;
```

**File:** `wgtech-backend/routes/quotationsRoutes.js`

```javascript
const express = require("express");
const router = express.Router();
const quotationsController = require("../controllers/quotationsController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

// Multer for multiple files
const upload = multer({ dest: "uploads/documents" });

// Quotation routes
router.get("/", auth, quotationsController.getQuotations);
router.post("/", auth, quotationsController.createQuotation);
router.post(
  "/:quotationId/submit",
  auth,
  upload.fields([
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
    { name: "paymentProof", maxCount: 1 },
  ]),
  quotationsController.submitSignedQuotation,
);
router.put(
  "/:quotationId/approve",
  auth,
  quotationsController.approveQuotation,
);
router.put("/:quotationId/reject", auth, quotationsController.rejectQuotation);
router.post("/:quotationId/send", auth, quotationsController.sendQuotation);

module.exports = router;
```

---

## 🔐 Authentication Middleware (Updated)

**File:** `wgtech-backend/middleware/authMiddleware.js`

```javascript
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "No authentication token, access denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Token is not valid",
    });
  }
};

module.exports = auth;
```

---

## 🚀 App.js Integration

```javascript
// In wgtech-backend/app.js or server.js

const clientsRoutes = require("./routes/clientsRoutes");
const quotationsRoutes = require("./routes/quotationsRoutes");

// Add routes
app.use("/api/clients", clientsRoutes);
app.use("/api/quotations", quotationsRoutes);

// Make sure uploads directories exist
const fs = require("fs");
const dirs = ["uploads/progress", "uploads/documents", "uploads/signatures"];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
```

---

## 📝 .env Configuration

```
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your_jwt_secret_key

# File Upload
MAX_FILE_SIZE=10485760 # 10MB
UPLOAD_DIR=uploads

# Email (for quotation email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## ✅ Testing with Postman

### Create Client

```
POST /api/clients
Headers: Authorization: Bearer {token}

{
  "userId": "user_id",
  "name": "Acme Corp",
  "projectName": "Website Redesign",
  "budget": 15000
}
```

### Create Quotation

```
POST /api/quotations
Headers: Authorization: Bearer {token}

{
  "clientId": "client_id",
  "items": [
    {
      "name": "Web Design",
      "qty": 1,
      "rate": 5000,
      "description": "UI/UX design"
    }
  ],
  "description": "Website Redesign"
}
```

### Assign Worker

```
PUT /api/clients/{clientId}/assign-worker
Headers: Authorization: Bearer {token}

{
  "workerId": "worker_id",
  "department": "development"
}
```
