import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import {
  AuthState,
  LoginCredentials,
  RegisterData,
  User,
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
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    console.log("Login thunk started with email:", credentials.email);
    try {
      console.log("Making login API request");
      const response = await axios.post(`${API_URL}/login`, credentials);
      console.log("Login API response received:", response.status);
      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error) {
      console.error("Login API error:", error);
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
      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
});

interface LeaderboardEntry {
  _id: string;
  name: string;
  score: number;
}

export const getLeaderboard = createAsyncThunk(
  "auth/getLeaderboard",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = (getState() as RootState).auth;
      const response = await axios.get(`${API_URL}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as LeaderboardEntry[];
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch leaderboard"
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
        console.log("Login pending");
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("Login fulfilled, setting user and token");
        state.isLoading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        console.log("Login rejected with error:", action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
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
      });
  },
});

export const { resetError, updateUser } = authSlice.actions;
export default authSlice.reducer;
