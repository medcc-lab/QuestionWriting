import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  Box,
  Button,
  Link,
  TextField,
  Typography,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  login,
  setPassword,
  requestPasswordReset,
} from "../store/slices/authSlice";
import { LoginCredentials } from "../types/auth";
import LectureSelector from "../components/LectureSelector";

const Login = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showLectureSelector, setShowLectureSelector] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({
    userId: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await dispatch(login(formData)).unwrap();

      if (response.requiresPasswordReset) {
        // Show password setup dialog
        setPasswordResetData({
          userId: response._id,
          password: "",
          confirmPassword: "",
        });
        setShowPasswordSetup(true);
      } else {
        setShowLectureSelector(true);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLectureSelectorClose = () => {
    setShowLectureSelector(false);
    navigate("/lectures");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordSetupChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordResetData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSetPassword = async () => {
    setPasswordError(null);

    // Validate passwords
    if (passwordResetData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (passwordResetData.password !== passwordResetData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // Submit password
    try {
      await dispatch(
        setPassword({
          userId: passwordResetData.userId,
          password: passwordResetData.password,
        })
      ).unwrap();

      setShowPasswordSetup(false);
      setShowLectureSelector(true);
    } catch (error) {
      console.error("Setting password failed:", error);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    setPasswordError(null);
    try {
      await dispatch(
        requestPasswordReset({ email: forgotPasswordEmail })
      ).unwrap();
      setForgotPasswordSuccess(true);
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Failed to request password reset"
      );
    }
  };

  return (
    <>
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
            maxWidth: 400,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign in
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
            <Box sx={{ textAlign: "center" }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setShowForgotPassword(true)}
                sx={{ mb: 1, display: "block" }}
              >
                Forgot password?
              </Link>
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Password Setup Dialog */}
      <Dialog open={showPasswordSetup} fullWidth maxWidth="sm">
        <DialogTitle>Set Your Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This is your first login. Please set a password to continue.
          </DialogContentText>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="New Password"
            type="password"
            id="new-password"
            value={passwordResetData.password}
            onChange={handlePasswordSetupChange}
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirm-password"
            value={passwordResetData.confirmPassword}
            onChange={handlePasswordSetupChange}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSetPassword}
            color="primary"
            variant="contained"
          >
            {isLoading ? "Setting Password..." : "Set Password"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog
        open={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setForgotPasswordSuccess(false);
          setForgotPasswordEmail("");
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {forgotPasswordSuccess ? (
            <DialogContentText>
              If an account exists with this email, you will receive a password
              reset link shortly.
            </DialogContentText>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Enter your email address and we'll send you a link to reset your
                password.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="forgot-password-email"
                label="Email Address"
                type="email"
                fullWidth
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowForgotPassword(false);
              setForgotPasswordSuccess(false);
              setForgotPasswordEmail("");
            }}
          >
            {forgotPasswordSuccess ? "Close" : "Cancel"}
          </Button>
          {!forgotPasswordSuccess && (
            <Button onClick={handleForgotPasswordSubmit}>
              Send Reset Link
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Lecture Selector */}
      <LectureSelector
        open={showLectureSelector}
        onClose={handleLectureSelectorClose}
      />
    </>
  );
};

export default Login;
