import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  createTheme,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Forum as ForumIcon,
  Logout as LogoutIcon,
  BarChart as BarChartIcon, // Import the BarChart icon for Statistics
  PersonOff as PersonOffIcon,
} from "@mui/icons-material";

const drawerWidth = 280;

const theme = createTheme({
  typography: {
    fontFamily: 'Nunito, sans-serif', // Ensure Nunito font is used
  },
  palette: {
    primary: {
      main: "#7BC5A5",
      dark: "#6ab394",
    },
    background: {
      default: "#fefefe",
    },
  },
});

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
  { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
  { text: "Forum", icon: <ForumIcon />, path: "/admin/prompts" },
  { text: "Statistics", icon: <BarChartIcon />, path: "/admin/statistics" }, // Add the Statistics page
  { text: "Inactive Users", icon: <PersonOffIcon />, path: "/admin/inactive" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(
    menuItems.findIndex((item) => item.path === location.pathname)
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              bgcolor: "white",
              borderRight: "1px solid #e0e0e0",
            },
          }}
        >
          {/* Sidebar Header */}
          <Box sx={{ p: 3, borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", flexDirection: "column", gap: 1 }}>
            <Typography variant="h6" sx={{ color: "#2d3436", fontWeight: 600 }}>
              Mindful Map Admin
            </Typography>
            <img src="/images/logo.png" alt="Logo" style={{ width: '100px', height: 'auto', marginTop: '10px' }} /> {/* Add logo image */}
          </Box>

          {/* Menu Items */}
          <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100% - 85px)", justifyContent: "space-between" }}>
            <Box sx={{ mt: 2, px: 2 }}>
              <List>
                {menuItems.map((item, index) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      component={Link}
                      to={item.path}
                      selected={selectedIndex === index}
                      onClick={() => setSelectedIndex(index)}
                      sx={{
                        borderRadius: "12px",
                        transition: "all 0.2s ease-in-out",
                        "&.Mui-selected": {
                          backgroundColor: "primary.main",
                          color: "white",
                          "&:hover": { backgroundColor: "primary.dark" },
                          "& .MuiListItemIcon-root": { color: "white" },
                        },
                        "&:hover": {
                          backgroundColor: selectedIndex === index ? "primary.dark" : "rgba(123, 197, 165, 0.08)",
                          "& .MuiListItemText-primary": { color: "#2d3436" }, 
                          "& .MuiListItemIcon-root": { color: selectedIndex === index ? "white" : "#666" },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: selectedIndex === index ? "white" : "#666", minWidth: "40px" }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} sx={{ "& .MuiListItemText-primary": { fontWeight: selectedIndex === index ? 600 : 500 } }} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Logout Button */}
            <Box sx={{ px: 2, pb: 3, borderTop: "1px solid #f0f0f0", pt: 2 }}>
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleLogout} sx={{ borderRadius: "12px", "&:hover": { backgroundColor: "rgba(123, 197, 165, 0.08)" } }}>
                    <ListItemIcon sx={{ color: "#666", minWidth: "40px" }}>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Sign out" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default Navbar;