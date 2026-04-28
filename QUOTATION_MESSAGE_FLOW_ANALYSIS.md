# Quotation Message Sending Flow - Complete Analysis

## Executive Summary

The quotation message flow has a **CRITICAL ISSUE**: The `quotationData` object is being sent via socket but **NOT being stored** in the database because the Message schema doesn't have a `quotationData` field defined.

---

## 1. FRONTEND FLOW (wg-tech-admin)

### A. Entry Point: QuotationDialog.jsx

**File**: [src/components/Chat/QuotationDialog.jsx](src/components/Chat/QuotationDialog.jsx#L36)

```javascript
const QuotationDialog = ({ open, onClose, clientId, onQuotationSent }) => {
```

**Handler**: `handleSubmit()` (Lines 160-254)

```javascript
const handleSubmit = async () => {
  console.log("🔵 Submit button clicked");
  console.log("Form data:", formData);

  if (!validateForm()) {
    console.error("❌ Form validation failed");
    enqueueSnackbar("Please fix the errors in the form", { variant: "error" });
    return;
  }

  console.log("✅ Form validation passed");
  setLoading(true);
  try {
    console.log("📤 Creating quotation with clientId:", clientId);

    // STEP 1: Create quotation via REST API
    const response = await axios.post(
      `/api/v1/quotations`,
      {
        clientId,
        quotationDetails: {
          items: formData.items,
          totalAmount: formData.totalAmount,
          advanceRequired: formData.advanceRequired,
          description: formData.longDescription,
          currency: formData.currency,
        },
        title: formData.title,
        subTitle: formData.subTitle,
        shortDescription: formData.shortDescription,
        image: formData.image,
        postedOn: formData.postedOn,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    console.log("✅ Quotation created:", response.data);

    // STEP 2: Send quotation via REST API
    const sendResponse = await axios.post(
      `/api/v1/quotations/${response.data._id}/send`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    console.log("✅ Quotation sent:", sendResponse.data);

    // STEP 3: Prepare quotation data to pass up via callback
    const quotationDataToPassed = {
      ...response.data,
      title: formData.title,
      subTitle: formData.subTitle,
      shortDescription: formData.shortDescription,
      image: formData.image,
      postedOn: formData.postedOn,
      totalAmount: formData.totalAmount,
      advanceRequired: formData.advanceRequired,
      currency: formData.currency,
    };

    console.log(
      "📋 Passing quotation data to callback:",
      quotationDataToPassed,
    );

    enqueueSnackbar("Quotation sent successfully!", { variant: "success" });
    onQuotationSent?.(quotationDataToPassed); // ← CALLBACK TO PARENT
    onClose();
  } catch (error) {
    console.error("❌ Error sending quotation:", error);
    enqueueSnackbar(
      error.response?.data?.message || "Failed to send quotation",
      { variant: "error" },
    );
  } finally {
    setLoading(false);
  }
};
```

**Console Logs in QuotationDialog:**

- `🔵 Submit button clicked`
- `Form data: {...}`
- `✅ Validation errors: {...}` (if validation fails)
- `✅ Form validation passed` (if validation succeeds)
- `📤 Creating quotation with clientId: {clientId}`
- `✅ Quotation created: {...}` (REST API response)
- `✅ Quotation sent: {...}` (REST API send response)
- `📋 Passing quotation data to callback: {...}`
- `❌ Error sending quotation: {...}` (if error occurs)

---

### B. Parent Component: ChatWindow.jsx

**File**: [src/components/Chat/ChatWindow.jsx](src/components/Chat/ChatWindow.jsx#L275)

**Quotation Dialog Callback** (Lines 275-284):

```javascript
<QuotationDialog
  open={showQuotationDialog}
  onClose={() => setShowQuotationDialog(false)}
  clientId={chat.clientId?._id}
  onQuotationSent={(quotationData) => {
    setShowQuotationDialog(false);
    // Send quotation message to chat
    onSendMessage({
      messageType: "quotation",
      content: `Quotation: ${quotationData?.title || "New Quotation"}`,
      quotationData: quotationData, // ⚠️ ISSUE: This is sent but not stored!
    });
  }}
/>
```

**Data Structure Sent to Parent:**

```javascript
{
  messageType: "quotation",
  content: "Quotation: [title]",
  quotationData: {
    _id: "...",
    title: "...",
    subTitle: "...",
    shortDescription: "...",
    image: "...",
    postedOn: "...",
    totalAmount: number,
    advanceRequired: number,
    currency: "PKR",
    // ... plus all fields from response.data
  }
}
```

**handleSendMessage in ChatWindow** (Lines 94-105):

```javascript
const handleSendMessage = (e) => {
  e.preventDefault();
  if (!messageText.trim()) return;

  onSendMessage({
    messageType: "text",
    content: messageText,
  });

  setMessageText("");
  setIsTyping(false);
};
```

**Note**: This only handles text messages. Quotation messages come from the callback above.

---

### C. ChatContainer.jsx - Socket Emit

**File**: [src/components/Chat/ChatContainer.jsx](src/components/Chat/ChatContainer.jsx#L317)

**handleSendMessage Function** (Lines 317-343):

```javascript
const handleSendMessage = (messageData) => {
  if (!selectedChat || !userId) {
    console.error("Cannot send message: missing chat or user", {
      selectedChat: selectedChat ? selectedChat._id : "missing",
      userId: userId || "missing",
    });
    return;
  }

  if (!socketRef.current?.connected) {
    console.error("Socket not connected, cannot send message");
    alert("Chat connection lost. Please refresh the page.");
    return;
  }

  const payload = {
    ...messageData, // Spreads messageData (includes quotationData)
    chatId: selectedChat._id,
    senderId: userId,
  };

  console.log("📤 Sending message from admin:", payload);
  socketRef.current.emit("send_message", payload, (response) => {
    console.log("📨 Admin message sent response:", response);
  });
};
```

### EXACT SOCKET EMIT FOR QUOTATION:

```javascript
socketRef.current.emit("send_message", {
  messageType: "quotation",
  content: "Quotation: [title]",
  quotationData: {
    _id: "...",
    title: "...",
    subTitle: "...",
    shortDescription: "...",
    image: "...",
    postedOn: "...",
    totalAmount: number,
    advanceRequired: number,
    currency: "PKR",
    // ... additional fields
  },
  chatId: "[chat_id]",
  senderId: "[user_id]",
});
```

**Console Logs:**

- `📤 Sending message from admin: {payload}` - Shows complete payload including quotationData
- `📨 Admin message sent response: {response}` - Shows backend acknowledgement

**Socket Connection Details** (Lines 28-36):

```javascript
socketRef.current = io(
  import.meta.env.VITE_API_URL || "http://localhost:8003",
  {
    query: { userId },
    transports: ["websocket", "polling"],
    reconnect: true,
    reconnectDelay: 1000,
    reconnectDelayMax: 5000,
    reconnectAttempts: 5,
  },
);
```

---

## 2. BACKEND FLOW (wgtech-backend)

### A. Socket Server Handler

**File**: [utils/socketService.js](utils/socketService.js#L71)

**Backend Receives send_message Event** (Lines 71-167):

```javascript
socket.on("send_message", async (data) => {
  try {
    const {
      chatId,
      senderId,
      messageType,
      content,
      fileUrl,
      fileName,
      imageUrl,
      documentUrl,
      documentName,
      // ⚠️ CRITICAL: quotationData is NOT destructured or handled!
    } = data;

    console.log(
      "📨 Received message - ChatID:",
      chatId,
      "From:",
      senderId,
      "Content:",
      content,
    );

    // VALIDATION
    if (!chatId || !senderId || !content) {
      console.error("❌ Invalid message data:", data);
      socket.emit("message_error", { error: "Missing required fields" });
      return;
    }

    // SENDER VERIFICATION
    let senderType = "User";
    let sender = await User.findById(senderId);

    if (!sender) {
      sender = await Client.findById(senderId);
      if (sender) {
        senderType = "Client";
      } else {
        console.error(
          "❌ Sender not found in either User or Client collection:",
          senderId,
        );
        socket.emit("message_error", { error: "Sender not found" });
        return;
      }
    }

    // SAVE MESSAGE - ⚠️ ISSUE: quotationData is NOT saved!
    const message = new Message({
      chatId,
      senderId,
      senderType,
      messageType: messageType || "text",
      content,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      imageUrl: imageUrl || null,
      documentUrl: documentUrl || null,
      documentName: documentName || null,
      // quotationData is MISSING here!
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    await message.save();
    console.log("✅ Message saved:", message._id, "senderType:", senderType);

    // UPDATE CHAT
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessage: message._id,
        lastMessageTime: new Date(),
      },
      { new: true },
    );

    // UPDATE UNREAD COUNT
    const otherParticipants = chat.participants.filter(
      (p) => p.toString() !== senderId.toString(),
    );

    otherParticipants.forEach((participantId) => {
      const current = chat.unreadCount.get(participantId.toString()) || 0;
      chat.unreadCount.set(participantId.toString(), current + 1);
    });

    await chat.save();

    // POPULATE MESSAGE WITH SENDER INFO
    let populatedMessage = message;
    if (senderType === "Client") {
      populatedMessage = await message.populate({
        path: "senderId",
        model: "Client",
        select: "_id username email profileImage",
      });
    } else {
      populatedMessage = await message.populate({
        path: "senderId",
        model: "User",
        select: "_id username email profileImage",
      });
    }

    console.log("📤 Broadcasting message to room: chat_" + chatId);

    // BROADCAST TO CHAT ROOM - ⚠️ ISSUE: quotationData is NOT included!
    io.to(`chat_${chatId}`).emit("message_received", {
      _id: populatedMessage._id,
      chatId,
      senderId: populatedMessage.senderId,
      senderType,
      messageType: messageType || "text",
      content,
      fileUrl,
      fileName,
      imageUrl,
      documentUrl,
      documentName,
      // quotationData is MISSING here!
      createdAt: populatedMessage.createdAt,
      readBy: populatedMessage.readBy,
    });

    // AUTO-REPLY
    if (chat.chatType === "website" && chat.assignedAdmin) {
      handleAutoReply(chat.assignedAdmin, chatId, content, io);
    }
  } catch (error) {
    console.error("❌ Error sending message:", error);
    socket.emit("message_error", { error: error.message });
  }
});
```

**Backend Console Logs:**

- `📨 Received message - ChatID: {...}` - Shows chatId, senderId, content
- `❌ Invalid message data: {...}` - If validation fails
- `✅ Message saved: {_id}, senderType: {...}`
- `❌ Chat not found: {...}` - If chat doesn't exist
- `✅ Chat updated: {...}`
- `📤 Broadcasting message to room: chat_[chatId]`
- `❌ Error sending message: {...}` - If error occurs

---

### B. Message Model (Database Schema)

**File**: [model/messageModel.js](model/messageModel.js#L1)

**MessageSchema Fields** (Lines 3-88):

```javascript
{
  chatId: ObjectId,
  senderId: ObjectId,
  senderType: String,  // "User" or "Client"
  messageType: String, // enum: ["text", "file", "image", "document", "call", "status_update"]
  content: String,
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  imageUrl: String,
  documentUrl: String,
  documentName: String,
  callDuration: Number,
  callType: String,    // "voice" or "video"
  callStatus: String,  // "initiated", "accepted", "rejected", "ended", "missed"
  statusUpdate: {
    projectId: ObjectId,
    oldStatus: String,
    newStatus: String,
    description: String,
  },
  editedAt: Date,
  editHistory: Array,
  readBy: Array,
  reactions: Array,
  deleted: Boolean,

  // ⚠️ CRITICAL MISSING: NO quotationData FIELD!
}
```

**ISSUE**: The schema does NOT have a `quotationData` field!

---

## 3. IDENTIFIED ISSUES

### CRITICAL ISSUES:

1. **❌ CRITICAL: quotationData Not Stored in Database**
   - Frontend sends `quotationData` in socket emit
   - Backend socket handler DOES NOT destructure `quotationData`
   - Message is saved WITHOUT quotation data
   - Database has no `quotationData` field in messageSchema
   - Result: **Quotation data is completely lost!**

2. **❌ CRITICAL: quotationData Not Broadcast Back to Clients**
   - Backend does NOT include `quotationData` in `message_received` emit
   - Clients receive message without quotation details
   - Result: **Frontend cannot display quotation details**

### MODERATE ISSUES:

3. **messageType "quotation" Not Validated**
   - Message schema enum only includes: ["text", "file", "image", "document", "call", "status_update"]
   - "quotation" messageType is INVALID according to schema
   - Backend will either reject or change it to "text"

4. **No Error Handling for Large quotationData**
   - quotationData object can be large
   - No validation of quotationData structure on backend
   - Could cause socket emit to fail silently

### MINOR ISSUES:

5. **No Console Log for quotationData Reception**
   - Backend doesn't log that quotationData was received
   - Hard to debug if quotation messages aren't working

---

## 4. DATA FLOW DIAGRAM

```
FRONTEND (ChatWindow/ChatContainer)
    ↓
QuotationDialog.onQuotationSent callback
    ├─ messageType: "quotation"
    ├─ content: "Quotation: [title]"
    └─ quotationData: {_id, title, items, amount, ...}  ← Contains data
    ↓
ChatContainer.handleSendMessage()
    ↓
socket.emit("send_message", {
    messageType: "quotation",
    content: "...",
    quotationData: {...},         ← quotationData sent here
    chatId, senderId
})
    ↓
BACKEND (socketService.js)
    ↓
socket.on("send_message", async (data) => {
    // ⚠️ PROBLEM: quotationData NOT destructured
    const { chatId, senderId, messageType, content, ... } = data;
    // quotationData is in data but ignored
    ↓
    new Message({
        chatId, senderId, messageType, content, ...
        // ⚠️ quotationData NOT included here
    })
    ↓
    IO.to.emit("message_received", {
        _id, chatId, senderId, messageType, content, ...
        // ⚠️ quotationData NOT included here
    })
})
    ↓
FRONTEND (ChatContainer - message_received handler)
    ↓
setMessages((prev) => [...prev, message])
    ↓
MessageList displays message WITHOUT quotationData ❌
```

---

## 5. RECOMMENDED FIXES

### Fix 1: Update Message Schema

Add `quotationData` field to messageModel.js:

```javascript
quotationData: {
  _id: mongoose.Schema.Types.ObjectId,
  title: String,
  subTitle: String,
  shortDescription: String,
  longDescription: String,
  image: String,
  postedOn: Date,
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
  }],
  totalAmount: Number,
  advanceRequired: Number,
  currency: String,
  quotationDetails: {
    description: String,
  },
  default: null,
}
```

### Fix 2: Update Backend Socket Handler

Modify socketService.js `send_message` handler:

```javascript
const {
  chatId,
  senderId,
  messageType,
  content,
  fileUrl,
  fileName,
  imageUrl,
  documentUrl,
  documentName,
  quotationData, // ← ADD THIS
} = data;

// After validation:
const message = new Message({
  chatId,
  senderId,
  senderType,
  messageType: messageType || "text",
  content,
  fileUrl: fileUrl || null,
  fileName: fileName || null,
  imageUrl: imageUrl || null,
  documentUrl: documentUrl || null,
  documentName: documentName || null,
  quotationData: quotationData || null, // ← ADD THIS
  readBy: [{ userId: senderId, readAt: new Date() }],
});

// In broadcast:
io.to(`chat_${chatId}`).emit("message_received", {
  _id: populatedMessage._id,
  chatId,
  senderId: populatedMessage.senderId,
  senderType,
  messageType: messageType || "text",
  content,
  fileUrl,
  fileName,
  imageUrl,
  documentUrl,
  documentName,
  quotationData: quotationData || null, // ← ADD THIS
  createdAt: populatedMessage.createdAt,
  readBy: populatedMessage.readBy,
});
```

### Fix 3: Update Message Schema Enum

Add "quotation" to valid messageType values:

```javascript
messageType: {
  type: String,
  enum: ["text", "file", "image", "document", "call", "status_update", "quotation", "system"],
  default: "text",
}
```

### Fix 4: Add Logging

Add console logs in backend for debugging:

```javascript
console.log(
  "📋 Quotation Data received:",
  quotationData ? "✅ Present" : "❌ Missing",
);
console.log(
  "📤 Broadcasting quotation message with data:",
  quotationData ? "✅" : "❌",
);
```

---

## 6. CURRENT FLOW SUMMARY

| Stage | Component           | Data Sent                                | Data Received           | Issue                    |
| ----- | ------------------- | ---------------------------------------- | ----------------------- | ------------------------ |
| 1     | QuotationDialog     | REST API creates quotation               | `quotationDataToPassed` | ✅ Works                 |
| 2     | ChatWindow callback | Calls `onSendMessage` with quotationData | Message object          | ✅ Works                 |
| 3     | ChatContainer       | Emits socket with quotationData          | Response callback       | ✅ Sent                  |
| 4     | Backend socket      | Receives data with quotationData         | Message saved           | ❌ quotationData ignored |
| 5     | Backend broadcast   | Emits without quotationData              | message_received        | ❌ quotationData lost    |
| 6     | Frontend receives   | Gets message without quotationData       | Messages state          | ❌ Data missing          |
| 7     | MessageList         | Cannot display quotation details         | Rendered message        | ❌ No data to show       |

---

## 7. SOCKET EMIT PACKET STRUCTURE

### What Frontend Sends:

```javascript
{
  messageType: "quotation",
  content: "Quotation: Project Proposal",
  quotationData: {
    _id: "507f1f77bcf86cd799439011",
    title: "Project Proposal",
    subTitle: "Website Development",
    shortDescription: "Professional website development",
    longDescription: "Detailed description of the project",
    image: "https://example.com/image.jpg",
    postedOn: "2026-03-29T00:00:00.000Z",
    items: [
      { description: "Frontend Development", quantity: 1, unitPrice: 50000 },
      { description: "Backend Development", quantity: 1, unitPrice: 30000 }
    ],
    totalAmount: 80000,
    advanceRequired: 40000,
    currency: "PKR",
    quotationDetails: {
      items: [...],
      totalAmount: 80000,
      advanceRequired: 40000,
      description: "...",
      currency: "PKR"
    }
  },
  chatId: "507f1f77bcf86cd799439012",
  senderId: "507f1f77bcf86cd799439013"
}
```

### What Backend Saves (Currently):

```javascript
// Only saves these from the packet, quotationData is dropped:
{
  chatId: "507f1f77bcf86cd799439012",
  senderId: "507f1f77bcf86cd799439013",
  senderType: "User",
  messageType: "quotation",  // ✅ Saved
  content: "Quotation: Project Proposal",  // ✅ Saved
  fileUrl: null,
  fileName: null,
  imageUrl: null,
  documentUrl: null,
  documentName: null,
  // ❌ quotationData: MISSING!
  readBy: [{userId: "...", readAt: "..."}],
  createdAt: "2026-03-29T12:00:00.000Z"
}
```

### What Backend Broadcasts (Currently):

```javascript
{
  _id: "507f1f77bcf86cd799439014",
  chatId: "507f1f77bcf86cd799439012",
  senderId: { _id, username, email, profileImage },
  senderType: "User",
  messageType: "quotation",  // ✅ Sent
  content: "Quotation: Project Proposal",  // ✅ Sent
  fileUrl: null,
  fileName: null,
  imageUrl: null,
  documentUrl: null,
  documentName: null,
  // ❌ quotationData: MISSING!
  createdAt: "2026-03-29T12:00:00.000Z",
  readBy: [...]
}
```

---

## 8. ERROR HANDLING ANALYSIS

### Frontend Error Handling:

✅ Good error handling with try-catch in QuotationDialog

- Catches REST API errors
- Shows snackbar notifications
- Logs detailed error messages
- Validates form before submission

### Backend Error Handling:

✅ Partial error handling

- Validates required fields (chatId, senderId, content)
- Checks sender exists
- Logs most operations

❌ Missing error handling:

- No validation of quotationData structure
- No handling if quotationData is very large
- No error if message fails to save
- No acknowledgment sent back on success

### Socket Error Events:

❌ Limited error communication

- `message_error` event for validation failures
- No success acknowledgment with message ID
- Callback in emit becomes acknowledgment (good practice)

---

## 9. CONSOLE LOG TRACING

### Frontend Expected Flow (Actual):

```
ChatWindow renders QuotationDialog
    ↓
User clicks "Send Quotation" button
    ↓ [ChatWindow.jsx]
    🔵 Submit button clicked
    Form data: {title, subtitle, ...}
    ✅ Validation errors: {} (empty = valid)
    ✅ Form validation passed
    📤 Creating quotation with clientId: [id]
    ✅ Quotation created: {_id, ...}
    ✅ Quotation sent: {status: "sent"}
    📋 Passing quotation data to callback: {...}
    ✅ Quotation sent successfully! (snackbar)
    ↓ [ChatContainer.jsx]
    📤 Sending message from admin: {type: quotation, content, quotationData, chatId, senderId}
    ↓ [Backend receives]
    ✅ Admin message sent response: {status: "ok"}
```

### Backend Expected Flow (Actual):

```
📨 Received message - ChatID: [id] From: [id] Content: Quotation: ...
✅ Message saved: [_id], senderType: User
✅ Chat updated: [id]
📤 Broadcasting message to room: chat_[id]
```

### Frontend After Backend Broadcast:

```
📨 Message received on admin: {type: quotation, content: "Quotation: ..."}
    ⚠️ PROBLEM: quotationData field is MISSING in message!
    ⚠️ Cannot display quotation details in UI!
```

---

## 10. IMPACT ASSESSMENT

### What Works:

- ✅ Quotation created via REST API
- ✅ Quotation sent via REST API
- ✅ Message message_type is "quotation"
- ✅ Message content includes quotation title
- ✅ Socket connection established and working
- ✅ Backend receives and saves message
- ✅ Backend broadcasts message to chat room

### What Doesn't Work:

- ❌ Quotation details (amount, items, etc.) not visible in chat
- ❌ Recipients cannot see quotation specifics
- ❌ Clients cannot sign quotation from chat message
- ❌ No way to link message back to original quotation
- ❌ quotationData object completely lost after sending

### User Experience Impact:

- Users see "Quotation: Project Title" message with no details
- Cannot click to view full quotation
- Cannot sign quotation directly from chat
- Need to navigate elsewhere to view quotation details
- Complete loss of quotation data after sending

---

## Summary Table

| Component           | Code         | Issue                                  | Severity | Fix             |
| ------------------- | ------------ | -------------------------------------- | -------- | --------------- |
| QuotationDialog.jsx | Line 230     | Callback works, quotationData passed   | None     | N/A             |
| ChatWindow.jsx      | Line 275-284 | onQuotationSent includes quotationData | None     | N/A             |
| ChatContainer.jsx   | Line 339     | socket.emit includes quotationData     | None     | N/A             |
| socketService.js    | Line 71      | quotationData not destructured         | CRITICAL | Add destructure |
| socketService.js    | Line 119     | quotationData not saved to Message     | CRITICAL | Add to schema   |
| socketService.js    | Line 156     | quotationData not broadcast            | CRITICAL | Add to emit     |
| messageModel.js     | Line 20      | No quotationData field                 | CRITICAL | Add field       |
| messageModel.js     | Line 14      | "quotation" not in enum                | MODERATE | Update enum     |
