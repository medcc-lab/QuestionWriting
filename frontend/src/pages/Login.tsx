import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  Box,
  Button,
  Container,
  Link,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { login } from "../store/slices/authSlice";
import { LoginCredentials } from "../types/auth";
import LectureSelector from "../components/LectureSelector";

const Login = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showLectureSelector, setShowLectureSelector] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login submission started");
    try {
      console.log("Dispatching login action");
      const result = await dispatch(login(formData)).unwrap();
      console.log("Login successful, user data:", result);
      setShowLectureSelector(true);
      console.log("LectureSelector dialog opened");
    } catch (error) {
      // Error handling is already managed by the auth slice reducer
      console.error("Login failed:", error);
    }
  };

  const handleLectureSelectorClose = () => {
    console.log("LectureSelector closing");
    setShowLectureSelector(false);
    navigate("/lectures");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <Link component={RouterLink} to="/register" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Container>

      <LectureSelector
        open={showLectureSelector}
        onClose={handleLectureSelectorClose}
      />
    </>
  );
};

export default Login;
