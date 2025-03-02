import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

interface ScoringConfig {
  studentIncentive: number;
  instructorIncentive: number;
  baseScore: number;
}

interface ScoringState {
  config: ScoringConfig | null;
  isLoading: boolean;
  error: string | null;
}

const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
}/scoring`;

const initialState: ScoringState = {
  config: null,
  isLoading: false,
  error: null,
};

export const getConfig = createAsyncThunk(
  "scoring/getConfig",
  async (_, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      const response = await axios.get(`${API_URL}/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch scoring configuration"
      );
    }
  }
);

export const updateConfig = createAsyncThunk(
  "scoring/updateConfig",
  async (config: Partial<ScoringConfig>, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      const response = await axios.put(`${API_URL}/config`, config, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to update scoring configuration"
      );
    }
  }
);

const scoringSlice = createSlice({
  name: "scoring",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.config = action.payload;
      })
      .addCase(getConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.config = action.payload;
      })
      .addCase(updateConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default scoringSlice.reducer;
