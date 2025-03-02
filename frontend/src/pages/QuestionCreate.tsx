import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  Alert,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { createQuestion } from "../store/slices/questionSlice";
import { addQuestionsToLecture } from "../store/slices/lectureSlice";

const QuestionCreate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const { activeLecture } = useAppSelector((state) => state.lectures);
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [error, setError] = useState("");

  // Check if user can create questions (faculty or student with active lecture)
  if (user?.role === "student" && !activeLecture) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert severity="warning">
          Please select a lecture before creating questions. Go to the Lectures
          page to select one.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/lectures")}
        >
          Go to Lectures
        </Button>
      </Box>
    );
  }

  const handleAddAnswer = () => {
    if (answers.length < 4) {
      setAnswers([...answers, { text: "", isCorrect: false }]);
    }
  };

  const handleRemoveAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((_, i) => i !== index));
    }
  };

  const handleAnswerChange = (
    index: number,
    field: "text" | "isCorrect",
    value: string | boolean
  ) => {
    const newAnswers = answers.map((answer, i) => {
      if (i === index) {
        return { ...answer, [field]: value };
      }
      return answer;
    });
    setAnswers(newAnswers);
  };

  const validateForm = () => {
    if (!question.trim()) {
      setError("Question is required");
      return false;
    }

    if (!answers.some((answer) => answer.isCorrect)) {
      setError("At least one answer must be marked as correct");
      return false;
    }

    if (answers.some((answer) => !answer.text.trim())) {
      setError("All answer fields must be filled");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    const questionData = {
      question: question.trim(),
      answers: answers.map(({ text, isCorrect }) => ({
        text: text.trim(),
        isCorrect,
      })),
    };

    try {
      const newQuestion = await dispatch(createQuestion(questionData)).unwrap();

      // If student or has active lecture, add question to lecture automatically
      if (
        activeLecture &&
        (user?.role === "student" || searchParams.has("lectureId"))
      ) {
        await dispatch(
          addQuestionsToLecture({
            lectureId: activeLecture._id,
            questionIds: [newQuestion._id],
          })
        ).unwrap();
      }

      // Navigate back preserving the lecture context if it exists
      const lectureId = searchParams.get("lectureId");
      navigate(lectureId ? `/questions?lectureId=${lectureId}` : "/questions");
    } catch (err: unknown) {
      let message = "Failed to create question. Please try again.";
      if (err instanceof Error) {
        if (err.message.includes("Network Error")) {
          message = "Network error: Please check your internet connection.";
        } else if (err.message.includes("Validation Error")) {
          message =
            "Validation error: Please ensure all fields are correctly filled.";
        } else {
          message = err.message;
        }
      } else if (typeof err === "string") {
        message = err;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        message = (err as { message: string }).message;
      } else if (typeof err === "number") {
        message = `Error code: ${err}`;
      }
      setError(message);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 800, mx: "auto", mt: 4 }}
    >
      <Typography variant="h4" gutterBottom>
        Create New Question
        {activeLecture && (
          <Typography variant="subtitle1" color="text.secondary">
            For Lecture: {activeLecture.title}
          </Typography>
        )}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Question"
        multiline
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        sx={{ mb: 4 }}
      />

      <Typography variant="h6" gutterBottom>
        Answers (2-4)
      </Typography>

      {answers.map((answer, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <TextField
              fullWidth
              label={`Answer ${index + 1}`}
              value={answer.text}
              onChange={(e) =>
                handleAnswerChange(index, "text", e.target.value)
              }
            />
            <IconButton
              onClick={() => handleRemoveAnswer(index)}
              disabled={answers.length <= 2}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={answer.isCorrect}
                onChange={(e) =>
                  handleAnswerChange(index, "isCorrect", e.target.checked)
                }
              />
            }
            label="This is a correct answer"
          />
        </Paper>
      ))}

      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddAnswer}
          disabled={answers.length >= 4}
          variant="outlined"
        >
          Add Answer
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" color="primary" type="submit" size="large">
          Create Question
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            const lectureId = searchParams.get("lectureId");
            navigate(
              lectureId ? `/questions?lectureId=${lectureId}` : "/questions"
            );
          }}
          size="large"
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default QuestionCreate;
