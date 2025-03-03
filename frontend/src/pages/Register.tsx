import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Link,
  TextField,
  Typography,
  Alert,
  Paper,
} from "@mui/material";
import { register } from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { RegisterData } from "../types/auth";

const Register = () => {
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await dispatch(register(formData)).unwrap();
      setSuccessMessage(response.message);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (successMessage) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 170px)",
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: 450,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" align="center" gutterBottom>
            Registration Successful
          </Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
            >
              Return to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 170px)", // Adjust for header and footer
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 450,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Sign up
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleTextChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleTextChange}
          />
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            After registration, your account will need to be activated by an
            administrator before you can log in.
          </Typography>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </Button>
          <Box sx={{ textAlign: "center" }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign In
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
