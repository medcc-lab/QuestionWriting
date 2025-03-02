import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ViewComfyIcon from "@mui/icons-material/ViewComfy";
import ViewCompactIcon from "@mui/icons-material/ViewCompact";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { fetchQuestions, deleteQuestion } from "../store/slices/questionSlice";
import { addQuestionsToLecture } from "../store/slices/lectureSlice";
import { RootState } from "../store";
import { Question } from "../types/question";
import { toast } from "react-toastify";

type ViewMode = "comfortable" | "cozy" | "compact";

const QuestionList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { questions, isLoading } = useAppSelector(
    (state: RootState) => state.questions
  );
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { activeLecture } = useAppSelector(
    (state: RootState) => state.lectures
  );
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable");

  useEffect(() => {
    void dispatch(fetchQuestions());
  }, [dispatch]);

  // Only set lecture filter from URL params on mount
  useEffect(() => {
    const lectureId = searchParams.get("lectureId");
    if (lectureId) {
      setFilter("lecture");
    }
  }, [searchParams]); // We want this to run only when searchParams changes

  // Reset filter when no lecture is active and current filter is lecture
  useEffect(() => {
    if (!activeLecture && filter === "lecture") {
      setFilter("all");
    }
  }, [activeLecture, filter]);

  const filteredQuestions = questions.filter((question: Question) => {
    const matchesSearch = question.question
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // For students, only show questions from active lecture
    if (user?.role === "student") {
      if (!activeLecture) return false;
      return activeLecture.questions.includes(question._id);
    }

    // For faculty, apply filters
    switch (filter) {
      case "mine":
        return question.owner._id === user?._id;
      case "pending":
        return !question.isFinal;
      case "final":
        return question.isFinal;
      case "lecture":
        return activeLecture?.questions.includes(question._id) ?? false;
      case "all":
        return true;
      default:
        return false; // Default to not showing if filter value is unknown
    }
  });

  const handleAddToLecture = async (questionId: string) => {
    if (!activeLecture) {
      toast.error("Please select a lecture first");
      return;
    }

    try {
      await dispatch(
        addQuestionsToLecture({
          lectureId: activeLecture._id,
          questionIds: [questionId],
        })
      ).unwrap();
      toast.success("Question added to lecture successfully");
    } catch {
      toast.error("Failed to add question to lecture");
    }
  };

  const handleQuestionClick = (questionId: string) => {
    navigate(`/questions/${questionId}`);
  };

  const canDelete = (question: Question) =>
    user?.role === "faculty" || // faculty can delete any question
    (!question.isFinal && user?._id === question.owner._id); // non-faculty can only delete their own non-final questions

  const handleDeleteClick = (
    event?: React.MouseEvent<HTMLButtonElement>,
    questionId?: string
  ) => {
    if (event) {
      event.stopPropagation();
    }
    if (questionId) {
      setQuestionToDelete(questionId);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;

    try {
      await dispatch(deleteQuestion(questionToDelete)).unwrap();
      toast.success("Question deleted successfully");
    } catch {
      toast.error("Failed to delete question");
    }
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  // Get card styles based on view mode
  const getCardStyles = (mode: ViewMode) => {
    const baseStyles = {
      cursor: "pointer",
      "&:hover": {
        bgcolor: "action.hover",
      },
    };

    switch (mode) {
      case "compact":
        return {
          ...baseStyles,
          "& .MuiCardContent-root": {
            p: 1,
            "&:last-child": { pb: 1 },
          },
          "& .MuiTypography-h6": {
            fontSize: "1rem",
            lineHeight: 1.2,
          },
          "& .MuiChip-root": {
            height: 24,
            fontSize: "0.75rem",
          },
          "& .MuiButton-root": {
            py: 0.5,
            minHeight: 0,
          },
        };
      case "cozy":
        return {
          ...baseStyles,
          "& .MuiCardContent-root": {
            p: 2,
            "&:last-child": { pb: 2 },
          },
          "& .MuiTypography-h6": {
            fontSize: "1.1rem",
          },
        };
      default: // comfortable
        return baseStyles;
    }
  };

  // Get grid spacing based on view mode
  const getGridSpacing = (mode: ViewMode) => {
    switch (mode) {
      case "compact":
        return 1;
      case "cozy":
        return 2;
      default:
        return 3;
    }
  };

  if (isLoading) {
    return <Typography>Loading questions...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Multiple Choice Questions
          {activeLecture && (
            <Typography variant="subtitle1" color="text.secondary">
              Current Lecture: {activeLecture.title}
            </Typography>
          )}
        </Typography>

        {!activeLecture && user?.role === "student" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please select a lecture from the Lectures page to view questions.
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Search Questions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel id="filter-label">Filter</InputLabel>
              <Select
                labelId="filter-label"
                id="filter-select"
                value={filter}
                label="Filter"
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFilter(newValue as string);
                }}
              >
                {user?.role === "faculty" ? (
                  [
                    <MenuItem key="all" value="all">
                      All Questions
                    </MenuItem>,
                    <MenuItem key="mine" value="mine">
                      My Questions
                    </MenuItem>,
                    <MenuItem key="pending" value="pending">
                      Pending Review
                    </MenuItem>,
                    <MenuItem key="final" value="final">
                      Finalized
                    </MenuItem>,
                    activeLecture && (
                      <MenuItem key="lecture" value="lecture">
                        Current Lecture
                      </MenuItem>
                    ),
                  ].filter(Boolean)
                ) : (
                  <MenuItem value="all">All Questions</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              aria-label="view mode"
              size="small"
              fullWidth
            >
              <ToggleButton value="comfortable" aria-label="comfortable view">
                <ViewComfyIcon />
              </ToggleButton>
              <ToggleButton value="cozy" aria-label="cozy view">
                <ViewModuleIcon />
              </ToggleButton>
              <ToggleButton value="compact" aria-label="compact view">
                <ViewCompactIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={getGridSpacing(viewMode)}>
        {filteredQuestions.map((question: Question) => (
          <Grid
            item
            xs={12}
            sm={viewMode === "compact" ? 6 : 12}
            md={viewMode === "compact" ? 4 : viewMode === "cozy" ? 6 : 12}
            key={question._id}
          >
            <Card
              sx={getCardStyles(viewMode)}
              onClick={() => handleQuestionClick(question._id)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb:
                      viewMode === "compact"
                        ? 0.5
                        : viewMode === "cozy"
                        ? 1
                        : 2,
                    flexWrap: viewMode === "compact" ? "wrap" : "nowrap",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      flex: 1,
                      mb: viewMode === "compact" && question.isFinal ? 0.5 : 0,
                    }}
                  >
                    {question.question}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {question.isFinal && <Chip label="Final" color="success" />}
                    {activeLecture?.questions.includes(question._id) && (
                      <Chip label="In Current Lecture" color="primary" />
                    )}
                    <Chip
                      label={
                        question.owner._id === user?._id
                          ? "By you"
                          : `By ${question.owner.name}`
                      }
                      variant="outlined"
                      color={
                        question.owner._id === user?._id
                          ? "secondary"
                          : "default"
                      }
                    />
                    {user?.role === "faculty" &&
                      activeLecture &&
                      !activeLecture.questions.includes(question._id) && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToLecture(question._id);
                          }}
                          size="small"
                          color="primary"
                          title="Add to current lecture"
                        >
                          <AddIcon />
                        </IconButton>
                      )}
                    {canDelete(question) && (
                      <IconButton
                        onClick={(e) => handleDeleteClick(e, question._id)}
                        size="small"
                        color="error"
                        sx={{
                          "&:hover": {
                            bgcolor: "error.light",
                            color: "common.white",
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: viewMode === "compact" ? "wrap" : "nowrap",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Typography
                      color="text.secondary"
                      variant={viewMode === "compact" ? "caption" : "body2"}
                    >
                      {question.answers.length} answers
                    </Typography>
                    <Typography
                      color="text.secondary"
                      variant={viewMode === "compact" ? "caption" : "body2"}
                    >
                      {question.editSuggestions.length} suggestions
                    </Typography>
                  </Box>
                  <Button
                    variant={viewMode === "compact" ? "text" : "contained"}
                    size={viewMode === "comfortable" ? "medium" : "small"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuestionClick(question._id);
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {filteredQuestions.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" align="center">
              No questions found matching your criteria.
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setQuestionToDelete(null);
        }}
      >
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this question? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setQuestionToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionList;
