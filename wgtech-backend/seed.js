const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: "./config.prod.env" });
} else {
  dotenv.config({ path: "./config.dev.env" });
}

const User = require("./model/userModel");
const Chat = require("./model/chatModel");
const Message = require("./model/messageModel");
const UserRole = require("./model/userRole");
const Client = require("./model/clientModel");
const Quotation = require("./model/quotationModel");

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL, {
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ MongoDB connected");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await UserRole.deleteMany({});
    await Client.deleteMany({});
    await Quotation.deleteMany({});

    // Create admin role
    console.log("👔 Creating admin role...");
    const adminRole = await UserRole.create({
      roleName: "admin",
      totalRoutes: 20,
      routes: [
        {
          order: 1,
          title: "Dashboard",
          path: "/",
          permissions: [
            { isCandlestickChart: true },
            { isTop5Projects: true },
            { isViewAllProjects: true },
            { isTop5Services: true },
            { isViewAllServices: true },
            { isUpcomingEvents: true },
            { isViewAllUpcomingEvents: true },
          ],
        },
        {
          order: 1.5,
          title: "Chat",
          path: "/chat",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 2,
          title: "Services",
          path: "/services",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 3,
          title: "Sub Services",
          path: "/sub-services",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 4,
          title: "Work",
          path: "/work",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 5,
          title: "About Us",
          path: "/about-us",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 6,
          title: "Our Story",
          path: "/our-story",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 7,
          title: "Advertisement",
          path: "/advertisement",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 8,
          title: "Reviews",
          path: "/reviews",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 9,
          title: "FAQ",
          path: "/faq",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 10,
          title: "Gallery",
          path: "/gallery",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 11,
          title: "Our Team",
          path: "/our-team",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 13,
          title: "Opportunities",
          path: "/opportunities",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 14,
          title: "Working Field",
          path: "/working-field",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 14.5,
          title: "Sign Your Quotation",
          path: "/sign-quotation",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 16,
          title: "Proposals",
          path: "/proposals",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 19,
          title: "Applied Form",
          path: "/applied-form",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
        {
          order: 20,
          title: "Settings",
          path: "/settings",
          permissions: [
            { isDelete: true },
            { isView: true },
            { isCreate: true },
            { isEdit: true },
          ],
        },
      ],
      status: true,
    });

    console.log("✅ Admin role created:", adminRole._id);

    // Create client role
    console.log("👔 Creating client role...");
    const clientRole = await UserRole.create({
      roleName: "client",
      totalRoutes: 0,
      routes: [],
      status: true,
    });

    console.log("✅ Client role created:", clientRole._id);

    // Clear existing data
    console.log("🗑️  Clearing existing users data...");
    await User.deleteMany({});

    // Create admin user
    console.log("👤 Creating admin user...");
    const admin = await User.create({
      username: "admin",
      email: "admin@wgtech.com",
      password: "Admin@123456",
      fullname: "Admin User",
      designation: adminRole._id,
      profileImage:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    });

    console.log("✅ Admin created:", admin.email);

    // Create test clients
    console.log("👤 Creating test clients...");
    
    // Create client user 1
    const clientUser1 = await User.create({
      username: "testclient",
      email: "client@example.com",
      password: "Client@123456",
      fullname: "Test Client",
      designation: clientRole._id,
      role: "client",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    });
    
    // Create client record in Client collection
    const client1 = await Client.create({
      userId: clientUser1._id,
      name: "Test Client",
      email: "client@example.com",
      phone: "+92-300-1234567",
      company: "Acme Corporation",
      address: "123 Business Street, Karachi, Pakistan",
      projectName: "Website Redesign Project",
      budget: 150000,
      description: "Complete website redesign with modern technology stack",
      status: "Not Started",
    });

    console.log("✅ Client 1 created:", client1.email);

    // Create client user 2
    const clientUser2 = await User.create({
      username: "techclient",
      email: "tech@moderntech.com",
      password: "Client@123456",
      fullname: "Modern Tech Inc",
      designation: clientRole._id,
      role: "client",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    });
    
    // Create client record in Client collection
    const client2 = await Client.create({
      userId: clientUser2._id,
      name: "Modern Tech Inc",
      email: "tech@moderntech.com",
      phone: "+92-300-9876543",
      company: "Modern Tech Inc",
      address: "456 Tech Avenue, Lahore, Pakistan",
      projectName: "Mobile App Development",
      budget: 300000,
      description: "iOS and Android mobile application development",
      status: "Not Started",
    });

    // Create client user 3
    const clientUser3 = await User.create({
      username: "retailclient",
      email: "info@retailplus.pk",
      password: "Client@123456",
      fullname: "Retail Plus Solutions",
      designation: clientRole._id,
      role: "client",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    });
    
    // Create client record in Client collection
    const client3 = await Client.create({
      userId: clientUser3._id,
      name: "Retail Plus Solutions",
      email: "info@retailplus.pk",
      phone: "+92-300-5555555",
      company: "Retail Plus Solutions",
      address: "789 Commerce Way, Islamabad, Pakistan",
      projectName: "E-Commerce Platform",
      budget: 250000,
      description: "Full-featured e-commerce platform with inventory management",
      status: "Not Started",
    });

    console.log("✅ All 3 clients created successfully");

    // Create worker role
    console.log("👷 Creating worker role...");
    const workerRole = await UserRole.create({
      roleName: "worker",
      totalRoutes: 2,
      routes: [
        {
          order: 1,
          title: "My Projects",
          path: "/my-projects",
          permissions: [{ isView: true }],
        },
        {
          order: 2,
          title: "Chat",
          path: "/chat",
          permissions: [{ isView: true }],
        },
      ],
    });
    console.log("✅ Worker role created");

    // Create test workers
    console.log("👷 Creating test workers...");
    const worker1 = await User.create({
      username: "johndere",
      email: "john.developer@wgtech.com",
      password: "Worker@123456",
      fullname: "John Derek - Developer",
      designation: workerRole._id,
      profileImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    });

    const worker2 = await User.create({
      username: "janesmith",
      email: "jane.designer@wgtech.com",
      password: "Worker@123456",
      fullname: "Jane Smith - UI/UX Designer",
      designation: workerRole._id,
      profileImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    });

    const worker3 = await User.create({
      username: "mikeqa",
      email: "mike.qa@wgtech.com",
      password: "Worker@123456",
      fullname: "Mike Johnson - QA Engineer",
      designation: workerRole._id,
      profileImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    });

    console.log("✅ Workers created");

    // Log all created clients (now in User model with role: "client")
    const allClients = await User.find({ role: "client" });
    console.log("\n📊 DATABASE CHECK - Total Clients created:", allClients.length);
    allClients.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.fullname} (${c.email}) - Project: ${c.projectName}`);
    });
    console.log("\n");

    // Create test quotations (using client records from Client collection)
    console.log("📋 Creating quotations...");
    const quotation1 = await Quotation.create({
      clientId: client1._id,
      mainAdminId: admin._id,
      quotationDetails: {
        items: [
          { name: "UI/UX Design", qty: 1, rate: 50000, description: "Modern design" },
          { name: "Frontend Development", qty: 1, rate: 60000, description: "React/Next.js" },
          { name: "Backend Development", qty: 1, rate: 70000, description: "Node.js API" },
          { name: "Testing & QA", qty: 1, rate: 20000, description: "QA testing" },
        ],
        totalAmount: 200000,
        advanceRequired: 100000,
        description: "Complete website redesign with modern technology stack",
        currency: "PKR",
      },
      status: "pending",
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      notes: "High priority project - client wants it completed in 2 months",
    });

    console.log("✅ Quotation 1 created (pending)");

    // Create another quotation for testing different statuses
    const quotation2 = await Quotation.create({
      clientId: client1._id,
      mainAdminId: admin._id,
      quotationDetails: {
        items: [
          { name: "Mobile App Development", qty: 1, rate: 150000, description: "iOS + Android" },
        ],
        totalAmount: 150000,
        advanceRequired: 75000,
        description: "iOS and Android mobile application",
        currency: "PKR",
      },
      status: "sent",
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    });

    console.log("✅ Quotation 2 created (sent status)");

    // Create quotations for other clients
    const quotation3 = await Quotation.create({
      clientId: client2._id,
      mainAdminId: admin._id,
      quotationDetails: {
        items: [
          { name: "App Architecture Design", qty: 1, rate: 100000, description: "System design" },
          { name: "iOS Development", qty: 1, rate: 120000, description: "Native iOS" },
          { name: "Android Development", qty: 1, rate: 120000, description: "Native Android" },
        ],
        totalAmount: 340000,
        advanceRequired: 170000,
        description: "iOS and Android mobile application",
        currency: "PKR",
      },
      status: "pending",
      expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    });

    const quotation4 = await Quotation.create({
      clientId: client3._id,
      mainAdminId: admin._id,
      quotationDetails: {
        items: [
          { name: "E-Commerce Platform Setup", qty: 1, rate: 80000, description: "Platform setup" },
          { name: "Product Management System", qty: 1, rate: 60000, description: "Admin panel" },
          { name: "Payment Integration", qty: 1, rate: 50000, description: "Payment gateway" },
        ],
        totalAmount: 190000,
        advanceRequired: 95000,
        description: "E-Commerce platform with inventory management",
        currency: "PKR",
      },
      status: "sent",
      expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    });

    console.log("✅ All quotations created");

    // Create chat
    console.log("💬 Creating test chat...");
    const chat = await Chat.create({
      participants: [admin._id, clientUser1._id],
      chatType: "website",
      clientId: clientUser1._id,
      assignedAdmin: admin._id,
      unreadCount: new Map(),
    });

    console.log("✅ Chat created:", chat._id);

    // Create test messages
    console.log("📨 Creating test messages...");
    const messages = await Message.insertMany([
      {
        chatId: chat._id,
        senderId: clientUser1._id,
        messageType: "text",
        content: "Hello! I have a question about your services.",
        readBy: [
          { userId: clientUser1._id, readAt: new Date() },
          { userId: admin._id, readAt: new Date() },
        ],
      },
      {
        chatId: chat._id,
        senderId: admin._id,
        messageType: "text",
        content:
          "Hi! Sure, I'd be happy to help. What would you like to know?",
        readBy: [{ userId: admin._id, readAt: new Date() }],
      },
      {
        chatId: chat._id,
        senderId: clientUser1._id,
        messageType: "text",
        content: "Can you tell me about your software development services?",
        readBy: [
          { userId: clientUser1._id, readAt: new Date() },
          { userId: admin._id, readAt: new Date() },
        ],
      },
      {
        chatId: chat._id,
        senderId: admin._id,
        messageType: "text",
        content:
          "Absolutely! We offer custom software development, web applications, mobile apps, and more.",
        readBy: [{ userId: admin._id, readAt: new Date() }],
      },
    ]);

    console.log("✅ Messages created:", messages.length);

    // Update chat with last message
    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: messages[messages.length - 1]._id,
      lastMessageTime: new Date(),
    });

    console.log("✅ Chat updated with last message");

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📋 Test Credentials:");
    console.log("   Admin:");
    console.log("   - Email: admin@wgtech.com");
    console.log("   - Password: Admin@123456");
    console.log("\n   Client:");
    console.log("   - Email: client@example.com");
    console.log("   - Password: Client@123456");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
};

seedDatabase();
