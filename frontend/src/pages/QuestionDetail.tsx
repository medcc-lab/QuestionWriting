import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  Rating,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import {
  fetchQuestions,
  submitEditSuggestion,
  handleSuggestion,
  submitGrades,
  finalizeQuestion,
  deleteQuestion,
} from "../store/slices/questionSlice";
import {
  fetchLectures,
  removeQuestionsFromLecture,
} from "../store/slices/lectureSlice";
import { Question, Answer, EditSuggestion } from "../types/question";
import { RootState } from "../store";

interface EditFormData {
  suggestedQuestion: string;
  suggestedAnswers: Array<{
    text: string;
    isCorrect: boolean;
  }>;
}

const QuestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { questions } = useAppSelector((state: RootState) => state.questions);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { lectures } = useAppSelector((state) => state.lectures);

  const [editMode, setEditMode] = useState(false);
  const [gradeMode, setGradeMode] = useState(false);
  const [editData, setEditData] = useState<EditFormData>({
    suggestedQuestion: "",
    suggestedAnswers: [],
  });
  const [grades, setGrades] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState("");
  const [rebuttalComment, setRebuttalComment] = useState("");
  const [showRebuttalDialog, setShowRebuttalDialog] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string>("");
  const [suggestionAction, setSuggestionAction] = useState<
    "accepted" | "rejected"
  >("accepted");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const question = questions.find((q: Question) => q._id === id);

  useEffect(() => {
    if (!questions.length) {
      void dispatch(fetchQuestions());
    }
    void dispatch(fetchLectures());
  }, [dispatch, questions.length]);

  useEffect(() => {
    if (question) {
      setEditData((prev: EditFormData) => ({
        ...prev,
        suggestedQuestion: question.question,
        suggestedAnswers: question.answers.map((a: Answer) => ({
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      }));
    }
  }, [question]);

  if (!question) {
    return <Typography>Question not found</Typography>;
  }

  const handleGradeChange = (itemId: string, value: number | null) => {
    if (value) {
      setGrades((prev) => ({ ...prev, [itemId]: value }));
    }
  };

  const handleSubmitGrades = async () => {
    if (Object.keys(grades).length === 0) {
      setError("Please provide at least one grade");
      return;
    }

    const gradeData = {
      questionScore: grades["question"],
      answerGrades: Object.entries(grades)
        .filter(([key]) => key !== "question")
        .map(([answerId, score]) => ({
          answerId,
          score: score as 1 | 2 | 3,
        })),
    };

    try {
      await dispatch(
        submitGrades({ questionId: question._id, grades: gradeData })
      ).unwrap();
      setGradeMode(false);
      setGrades({});
      setError("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to submit grades");
      }
    }
  };

  const handleEditSubmit = async () => {
    try {
      const result = await dispatch(
        submitEditSuggestion({
          questionId: question._id,
          suggestion: editData,
        })
      ).unwrap();

      if (result) {
        setEditMode(false);
        setError("");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to submit suggestion");
      }
    }
  };

  const openRebuttalDialog = (
    suggestionId: string,
    action: "accepted" | "rejected"
  ) => {
    setSelectedSuggestionId(suggestionId);
    setSuggestionAction(action);
    setShowRebuttalDialog(true);
  };

  const handleSuggestionAction = async () => {
    setShowRebuttalDialog(false); // Close dialog immediately
    try {
      const result = await dispatch(
        handleSuggestion({
          questionId: question._id,
          suggestionId: selectedSuggestionId,
          status: suggestionAction,
          rebuttalComment,
        })
      ).unwrap();

      if (result) {
        setRebuttalComment("");
        setSelectedSuggestionId("");
        setSuggestionAction("accepted");
        setError("");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to handle suggestion");
      }
      setShowRebuttalDialog(true); // Only reopen on error
    }
  };

  const handleFinalize = async () => {
    try {
      await dispatch(finalizeQuestion(question._id)).unwrap();
      setError("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to finalize question");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteQuestion(question._id)).unwrap();
      navigate("/questions");
      setError("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete question");
      }
    }
  };

  const canDelete =
    user?.role === "faculty" || // faculty can delete any question
    (!question.isFinal && user?._id === question.owner._id); // non-faculty can only delete their own non-final questions

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h4">
            {editMode ? "Edit Question" : question.question}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {question.isFinal && <Chip label="Final" color="success" />}
            <Chip
              label={
                question.owner._id === user?._id
                  ? "By you"
                  : `By ${question.owner.name}`
              }
              variant="outlined"
              color={question.owner._id === user?._id ? "secondary" : "default"}
            />
          </Box>
        </Box>

        {/* Add Lectures Section */}
        {!editMode && !gradeMode && (
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Included in Lectures:
            </Typography>
            <List dense>
              {lectures
                .filter((lecture) => lecture.questions.includes(question._id))
                .map((lecture) => (
                  <ListItem
                    key={lecture._id}
                    secondaryAction={
                      user?.role === "faculty" && (
                        <IconButton
                          edge="end"
                          aria-label="remove from lecture"
                          onClick={async () => {
                            try {
                              await dispatch(
                                removeQuestionsFromLecture({
                                  lectureId: lecture._id,
                                  questionIds: [question._id],
                                })
                              ).unwrap();
                              toast.success("Question removed from lecture");
                            } catch {
                              toast.error("Failed to remove from lecture");
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={lecture.title}
                      secondary={`by ${lecture.faculty.name}`}
                    />
                  </ListItem>
                ))}
            </List>
            {lectures.filter((lecture) =>
              lecture.questions.includes(question._id)
            ).length === 0 && (
              <Typography color="text.secondary">
                Not assigned to any lectures yet.
              </Typography>
            )}
          </Box>
        )}

        {!editMode && !gradeMode && (
          <Box sx={{ mt: 2 }}>
            {question.answers.map((answer: Answer, index: number) => (
              <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                <Typography>
                  {answer.text}
                  {answer.isCorrect && (
                    <Chip
                      label="Correct"
                      color="primary"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {editMode && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Suggested Question"
              value={editData.suggestedQuestion}
              onChange={(e) =>
                setEditData((prev: EditFormData) => ({
                  ...prev,
                  suggestedQuestion: e.target.value,
                }))
              }
              sx={{ mb: 2 }}
            />
            {editData.suggestedAnswers?.map(
              (answer: { text: string; isCorrect: boolean }, index: number) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Answer ${index + 1}`}
                    value={answer.text}
                    onChange={(e) => {
                      const newAnswers = [...editData.suggestedAnswers];
                      newAnswers[index] = {
                        ...newAnswers[index],
                        text: e.target.value,
                      };
                      setEditData((prev: EditFormData) => ({
                        ...prev,
                        suggestedAnswers: newAnswers,
                      }));
                    }}
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={answer.isCorrect}
                        onChange={(e) => {
                          const newAnswers = [...editData.suggestedAnswers];
                          newAnswers[index] = {
                            ...newAnswers[index],
                            isCorrect: e.target.checked,
                          };
                          setEditData((prev: EditFormData) => ({
                            ...prev,
                            suggestedAnswers: newAnswers,
                          }));
                        }}
                      />
                    }
                    label="This is a correct answer"
                  />
                </Box>
              )
            )}
          </Box>
        )}

        {gradeMode && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Question Grade
            </Typography>
            <Rating
              max={3}
              value={grades["question"] || 0}
              onChange={(_, value) => handleGradeChange("question", value)}
            />
            <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
              Answer Grades
            </Typography>
            {question.answers.map((answer, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography gutterBottom>{answer.text}</Typography>
                <Rating
                  max={3}
                  value={grades[answer._id!] || 0}
                  onChange={(_, value) => handleGradeChange(answer._id!, value)}
                />
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          {!editMode && !gradeMode && (
            <>
              {!question.isFinal && (
                <>
                  {user?._id !== question.owner._id && (
                    <>
                      <Button
                        variant="contained"
                        onClick={() => setEditMode(true)}
                      >
                        Suggest Edit
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => setGradeMode(true)}
                      >
                        Grade Question
                      </Button>
                    </>
                  )}
                  {(user?.role === "faculty" ||
                    user?._id === question.owner._id) && (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleFinalize}
                    >
                      Finalize Question
                    </Button>
                  )}
                </>
              )}
              {canDelete && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Question
                </Button>
              )}
            </>
          )}
          {editMode && (
            <>
              <Button variant="contained" onClick={handleEditSubmit}>
                Submit Edit
              </Button>
              <Button variant="outlined" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </>
          )}
          {gradeMode && (
            <>
              <Button variant="contained" onClick={handleSubmitGrades}>
                Submit Grades
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setGradeMode(false);
                  setGrades({});
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* Edit Suggestions Section */}
      {question.editSuggestions.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Edit Suggestions
          </Typography>
          {question.editSuggestions.map(
            (suggestion: EditSuggestion, index: number) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">
                      Suggestion by {suggestion.student.name}
                    </Typography>
                    <Chip
                      label={suggestion.status}
                      color={
                        suggestion.status === "accepted"
                          ? "success"
                          : suggestion.status === "rejected"
                          ? "error"
                          : "default"
                      }
                    />
                  </Box>

                  {/* Question Changes */}
                  {suggestion.suggestedQuestion &&
                    suggestion.suggestedQuestion !== question.question && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Question Changes:
                        </Typography>
                        <Stack spacing={2}>
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: "grey.50",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Original:
                            </Typography>
                            <Typography>{question.question}</Typography>
                          </Paper>
                          <Paper
                            sx={{
                              p: 2,
                              border: "2px solid",
                              borderColor: "primary.main",
                              bgcolor: "background.paper",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="primary"
                              gutterBottom
                            >
                              Suggested:
                            </Typography>
                            <Typography>
                              {suggestion.suggestedQuestion}
                            </Typography>
                          </Paper>
                        </Stack>
                      </Box>
                    )}

                  {/* Answer Changes */}
                  {suggestion.suggestedAnswers &&
                    suggestion.suggestedAnswers.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Answer Changes:
                        </Typography>
                        {suggestion.suggestedAnswers.map(
                          (suggestedAnswer, idx) => {
                            const originalAnswer = question.answers[idx];
                            const hasChanges =
                              originalAnswer &&
                              (originalAnswer.text !== suggestedAnswer.text ||
                                originalAnswer.isCorrect !==
                                  suggestedAnswer.isCorrect);

                            if (!hasChanges) return null;

                            return (
                              <Box key={idx} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Answer {idx + 1}:
                                </Typography>
                                <Stack spacing={2}>
                                  <Paper
                                    sx={{
                                      p: 2,
                                      bgcolor: "grey.50",
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle2"
                                      color="text.secondary"
                                      gutterBottom
                                    >
                                      Original:
                                    </Typography>
                                    <Typography>
                                      {originalAnswer.text}
                                      {originalAnswer.isCorrect && (
                                        <Chip
                                          label="Correct"
                                          size="small"
                                          sx={{ ml: 1 }}
                                        />
                                      )}
                                    </Typography>
                                  </Paper>
                                  <Paper
                                    sx={{
                                      p: 2,
                                      border: "2px solid",
                                      borderColor: "primary.main",
                                      bgcolor: "background.paper",
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle2"
                                      color="primary"
                                      gutterBottom
                                    >
                                      Suggested:
                                    </Typography>
                                    <Typography>
                                      {suggestedAnswer.text}
                                      {suggestedAnswer.isCorrect && (
                                        <Chip
                                          label="Correct"
                                          color="primary"
                                          size="small"
                                          sx={{ ml: 1 }}
                                        />
                                      )}
                                    </Typography>
                                  </Paper>
                                </Stack>
                              </Box>
                            );
                          }
                        )}
                      </Box>
                    )}

                  {suggestion.rebuttalComment && (
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle2">
                        Faculty Comment:
                      </Typography>
                      <Typography color="text.secondary">
                        {suggestion.rebuttalComment}
                      </Typography>
                    </Box>
                  )}

                  {suggestion.status === "pending" &&
                    (user?.role === "faculty" ||
                      user?._id === question.owner._id) && (
                      <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() =>
                            openRebuttalDialog(suggestion._id!, "accepted")
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() =>
                            openRebuttalDialog(suggestion._id!, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                </CardContent>
              </Card>
            )
          )}
        </Box>
      )}

      {/* Rebuttal Dialog */}
      <Dialog
        open={showRebuttalDialog}
        onClose={() => setShowRebuttalDialog(false)}
      >
        <DialogTitle>
          {suggestionAction === "accepted" ? "Accept" : "Reject"} Suggestion
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment (Optional)"
            value={rebuttalComment}
            onChange={(e) => setRebuttalComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRebuttalDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={suggestionAction === "accepted" ? "success" : "error"}
            onClick={handleSuggestionAction}
          >
            {suggestionAction === "accepted" ? "Accept" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          <Typography>
            This irreversibly deletes this question. Proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionDetail;
