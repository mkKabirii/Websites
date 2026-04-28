// Icons (Lucide React)
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  HelpCircle,
  Presentation,
  FileText,
  User,
  UserCircle,
  Settings2Icon,
  Image,
  Users,
  Briefcase,
  FileCheck,
  FolderOpen,
  BookOpen,
  Star,
  Layers,
  ClipboardList,
  Eye,
  Lock,
  Key,
  RefreshCw,
  Shield,
} from "lucide-react";
// ======================= AUTH =======================

import Login from "../app/auth/login";
import ServicesManagement from "../app/services";
import AdvertisementManagement from "../app/advertisement";
import ReviewsManagement from "../app/reviews";
import FAQManagement from "../app/faq";
import SubServicesManagement from "../app/subSearvices";
import WorkManagement from "../app/work";
import AboutUsManagement from "../app/aboutUs";
import OurStoryManagement from "../app/ourStory";
import RoleManagement from "../app/role";
import OurTeamManagement from "../app/ourTeam";
import OpportunitiesManagement from "../app/opportunities";
import AppliedFormsManagement from "../app/appliedFroms";
import Dashboard from "../app/dashboard";
import ProposalsManagement from "../app/proposals";
import ViewProposals from "../app/proposals/viewProposals";
import Settings from "../app/settings";
import Gallery from "../app/gallery";
import ProjectsProgressManagement from "../app/projectsProgressManagement";
import ProjectsProgressViewDetails from "../app/projectsProgressManagement/viewDetails";
import ProjectsUpdatesManagement from "../app/projectsUpdatesManagement";
import ChatPage from "../app/chat";
import WorkingField from "../app/workingField";
import TasksManagement from "../app/tasks";
import MyProjectsPage from "../app/my-projects";

const createDefaultPermissions = () => [
  { isDelete: false, label: "Delete" },
  { isView: false, label: "View" },
  { isCreate: false, label: "Create" },
  { isEdit: false, label: "Edit" },
];

// ======================= ADMIN =======================

const AUTH_ROUTES = [
  {
    id: 1,
    name: "Login",
    component: <Login />,
    exact: "exact",
    path: "login",
    activeIcon: <Key size={20} color="#fff" />,
    inActiveIcon: <Key size={20} color="#64748b" />,
  },
  // {
  //   id: 2,
  //   name: "Access Denied",
  //   component: <AccessDenied />,
  //   exact: "exact",
  //   path: "access-denied",
  //   activeIcon: <Shield size={20} color="#fff" />,
  //   inActiveIcon: <Shield size={20} color="#64748b" />,
  // },
  {
    id: 3,
    name: "Forgot Password",
    component: null,
    exact: "exact",
    path: "forgot-password",
    activeIcon: <RefreshCw size={20} color="#fff" />,
    inActiveIcon: <RefreshCw size={20} color="#64748b" />,
  },
  {
    id: 4,
    name: "OTP Verification",
    component: null,
    exact: "exact",
    path: "otp-verification",
    activeIcon: <Lock size={20} color="#fff" />,
    inActiveIcon: <Lock size={20} color="#64748b" />,
  },
  {
    id: 5,
    name: "Vendor OTP Verification",
    component: null,
    exact: "exact",
    path: "vendor-otp-verification",
    activeIcon: <Lock size={20} color="#fff" />,
    inActiveIcon: <Lock size={20} color="#64748b" />,
  },
  {
    id: 6,
    name: "Reset Password",
    component: null,
    exact: "exact",
    path: "set-new-password",
    activeIcon: <Key size={20} color="#fff" />,
    inActiveIcon: <Key size={20} color="#64748b" />,
  },
];

