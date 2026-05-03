import * as React from "react";
import {
  Box,
  Drawer,
  AppBar,
  CssBaseline,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Typography,
  Divider,
} from "@mui/material";
import { Menu as MenuIcon, User, Settings, LogOut } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import { buildRoutesForUser } from "../../routes";
import logo from "../../assets/Logo.png";
import useUserStore from "../../zustand/useUserStore";
import ActionButtons from "./actionButton";
import { motion } from "framer-motion";
import NotificationBell from "./notifcation";

const drawerWidth = 220;
const collapsedWidth = 70; // collapsed drawer only icons

export default function MainLayout({ children }) {
  console.log("🎨 MainLayout rendering with children:", children);
  const navigate = useNavigate();
  const location = useLocation();
  const { clearUserData, user } = useUserStore();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(true); // Keep small drawer open on mobile by default
  const [mobileExpanded, setMobileExpanded] = React.useState(false); // Track if mobile drawer is expanded
  const [drawerOpen, setDrawerOpen] = React.useState(true);

  const MotionIconButton = motion(IconButton);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const toggleDrawer = () => {
    if (isMobile) {
      setMobileExpanded(!mobileExpanded);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  React.useEffect(() => {
    if (isMobile) {
      setMobileOpen(true); // Keep small drawer open on mobile
      setMobileExpanded(false); // Start collapsed on mobile
      setDrawerOpen(false); // Close large drawer on mobile
    } else {
      setMobileOpen(false); // Close mobile drawer on desktop
      setMobileExpanded(false); // Reset mobile expanded state
      setDrawerOpen(true); // Open large drawer on desktop
    }
  }, [isMobile]);

  const isRouteActive = (routePath) => {
    if (location.pathname === routePath) return true;
    if (routePath === "/" && location.pathname === "/") return true;
    if (routePath !== "/" && location.pathname.startsWith(routePath))
      return true;
    if (routePath.includes("*")) {
      const basePath = routePath.split("*")[0];
      if (location.pathname.startsWith(basePath)) return true;
    }
    return false;
  };

  const handleLogout = () => {
    navigate("/login");
    handleClose();
    clearUserData();
  };

  const computedRoutes = React.useMemo(() => {
    return buildRoutesForUser(user);
  }, [user]);

  const drawerContent = (showText) => (
    <Box sx={{ overflow: "auto", p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
        }}
      >
        <img
          src={logo}
          alt="logo"
          width={showText ? 60 : 30}
          style={{
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Box>
      <List sx={{ mt: 3 }}>
        {computedRoutes.map((route) => {
          if (route.isHideMenu || !route.name) return null;
          const isActive = isRouteActive(route.path);
          return (
            <ListItem key={route.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                className={`admin-nav-item wg-card wg-nav-glow ${isActive ? "active" : ""}`}
                onClick={() => handleNavigation(route.path)}
                sx={{
                  background: isActive
                    ? "linear-gradient(90deg,#9EFF00,#3DD400)"
                    : "transparent",
                  color: isActive ? "black" : "white",
                  borderRadius: "12px",
                  py: 0.5,
                  justifyContent: showText ? "flex-start" : "center",
                  "&:hover": {
                    transform: showText ? "translateX(4px)" : "scale(1.05)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "inset 0 0 60px rgba(158,255,0,0.18)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: showText ? 2 : 0,
                    color: isActive ? "black" : "white",
                  }}
                >
                  {isActive ? route.activeIcon : route.inActiveIcon}
                </ListItemIcon>
                {showText && (
                  <ListItemText
                    primary={route.name}
                    sx={{
                      opacity: showText ? 1 : 0,
                      transition: "opacity 0.2s ease-in-out",
                      "& .MuiTypography-root": {
                        fontWeight: isActive ? 600 : 400,
                        fontSize: "12px",
                        color: isActive ? "black" : "white",
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "rgb(13, 12, 12)",
          boxShadow: "none",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            minHeight: "70px",
          }}
        >
          {/* Left side (Menu button) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <MotionIconButton
              onClick={toggleDrawer}
              whileHover={{ scale: 1.15, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              sx={{
                color: "#fff",
                backgroundColor: "#1A1A1A",
                borderRadius: "12px",
                padding: "10px",
                boxShadow: "0 4px 15px rgba(255, 255, 255, 0.1)",
                transform: isMobile
                  ? mobileExpanded
                    ? "rotate(0deg)"
                    : "rotate(180deg)"
                  : drawerOpen
                    ? "rotate(0deg)"
                    : "rotate(180deg)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                marginLeft: isMobile
                  ? mobileOpen
                    ? mobileExpanded
                      ? "220px"
                      : "70px"
                    : "0px"
                  : drawerOpen
                    ? "220px"
                    : "70px",
                "&:hover": {
                  backgroundColor: "#262626",
                  boxShadow: "0 6px 25px rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              <MenuIcon />
            </MotionIconButton>
          </Box>

          {/* Right side (actions + avatar) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 3 } }}>
            {!isMobile && (
              <ActionButtons
                handleNavigation={handleNavigation}
                handleLogout={handleLogout}
              />
            )}
            <NotificationBell />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0, sm: 2 },
                background: "linear-gradient(90deg,#9EFF00,#3DD400)",
                borderRadius: "8px",
                padding: "4px",
                color: "white",
                width: { xs: "auto", sm: "180px" },
                cursor: "pointer",
                justifyContent: "space-between",
                boxShadow: "inset 0 0 40px rgba(158,255,0,0.18)",
              }}
              onClick={handleAvatarClick}
            >
              {!isMobile && (
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "black",
                    ml: 1,
                  }}
                >
                  Hello {user?.username}
                </Typography>
              )}
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  border: "2px solid white",
                  cursor: "pointer",
                }}
                src={
                  user?.profileImage ||
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
                }
              >
                <User size={20} />
              </Avatar>
            </Box>
          </Box>

          {/* Avatar Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                borderRadius: 3,
                minWidth: 220,
                p: 1,
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handleNavigation("/settings");
                handleClose();
              }}
            >
              <Settings fontSize="small" />
              Settings
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <LogOut fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      {isMobile ? (
        <Drawer
          variant="permanent"
          open={mobileOpen}
          sx={{
            width: mobileExpanded ? drawerWidth : collapsedWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: mobileExpanded ? drawerWidth : collapsedWidth,
              boxSizing: "border-box",
              backgroundColor: "rgb(13, 12, 12)",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              overflowX: "hidden",
            },
          }}
        >
          {drawerContent(mobileExpanded)}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open={drawerOpen}
          sx={{
            width: drawerOpen ? drawerWidth : collapsedWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerOpen ? drawerWidth : collapsedWidth,
              transition:
                "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxSizing: "border-box",
              backgroundColor: "rgb(13, 12, 12)",
              overflowX: "hidden",
            },
          }}
        >
          {drawerContent(drawerOpen)}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          background: "#0f0f0f",
          minHeight: "100vh",
          overflow: "auto",
          width: "100%",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Toolbar sx={{ minHeight: "70px" }} />
        {children}
      </Box>
    </Box>
  );
}
