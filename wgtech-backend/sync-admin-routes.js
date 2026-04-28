const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.dev.env" });

const UserRole = require("./model/userRole");

const ADMIN_ROUTES = [
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
];

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in config.dev.env");
    }

    console.log("Connecting to database...");
    await mongoose.connect(process.env.DATABASE_URL);

    const role = await UserRole.findOne({ roleName: "admin" });
    if (!role) {
      throw new Error("Admin role not found");
    }

    role.routes = ADMIN_ROUTES;
    role.totalRoutes = ADMIN_ROUTES.length;
    await role.save();

    console.log(`Admin role updated. Routes: ${role.routes.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
})();