const ADMIN_ROUTES = [
  // ======================= DASHBOARD =======================
  {
    id: 1,
    name: "Dashboard",
    component: <Dashboard />,
    exact: "exact",
    path: "/",
    activeIcon: <LayoutDashboard size={20} color="#fff" />,
    inActiveIcon: <LayoutDashboard size={20} color="#64748b" />,
    permissions: [
      { isCandlestickChart: false, label: "Candlestick Chart" },
      { isTop5Projects: false, label: "Top 5 Projects" },
      { isViewAllProjects: false, label: "View All Projects" },
      { isTop5Services: false, label: "Top 5 Services" },
      { isViewAllServices: false, label: "View All Services" },
      { isUpcomingEvents: false, label: "Upcoming Events" },
      { isViewAllUpcomingEvents: false, label: "View All Upcoming Events" },
    ],
  },

  // ======================= CHAT =======================
  {
    id: 1.5,
    name: "Chat",
    component: <ChatPage />,
    exact: "exact",
    path: "/chat",
    activeIcon: <MessageSquare size={20} color="#fff" />,
    inActiveIcon: <MessageSquare size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 1.55,
    name: "Assigned Projects",
    component: <MyProjectsPage />,
    exact: "exact",
    path: "/my-projects",
    activeIcon: <FolderOpen size={20} color="#fff" />,
    inActiveIcon: <FolderOpen size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 1.6,
    name: "Working Field",
    component: <WorkingField />,
    exact: "exact",
    path: "/working-field",
    activeIcon: <Briefcase size={20} color="#fff" />,
    inActiveIcon: <Briefcase size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 1.7,
    name: "Tasks",
    component: <TasksManagement />,
    exact: "exact",
    path: "/tasks",
    activeIcon: <ClipboardList size={20} color="#fff" />,
    inActiveIcon: <ClipboardList size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },

  // ======================= CONTENT MANAGEMENT =======================
  {
    id: 2,
    name: "Services",
    component: <ServicesManagement />,
    exact: "exact",
    path: "/services",
    activeIcon: <Package size={20} color="#fff" />,
    inActiveIcon: <Package size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 3,
    name: "Sub Services",
    component: <SubServicesManagement />,
    exact: "exact",
    path: "/sub-services",
    activeIcon: <Layers size={20} color="#fff" />,
    inActiveIcon: <Layers size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 4,
    name: "Work",
    component: <WorkManagement />,
    exact: "exact",
    path: "/work",
    activeIcon: <Briefcase size={20} color="#fff" />,
    inActiveIcon: <Briefcase size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 5,
    name: "About Us",
    component: <AboutUsManagement />,
    exact: "exact",
    path: "/about-us",
    activeIcon: <BookOpen size={20} color="#fff" />,
    inActiveIcon: <BookOpen size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 6,
    name: "Our Story",
    component: <OurStoryManagement />,
    exact: "exact",
    path: "/our-story",
    activeIcon: <FileText size={20} color="#fff" />,
    inActiveIcon: <FileText size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 7,
    name: "Advertisement",
    component: <AdvertisementManagement />,
    exact: "exact",
    path: "/advertisement",
    activeIcon: <Megaphone size={20} color="#fff" />,
    inActiveIcon: <Megaphone size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 8,
    name: "Reviews",
    component: <ReviewsManagement />,
    exact: "exact",
    path: "/reviews",
    activeIcon: <Star size={20} color="#fff" />,
    inActiveIcon: <Star size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 9,
    name: "FAQ",
    component: <FAQManagement />,
    exact: "exact",
    path: "/faq",
    activeIcon: <HelpCircle size={20} color="#fff" />,
    inActiveIcon: <HelpCircle size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 10,
    name: "Gallery",
    component: <Gallery />,
    exact: "exact",
    path: "/gallery",
    activeIcon: <Image size={20} color="#fff" />,
    inActiveIcon: <Image size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },

  // ======================= USER MANAGEMENT =======================
  {
    id: 11,
    name: "Our Team",
    component: <OurTeamManagement />,
    exact: "exact",
    path: "/our-team",
    activeIcon: <Users size={20} color="#fff" />,
    inActiveIcon: <Users size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },

  // ======================= FORMS & PROPOSALS =======================
  {
    id: 13,
    name: "Opportunities",
    component: <OpportunitiesManagement />,
    exact: "exact",
    path: "/opportunities",
    activeIcon: <Briefcase size={20} color="#fff" />,
    inActiveIcon: <Briefcase size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 14,
    name: "Projects Progress",
    component: <ProjectsProgressManagement />,
    exact: "exact",
    path: "/projects-progress",
    activeIcon: <FolderOpen size={20} color="#fff" />,
    inActiveIcon: <FolderOpen size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 15,
    name: "Projects Updates",
    component: <ProjectsUpdatesManagement />,
    exact: "exact",
    path: "/projects-updates",
    activeIcon: <ClipboardList size={20} color="#fff" />,
    inActiveIcon: <ClipboardList size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 16,
    name: "Proposals",
    component: <ProposalsManagement />,
    exact: "exact",
    path: "/proposals",
    activeIcon: <FileCheck size={20} color="#fff" />,
    inActiveIcon: <FileCheck size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 19,
    name: "Applied Form",
    component: <AppliedFormsManagement />,
    exact: "exact",
    path: "/applied-form",
    activeIcon: <FileCheck size={20} color="#fff" />,
    inActiveIcon: <FileCheck size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 17,
    name: "View Proposal",
    component: <ViewProposals />,
    exact: "exact",
    path: "/proposals/:id",
    isHideMenu: true,
    activeIcon: <Eye size={20} color="#fff" />,
    inActiveIcon: <Eye size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },
  {
    id: 18,
    name: "View Progress Details",
    component: <ProjectsProgressViewDetails />,
    exact: "exact",
    path: "/projects-progress/:id",
    isHideMenu: true,
    activeIcon: <Eye size={20} color="#fff" />,
    inActiveIcon: <Eye size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },

  // ======================= SETTINGS =======================
  {
    id: 19,
    name: "Settings",
    component: <Settings />,
    exact: "exact",
    path: "/settings",
    activeIcon: <Settings2Icon size={20} color="#fff" />,
    inActiveIcon: <Settings2Icon size={20} color="#64748b" />,
    permissions: createDefaultPermissions(),
  },

  // ======================= HIDDEN ROUTES =======================
  // {
  //   id: 18,
  //   name: "Access Granted",
  //   component: <AccessGranted />,
  //   exact: "exact",
  //   path: "access-granted",
  //   isHideMenu: true,
  // },
];

