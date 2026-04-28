# Client Dashboard Implementation Guide

## ✅ What's Been Implemented

### 1. **Dashboard Layout** (`/dashboard/layout.tsx`)

A responsive sidebar-based layout featuring:

- **Desktop Sidebar**: Fixed navigation with menu items
- **Mobile Responsive**: Collapsible sidebar with hamburger menu
- **Top Bar**: Mobile header with sidebar toggle
- **User Info Section**: Displays logged-in user's name, email, and profile picture
- **Logout Button**: Quick access to sign out

### 2. **Main Dashboard Page** (`/dashboard/page.tsx`)

Welcome dashboard with:

- **Welcome Card**: Personalized greeting
- **Stats Grid**: Quick overview of active chats, proposals, completed, and pending items
- **Quick Actions**: Links to Chat, Profile, Proposals, and Settings
- **Recent Activity**: Timeline of recent events

### 3. **Chat with Admin** (`/dashboard/chat/page.tsx`)

Real-time communication interface:

- **Chat List**: Sidebar showing all active conversations
- **Message Area**: Display messages with timestamps
- **Message Input**: Send new messages to admin
- **Status Indicators**: Know who sent each message
- **Auto-scroll**: Latest messages visible automatically

### 4. **My Proposals** (`/dashboard/proposals/page.tsx`)

Proposal management interface:

- **Filter Options**: View by status (all, pending, approved, rejected, completed)
- **Proposal Cards**: Display title, description, budget, timeline
- **Status Badges**: Color-coded status indicators
- **Submission Dates**: Track when proposals were submitted
- **Last Update Info**: See when proposals were last updated

### 5. **Settings Page** (`/dashboard/settings/page.tsx`)

Account management with:

- **Notification Preferences**: Control email, chat, and weekly reports
- **Security Settings**: Two-factor authentication option
- **Change Password**: Update account password (hook provided)
- **Delete Account**: Irreversible account deletion option

### 6. **Updated Navigation Bar**

Changes to navbar.tsx:

- **Dashboard Link**: Shows `📊 Dashboard` when user is logged in
- **Desktop Navigation**: Appears between main nav and Contact Us
- **Mobile Navigation**: Added to mobile menu
- **Active State**: Highlights current page
- **Profile Dropdown**: Includes Dashboard and My Account options

---

## 🔧 How to Connect to Backend APIs

### Chat API Integration

Replace mock data in `/dashboard/chat/page.tsx`:

```typescript
// Replace the fetchChats function with:
const fetchChats = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chats?chatType=website`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await response.json();
    setChats(data);
  } catch (error) {
    console.error("Error fetching chats:", error);
  }
};

// Replace fetchMessages function with:
const fetchMessages = async (chatId: string) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chats/${chatId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await response.json();
    setMessages(data.messages || []);
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
};
```

### Proposals API Integration

Update `/dashboard/proposals/page.tsx`:

```typescript
const fetchProposals = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/proposals`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await response.json();
    setProposals(data);
  } catch (error) {
    console.error("Error fetching proposals:", error);
  }
};
```

### Sending Messages

In `/dashboard/chat/page.tsx` `handleSendMessage` function:

```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim() || !selectedChat) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chats/${selectedChat._id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newMessage }),
      },
    );

    if (response.ok) {
      const savedMessage = await response.json();
      setMessages([...messages, savedMessage]);
      setNewMessage("");
      scrollToBottom();
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
```

---

## 📋 Backend Endpoints Needed

Based on your backend structure, ensure these endpoints exist:

### Chat Endpoints

- `GET /api/chats?chatType=website` - Get all client chats
- `GET /api/chats/:chatId` - Get specific chat with messages
- `POST /api/chats/:chatId/messages` - Send a new message
- `PUT /api/chats/:chatId/messages/:messageId/read` - Mark messages as read

### Proposals Endpoints

- `GET /api/proposals` - Get all user's proposals
- `GET /api/proposals/:id` - Get specific proposal details
- `POST /api/proposals` - Submit new proposal

### User/Profile Endpoints

- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password
- `PUT /api/users/settings` - Update user settings

---

## 🎨 Customization Options

### Theme Colors

- **Primary Green**: `#9EFF00` (used throughout)
- **Dark Background**: `#000000` (main bg)
- **Secondary Dark**: `#111111` and `#1a1a1a`
- **Border Color**: `#333333`

### Sidebar Menu Items (`/dashboard/layout.tsx`)

Easily add/remove menu items by modifying the `menuItems` array:

```typescript
const menuItems = [
  // Add new items here
  {
    icon: "📊",
    label: "Dashboard",
    href: "/dashboard",
    active: pathname === "/dashboard",
  },
  // ...
];
```

---

## 🔐 Authentication & Protection

The dashboard routes are protected by:

1. **Token Check**: Each page checks for valid token in localStorage
2. **Redirect**: Unauthenticated users redirected to `/wgAuthForm`
3. **Auth Store**: Uses Zustand `useAuthStore` for user state

The navbar automatically shows/hides Dashboard link based on `user` state.

---

## 📱 Responsive Design

All pages are mobile-first responsive:

- **Mobile**: Full-width with collapsible sidebar
- **Tablet**: Responsive grid layouts
- **Desktop**: Expanded sidebar + full content area

---

## ⚙️ Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8003
# or your actual backend URL
```

---

## 🚀 Next Steps

1. **Connect APIs**: Replace mock data with actual backend API calls
2. **Real-time Chat**: Consider adding Socket.io for real-time messages
3. **Notifications**: Implement toast notifications for new messages
4. **File Upload**: Add profile picture and document uploads
5. **Role-based Access**: Use the new `designation` field in auth store to restrict features based on user role

---

## 📁 File Structure

```
wg-tech-sol/src/app/
├── dashboard/
│   ├── layout.tsx          # Sidebar layout
│   ├── page.tsx            # Main dashboard
│   ├── chat/
│   │   └── page.tsx        # Chat with admin
│   ├── proposals/
│   │   └── page.tsx        # My proposals
│   ├── profile/
│   │   └── page.tsx        # (existing profile)
│   └── settings/
│       └── page.tsx        # Settings
└── components/
    └── navbar.tsx          # Updated with dashboard link
```

---

## 📝 Notes

- All pages use mock data currently - connect to backend APIs
- Chat interface supports both single and group conversations
- Proposals page includes budget and timeline tracking
- Settings page has placeholder functions for password change and account deletion
