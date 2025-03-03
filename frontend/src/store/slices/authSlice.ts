import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import {
  AuthState,
  LoginCredentials,
  RegisterData,
  User,
  SetPasswordData,
  PendingUser,
  CreateUserData,
  ActivateUserData,
} from "../../types/auth";
import { RootState } from "..";

const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
}/users`;

// Get user from localStorage
const user = localStorage.getItem("user");
const token = localStorage.getItem("token");

const initialState: AuthState = {
  user: user ? JSON.parse(user) : null,
  token: token || null,
  isLoading: false,
  error: null,
  activeUsers: [], // Add this line
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);

      // Check if password reset is required
      if (response.data.requiresPasswordReset) {
        return {
          ...response.data,
          requiresPasswordReset: true,
        };
      }

      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const setPassword = createAsyncThunk(
  "auth/setPassword",
  async (passwordData: SetPasswordData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/set-password`,
        passwordData
      );
      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to set password"
      );
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
});

export const getLeaderboard = createAsyncThunk(
  "auth/getLeaderboard",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = (getState() as RootState).auth;
      const response = await axios.get(`${API_URL}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch leaderboard"
      );
    }
  }
);

export const getPendingUsers = createAsyncThunk(
  "auth/getPendingUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = (getState() as RootState).auth;
      const response = await axios.get(`${API_URL}/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as PendingUser[];
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch pending users"
      );
    }
  }
);

export const activateUser = createAsyncThunk(
  "auth/activateUser",
  async (
    { userId, data }: { userId: string; data: ActivateUserData },
    { getState, rejectWithValue }
  ) => {
    try {
      const { token } = (getState() as RootState).auth;
      const response = await axios.put(`${API_URL}/${userId}/activate`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to activate user"
      );
    }
  }
);

export const createUser = createAsyncThunk(
  "auth/createUser",
  async (userData: CreateUserData, { getState, rejectWithValue }) => {
    try {
      const { token } = (getState() as RootState).auth;
      const response = await axios.post(`${API_URL}/create`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to create user"
      );
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  "auth/requestReset",
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/request-reset`, data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to request password reset"
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    data: { token: string; userId: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${API_URL}/reset-password`, data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to reset password"
      );
    }
  }
);

export const generateResetLink = createAsyncThunk(
  "auth/generateResetLink",
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const { token } = (getState() as RootState).auth;
      const response = await axios.post(
        `${API_URL}/${userId}/generate-reset-link`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to generate reset link"
      );
    }
  }
);

export const getActiveUsers = createAsyncThunk(
  "auth/getActiveUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = (getState() as RootState).auth;
      const response = await axios.get(`${API_URL}/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch active users"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;

        // If this is a password reset required response, we don't set the user/token yet
        if (!action.payload.requiresPasswordReset) {
          state.user = action.payload;
          state.token = action.payload.token;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        // We don't set user or token for registration anymore as it requires activation
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(setPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      })
      .addCase(getLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getLeaderboard.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(getLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getPendingUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPendingUsers.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(getPendingUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(activateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(activateUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(activateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Request Password Reset
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Generate Reset Link
      .addCase(generateResetLink.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateResetLink.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(generateResetLink.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Get Active Users
      .addCase(getActiveUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getActiveUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeUsers = action.payload;
      })
      .addCase(getActiveUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetError, updateUser } = authSlice.actions;
export default authSlice.reducer;
