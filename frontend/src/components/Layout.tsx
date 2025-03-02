import { ReactNode } from "react";
import {
  useNavigate,
  Link as RouterLink,
  useSearchParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
  Link,
} from "@mui/material";
import { RootState, useAppDispatch } from "../store";
import { logout } from "../store/slices/authSlice";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeLecture } = useSelector((state: RootState) => state.lectures);

  const handleLogout = async () => {
    await dispatch(logout()).unwrap();
    navigate("/login");
  };

  // Helper to preserve lecture selection in navigation
  const getNavigationPath = (basePath: string) => {
    const lectureId = searchParams.get("lectureId") || activeLecture?._id;
    return lectureId ? `${basePath}?lectureId=${lectureId}` : basePath;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
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
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/lectures">
                Lectures
              </Button>
              {user.role === "faculty" && (
                <>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/questions"
                  >
                    All Questions
                  </Button>
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to={getNavigationPath("/questions/create")}
                  >
                    Create Question
                  </Button>
                  <Button color="inherit" component={RouterLink} to="/scoring">
                    Scoring Settings
                  </Button>
                </>
              )}
              <Button color="inherit" component={RouterLink} to="/profile">
                {user.name} ({user.score} points)
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>
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
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            Question Writing System © {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
