import { ReactNode, useState } from "react";
import {
  useNavigate,
  Link as RouterLink,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Link,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PeopleIcon from "@mui/icons-material/People";
import { RootState, useAppDispatch } from "../store";
import { logout } from "../store/slices/authSlice";

interface LayoutProps {
  children: ReactNode;
}

const DRAWER_WIDTH = 240;
const MAX_CONTENT_WIDTH = 1200;

const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeLecture } = useSelector((state: RootState) => state.lectures);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    await dispatch(logout()).unwrap();
    navigate("/login");
  };

  // Helper to preserve lecture selection in navigation
  const getNavigationPath = (basePath: string) => {
    const lectureId = searchParams.get("lectureId") || activeLecture?._id;
    return lectureId ? `${basePath}?lectureId=${lectureId}` : basePath;
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const menuItems = [
    // Common items for all users
    {
      text: "Lectures",
      path: "/lectures",
      icon: <SchoolIcon />,
      visible: !!user,
    },
    // Faculty-only items
    {
      text: "All Questions",
      path: "/questions",
      icon: <QuizIcon />,
      visible: user?.role === "faculty" || user?.role === "admin",
    },
    {
      text: "Create Question",
      path: getNavigationPath("/questions/create"),
      icon: <AddIcon />,
      visible: user?.role === "faculty" || user?.role === "admin",
    },
    {
      text: "User Management",
      path: "/users",
      icon: <PeopleIcon />,
      visible: user?.role === "faculty" || user?.role === "admin",
    },
    {
      text: "Scoring Settings",
      path: "/scoring",
      icon: <SettingsIcon />,
      visible: user?.role === "faculty" || user?.role === "admin",
    },
    // Common for logged-in users
    {
      text: "My Profile",
      path: "/profile",
      icon: <PersonIcon />,
      visible: !!user,
    },
    // Auth-related items
    {
      text: "Login",
      path: "/login",
      icon: <LoginIcon />,
      visible: !user,
    },
    {
      text: "Register",
      path: "/register",
      icon: <HowToRegIcon />,
      visible: !user,
    },
  ];

  const drawer = (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 1,
        }}
      >
        <Typography variant="h6" noWrap component="div">
          Menu
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems
          .filter((item) => item.visible)
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={isActive(item.path)}
                onClick={handleDrawerToggle}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        {user && (
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link
              component={RouterLink}
              to={getNavigationPath("/")}
              color="inherit"
              sx={{ textDecoration: "none" }}
            >
              Question Writing System
            </Link>
          </Typography>
          {user && !isMobile && (
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              {user.name} ({user.score} points)
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "temporary"}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          px: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: MAX_CONTENT_WIDTH,
          }}
        >
          {activeLecture && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" color="text.secondary">
                Current Lecture: {activeLecture.title}
              </Typography>
            </Box>
          )}
          {children}
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: MAX_CONTENT_WIDTH,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            Question Writing System © {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
