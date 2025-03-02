import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { logout } from "./authSlice";
import {
  CreateLectureDto,
  UpdateLectureDto,
  LectureState,
  Lecture,
} from "../../types/lecture";
import { RootState } from "..";

const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
}/lectures`;

interface ApiError {
  message: string;
}

// Get active lecture from localStorage
const activeLecture = localStorage.getItem("activeLecture");

const initialState: LectureState = {
  lectures: [],
  activeLecture: activeLecture ? JSON.parse(activeLecture) : null,
  loading: false,
  error: null,
};

export const fetchLectures = createAsyncThunk(
  "lectures/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    console.log("fetchLectures thunk started");
    try {
      const state = getState() as RootState;
      console.log("Fetching lectures with token:", !!state.auth.token);
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      console.log(`Fetched ${response.data.length} lectures successfully`);
      return response.data;
    } catch (error) {
      console.error("Error fetching lectures:", error);
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch lectures"
      );
    }
  }
);

export const createLecture = createAsyncThunk(
  "lectures/create",
  async (lectureData: CreateLectureDto, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(API_URL, lectureData, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to create lecture"
      );
    }
  }
);

export const updateLecture = createAsyncThunk(
  "lectures/update",
  async (
    { id, data }: { id: string; data: UpdateLectureDto },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await axios.put(`${API_URL}/${id}`, data, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to update lecture"
      );
    }
  }
);

export const deleteLecture = createAsyncThunk(
  "lectures/delete",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
      });
      return id;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete lecture"
      );
    }
  }
);

export const addStudentsToLecture = createAsyncThunk(
  "lectures/addStudents",
  async (
    { lectureId, studentIds }: { lectureId: string; studentIds: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(
        `${API_URL}/${lectureId}/students`,
        { studentIds },
        { headers: { Authorization: `Bearer ${state.auth.token}` } }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to add students"
      );
    }
  }
);

export const removeStudentsFromLecture = createAsyncThunk(
  "lectures/removeStudents",
  async (
    { lectureId, studentIds }: { lectureId: string; studentIds: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await axios.delete(`${API_URL}/${lectureId}/students`, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
        data: { studentIds },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to remove students"
      );
    }
  }
);

export const addQuestionsToLecture = createAsyncThunk(
  "lectures/addQuestions",
  async (
    { lectureId, questionIds }: { lectureId: string; questionIds: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await axios.post(
        `${API_URL}/${lectureId}/questions`,
        { questionIds },
        { headers: { Authorization: `Bearer ${state.auth.token}` } }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to add questions"
      );
    }
  }
);

export const removeQuestionsFromLecture = createAsyncThunk(
  "lectures/removeQuestions",
  async (
    { lectureId, questionIds }: { lectureId: string; questionIds: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await axios.delete(`${API_URL}/${lectureId}/questions`, {
        headers: { Authorization: `Bearer ${state.auth.token}` },
        data: { questionIds },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to remove questions"
      );
    }
  }
);

const lectureSlice = createSlice({
  name: "lectures",
  initialState,
  reducers: {
    setActiveLecture: (state, action: PayloadAction<Lecture | null>) => {
      state.activeLecture = action.payload;
      if (action.payload) {
        localStorage.setItem("activeLecture", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("activeLecture");
      }
    },
    clearLectureError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLectures.pending, (state) => {
        console.log("Lectures fetch pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchLectures.fulfilled,
        (state, action: PayloadAction<Lecture[]>) => {
          console.log(
            `Lectures fetch fulfilled with ${action.payload.length} lectures`
          );
          state.loading = false;
          state.lectures = action.payload;
        }
      )
      .addCase(fetchLectures.rejected, (state, action) => {
        console.log("Lectures fetch rejected:", action.payload);
        state.loading = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          "An error occurred";
      })
      .addCase(createLecture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createLecture.fulfilled,
        (state, action: PayloadAction<Lecture>) => {
          state.loading = false;
          state.lectures.push(action.payload);
        }
      )
      .addCase(createLecture.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          "An error occurred";
      })
      .addCase(updateLecture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateLecture.fulfilled,
        (state, action: PayloadAction<Lecture>) => {
          state.loading = false;
          const index = state.lectures.findIndex(
            (l) => l._id === action.payload._id
          );
          if (index !== -1) {
            state.lectures[index] = action.payload;
            if (state.activeLecture?._id === action.payload._id) {
              state.activeLecture = action.payload;
            }
          }
        }
      )
      .addCase(updateLecture.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          "An error occurred";
      })
      .addCase(deleteLecture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteLecture.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.lectures = state.lectures.filter(
            (lecture) => lecture._id !== action.payload
          );
          if (state.activeLecture?._id === action.payload) {
            state.activeLecture = null;
            localStorage.removeItem("activeLecture");
          }
        }
      )
      .addCase(deleteLecture.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          "An error occurred";
      })
      .addCase(
        addStudentsToLecture.fulfilled,
        (state, action: PayloadAction<Lecture>) => {
          const index = state.lectures.findIndex(
            (l) => l._id === action.payload._id
          );
          if (index !== -1) {
            state.lectures[index] = action.payload;
            if (state.activeLecture?._id === action.payload._id) {
              state.activeLecture = action.payload;
            }
          }
        }
      )
      .addCase(
        removeStudentsFromLecture.fulfilled,
        (state, action: PayloadAction<Lecture>) => {
          const index = state.lectures.findIndex(
            (l) => l._id === action.payload._id
          );
          if (index !== -1) {
            state.lectures[index] = action.payload;
            if (state.activeLecture?._id === action.payload._id) {
              state.activeLecture = action.payload;
            }
          }
        }
      )
      .addCase(
        addQuestionsToLecture.fulfilled,
        (state, action: PayloadAction<Lecture>) => {
          const index = state.lectures.findIndex(
            (l) => l._id === action.payload._id
          );
          if (index !== -1) {
            state.lectures[index] = action.payload;
            if (state.activeLecture?._id === action.payload._id) {
              state.activeLecture = action.payload;
            }
          }
        }
      )
      .addCase(
        removeQuestionsFromLecture.fulfilled,
        (state, action: PayloadAction<Lecture>) => {
          const index = state.lectures.findIndex(
            (l) => l._id === action.payload._id
          );
          if (index !== -1) {
            state.lectures[index] = action.payload;
            if (state.activeLecture?._id === action.payload._id) {
              state.activeLecture = action.payload;
            }
          }
        }
      )
      // Clear state on logout
      .addCase(logout.fulfilled, (state) => {
        state.lectures = [];
        state.activeLecture = null;
        state.loading = false;
        state.error = null;
        localStorage.removeItem("activeLecture");
      });
  },
});

export const { setActiveLecture, clearLectureError } = lectureSlice.actions;
export default lectureSlice.reducer;
