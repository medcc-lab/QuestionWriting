import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Divider,
  FormHelperText,
  SelectChangeEvent,
  IconButton,
  Alert,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockResetIcon from "@mui/icons-material/LockReset";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  createUser,
  getPendingUsers,
  activateUser,
  generateResetLink,
  getActiveUsers,
} from "../store/slices/authSlice";
import { CreateUserData, PendingUser } from "../types/auth";
import { toast } from "react-toastify";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const UserManagement = () => {
  const dispatch = useAppDispatch();
  const { user, activeUsers } = useAppSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [newUserData, setNewUserData] = useState<CreateUserData>({
    name: "",
    email: "",
    role: "student",
  });
  const [activateRole, setActivateRole] = useState<
    "student" | "faculty" | "admin"
  >("student");
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedActiveUser, setSelectedActiveUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);

  useEffect(() => {
    loadPendingUsers();
    loadActiveUsers();
  }, []);

  const loadPendingUsers = async () => {
    setIsLoadingPending(true);
    try {
      const users = await dispatch(getPendingUsers()).unwrap();
      setPendingUsers(users);
    } catch (error) {
      toast.error("Failed to load pending users");
    } finally {
      setIsLoadingPending(false);
    }
  };

  const loadActiveUsers = async () => {
    setIsLoadingActive(true);
    try {
      await dispatch(getActiveUsers()).unwrap();
    } catch (error) {
      toast.error("Failed to load active users");
    } finally {
      setIsLoadingActive(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateRoleChange = (e: SelectChangeEvent<string>) => {
    setNewUserData((prev) => ({
      ...prev,
      role: e.target.value as "student" | "faculty" | "admin",
    }));
  };

  const handleActivateRoleChange = (e: SelectChangeEvent<string>) => {
    setActivateRole(e.target.value as "student" | "faculty" | "admin");
  };

  const handleCreateUser = async () => {
    try {
      await dispatch(createUser(newUserData)).unwrap();
      toast.success("User created successfully");
      setNewUserData({ name: "", email: "", role: "student" });
      // Load the active users list to show the new user
      loadActiveUsers();
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleActivateUser = async () => {
    if (!selectedUser) return;

    try {
      const result = await dispatch(
        activateUser({
          userId: selectedUser._id,
          data: { role: activateRole },
        })
      ).unwrap();

      // Show the reset link in the dialog
      if (result.resetLink) {
        setResetLink(result.resetLink);
      }

      // Don't close the dialog yet - let user copy the reset link
      loadPendingUsers();
    } catch (error) {
      toast.error("Failed to activate user");
      setActivateDialogOpen(false);
    }
  };

  const handleGenerateResetLink = async () => {
    if (!selectedActiveUser) return;
    try {
      const result = await dispatch(
        generateResetLink(selectedActiveUser.id)
      ).unwrap();
      if (result.resetLink) {
        setResetLink(result.resetLink);
      }
    } catch (error) {
      toast.error("Failed to generate reset link");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Reset link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy reset link");
    }
  };

  const openActivateDialog = (user: PendingUser) => {
    setSelectedUser(user);
    setActivateRole("student");
    setActivateDialogOpen(true);
  };

  if (!user || (user.role !== "faculty" && user.role !== "admin")) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Access denied. Faculty or admin privileges required.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4 }}>
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          variant="fullWidth"
        >
          <Tab label="Pending Users" />
          <Tab label="Create New User" />
        </Tabs>

        {/* Pending Users Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h5">Pending User Accounts</Typography>
            <Button
              variant="outlined"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => loadPendingUsers()}
              disabled={isLoadingPending}
            >
              Refresh List
            </Button>
          </Box>

          {isLoadingPending ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : pendingUsers.length > 0 ? (
            <List>
              {pendingUsers.map((pendingUser) => (
                <ListItem
                  key={pendingUser._id}
                  divider
                  sx={{
                    bgcolor: "background.paper",
                    mb: 1,
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="subtitle1">
                          {pendingUser.name}
                        </Typography>
                        <Chip
                          label="Pending"
                          color="warning"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">
                          Email: {pendingUser.email}
                        </Typography>
                        <Typography variant="body2">
                          Registered:{" "}
                          {new Date(pendingUser.createdAt).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => openActivateDialog(pendingUser)}
                    >
                      Activate
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="textSecondary">
                No pending user accounts found
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Create New User Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Create New User
            </Typography>
            <Typography color="textSecondary">
              Create new user accounts with specific roles. Users will set their
              password on first login.
            </Typography>
          </Box>

          <Paper elevation={1} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
            <TextField
              fullWidth
              margin="normal"
              required
              label="Full Name"
              name="name"
              value={newUserData.name}
              onChange={handleCreateUserChange}
            />
            <TextField
              fullWidth
              margin="normal"
              required
              label="Email Address"
              name="email"
              value={newUserData.email}
              onChange={handleCreateUserChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="create-role-label">Role</InputLabel>
              <Select
                labelId="create-role-label"
                value={newUserData.role}
                label="Role"
                onChange={handleCreateRoleChange}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="faculty">Faculty</MenuItem>
                {user.role === "admin" && (
                  <MenuItem value="admin">Administrator</MenuItem>
                )}
              </Select>
              <FormHelperText>
                {newUserData.role === "student"
                  ? "Students can write questions and make suggestions"
                  : newUserData.role === "faculty"
                  ? "Faculty can manage questions, lectures and users"
                  : "Administrators have full system access"}
              </FormHelperText>
            </FormControl>

            <Box sx={{ mt: 3, textAlign: "right" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={handleCreateUser}
                disabled={!newUserData.name || !newUserData.email}
              >
                Create User
              </Button>
            </Box>
          </Paper>
        </TabPanel>
      </Paper>

      {/* Activate User Dialog */}
      <Dialog
        open={activateDialogOpen}
        onClose={() => {
          if (!resetLink) {
            setActivateDialogOpen(false);
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Activate User Account</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {selectedUser && (
              <>
                <Typography variant="h6">{selectedUser.name}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {selectedUser.email}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </>
            )}
            {!resetLink ? (
              <FormControl fullWidth margin="normal">
                <InputLabel id="activate-role-label">Assign Role</InputLabel>
                <Select
                  labelId="activate-role-label"
                  value={activateRole}
                  label="Assign Role"
                  onChange={handleActivateRoleChange}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="faculty">Faculty</MenuItem>
                  {user?.role === "admin" && (
                    <MenuItem value="admin">Administrator</MenuItem>
                  )}
                </Select>
                <FormHelperText>
                  Select the role to assign to this user
                </FormHelperText>
              </FormControl>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  User activated successfully! Share this password reset link
                  with the user:
                </Alert>
                <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                  <Typography sx={{ mb: 1, wordBreak: "break-all" }}>
                    {resetLink}
                  </Typography>
                  <Button
                    startIcon={<ContentCopyIcon />}
                    onClick={() => copyToClipboard(resetLink)}
                    variant="outlined"
                    size="small"
                  >
                    Copy Link
                  </Button>
                </Paper>
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  The link will expire in 1 hour
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {!resetLink ? (
            <>
              <Button onClick={() => setActivateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleActivateUser}
                variant="contained"
                color="primary"
              >
                Activate User
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setActivateDialogOpen(false);
                setResetLink(null);
              }}
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={showResetDialog}
        onClose={() => {
          if (!resetLink) {
            setShowResetDialog(false);
            setSelectedActiveUser(null);
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Reset User Password</DialogTitle>
        <DialogContent>
          {selectedActiveUser && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6">{selectedActiveUser.name}</Typography>
              <Typography color="textSecondary" gutterBottom>
                {selectedActiveUser.email}
              </Typography>
              <Divider sx={{ my: 2 }} />

              {!resetLink ? (
                <Typography>
                  Generate a password reset link for this user. The user will be
                  able to set a new password using this link.
                </Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Share this password reset link with the user:
                  </Alert>
                  <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                    <Typography sx={{ mb: 1, wordBreak: "break-all" }}>
                      {resetLink}
                    </Typography>
                    <Button
                      startIcon={<ContentCopyIcon />}
                      onClick={() => copyToClipboard(resetLink)}
                      variant="outlined"
                      size="small"
                    >
                      Copy Link
                    </Button>
                  </Paper>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 1 }}
                  >
                    The link will expire in 1 hour
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!resetLink ? (
            <>
              <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
              <Button
                onClick={handleGenerateResetLink}
                variant="contained"
                color="primary"
              >
                Generate Reset Link
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setShowResetDialog(false);
                setSelectedActiveUser(null);
                setResetLink(null);
              }}
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Active Users Section */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h6">Active Users</Typography>
          <Button
            variant="outlined"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={loadActiveUsers}
            disabled={isLoadingActive}
          >
            Refresh List
          </Button>
        </Box>

        {isLoadingActive ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeUsers.length > 0 ? (
          <List>
            {activeUsers.map((user) => (
              <ListItem
                key={user._id}
                divider
                sx={{
                  bgcolor: "background.paper",
                  mb: 1,
                  borderRadius: 1,
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1">{user.name}</Typography>
                      <Chip
                        label={user.role}
                        color={
                          user.role === "admin"
                            ? "error"
                            : user.role === "faculty"
                            ? "primary"
                            : "default"
                        }
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={user.email}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="reset password"
                    onClick={() => {
                      setSelectedActiveUser({
                        id: user._id,
                        name: user.name,
                        email: user.email,
                      });
                      setShowResetDialog(true);
                    }}
                  >
                    <LockResetIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="textSecondary">No active users found</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UserManagement;