export { ADMIN_ROUTES, AUTH_ROUTES };

// Build dynamic routes based on user's designation routes coming from backend
// Expected designation shape:
// { routes: [{ path: string, title: string, order: number, permissions: Array<Record<string, boolean|unknown>> }] }
export const buildRoutesFromDesignation = (designation) => {
  const incoming = Array.isArray(designation?.routes) ? designation.routes : [];
  if (incoming.length === 0) return [];

  const byPath = Object.fromEntries(incoming.map((r) => [r.path, r]));
  const allowedPaths = new Set(incoming.map((r) => r.path));

  return ADMIN_ROUTES.filter((r) => allowedPaths.has(r.path))
    .map((r) => {
      const d = byPath[r.path] || {};
      return {
        ...r,
        name: d.title || r.name,
        title: d.title || r.title,
        order: d.order ?? r.id ?? r.order,
        permissions: Array.isArray(d.permissions)
          ? d.permissions
          : r.permissions,
      };
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const buildRoutesForUser = (user) => {
  const storedRole = String(user?.role || "").toLowerCase();
  const designationRole = String(user?.designation?.roleName || "").toLowerCase();
  const role = storedRole && storedRole !== "user" ? storedRole : designationRole || storedRole;

  if (role === "worker") {
    return ADMIN_ROUTES.filter((route) =>
      ["/my-projects", "/chat"].includes(route.path),
    );
  }

  if (user?.designation) {
    const designationRoutes = buildRoutesFromDesignation(user.designation);
    if (designationRoutes.length > 0) return designationRoutes;
  }

  return ADMIN_ROUTES;
};
