import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import {
  QuestionState,
  Question,
  CreateQuestionData,
  EditSuggestionData,
  GradeSubmissionData,
} from "../../types/question";

const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
}/questions`;

const initialState: QuestionState = {
  questions: [],
  currentQuestion: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchQuestions = createAsyncThunk(
  "questions/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      const response = await axios.get(`${API_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch questions"
      );
    }
  }
);

export const createQuestion = createAsyncThunk(
  "questions/create",
  async (questionData: CreateQuestionData, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      const response = await axios.post(`${API_URL}`, questionData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to create question"
      );
    }
  }
);

export const submitEditSuggestion = createAsyncThunk(
  "questions/submitEditSuggestion",
  async (
    {
      questionId,
      suggestion,
    }: { questionId: string; suggestion: EditSuggestionData },
    { getState, rejectWithValue }
  ) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      const response = await axios.post(
        `${API_URL}/${questionId}/suggestions`,
        suggestion,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to submit suggestion"
      );
    }
  }
);

export const handleSuggestion = createAsyncThunk(
  "questions/handleSuggestion",
  async (
    {
      questionId,
      suggestionId,
      status,
      rebuttalComment,
    }: {
      questionId: string;
      suggestionId: string;
      status: "accepted" | "rejected";
      rebuttalComment?: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      const response = await axios.put(
        `${API_URL}/${questionId}/suggestions/${suggestionId}`,
        { status, rebuttalComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to handle suggestion"
      );
    }
  }
);

export const submitGrades = createAsyncThunk(
  "questions/submitGrades",
  async (
    { questionId, grades }: { questionId: string; grades: GradeSubmissionData },
    { getState, rejectWithValue }
  ) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      const response = await axios.post(
        `${API_URL}/${questionId}/grades`,
        grades,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to submit grades"
      );
    }
  }
);

export const finalizeQuestion = createAsyncThunk(
  "questions/finalize",
  async (questionId: string, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      const response = await axios.put(
        `${API_URL}/${questionId}/finalize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to finalize question"
      );
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  "questions/delete",
  async (questionId: string, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { token },
      } = getState() as { auth: { token: string } };
      await axios.delete(`${API_URL}/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return questionId;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete question"
      );
    }
  }
);

const questionSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<Question | null>) => {
      state.currentQuestion = action.payload;
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Questions
      .addCase(fetchQuestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.questions = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Question
      .addCase(createQuestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.questions.push(action.payload);
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Submit Edit Suggestion
      .addCase(submitEditSuggestion.pending, (state) => {
        state.error = null;
      })
      .addCase(submitEditSuggestion.fulfilled, (state, action) => {
        state.error = null;
        const index = state.questions.findIndex(
          (q) => q._id === action.payload._id
        );
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
        if (state.currentQuestion?._id === action.payload._id) {
          state.currentQuestion = action.payload;
        }
      })
      .addCase(submitEditSuggestion.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Handle Suggestion
      .addCase(handleSuggestion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(handleSuggestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const index = state.questions.findIndex(
          (q) => q._id === action.payload._id
        );
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
        if (state.currentQuestion?._id === action.payload._id) {
          state.currentQuestion = action.payload;
        }
      })
      .addCase(handleSuggestion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Submit Grades
      .addCase(submitGrades.pending, (state) => {
        state.error = null;
      })
      .addCase(submitGrades.fulfilled, (state, action) => {
        state.error = null;
        const index = state.questions.findIndex(
          (q) => q._id === action.payload._id
        );
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
        if (state.currentQuestion?._id === action.payload._id) {
          state.currentQuestion = action.payload;
        }
      })
      .addCase(submitGrades.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Finalize Question
      .addCase(finalizeQuestion.pending, (state) => {
        state.error = null;
      })
      .addCase(finalizeQuestion.fulfilled, (state, action) => {
        state.error = null;
        const index = state.questions.findIndex(
          (q) => q._id === action.payload._id
        );
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
        if (state.currentQuestion?._id === action.payload._id) {
          state.currentQuestion = action.payload;
        }
      })
      .addCase(finalizeQuestion.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete Question
      .addCase(deleteQuestion.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.error = null;
        state.questions = state.questions.filter(
          (q) => q._id !== action.payload
        );
        state.currentQuestion = null;
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentQuestion, resetError } = questionSlice.actions;
export default questionSlice.reducer;
