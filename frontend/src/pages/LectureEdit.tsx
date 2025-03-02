import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { store, RootState } from "../store";
import {
  updateLecture,
  addStudentsToLecture,
  removeStudentsFromLecture,
  addQuestionsToLecture,
  removeQuestionsFromLecture,
} from "../store/slices/lectureSlice";
import { User } from "../types/auth";
import { Question } from "../types/question";
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { toast } from "react-toastify";

const LectureEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { lectures } = useAppSelector((state) => state.lectures);
  const lecture = lectures.find((l) => l._id === id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (lecture) {
      setTitle(lecture.title);
      setDescription(lecture.description || "");
    }
  }, [lecture]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get auth token from store
        const token = (store.getState() as RootState).auth.token;
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const [studentsRes, questionsRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/users?role=student`,
            config
          ),
          axios.get(`${import.meta.env.VITE_API_URL}/questions`, config),
        ]);

        setAvailableStudents(studentsRes.data);
        setAvailableQuestions(questionsRes.data);
        setFetchError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setFetchError(
          `Failed to load students or questions: ${errorMessage}. Please try refreshing the page.`
        );
        toast.error("Failed to load required data");
      }
    };

    if (id) {
      void fetchData();
    }
  }, [id]);

  const handleSave = async () => {
    if (!lecture) return;

    try {
      await dispatch(
        updateLecture({
          id: lecture._id,
          data: {
            title,
            description: description || undefined,
          },
        })
      ).unwrap();
      toast.success("Lecture updated successfully");
      navigate("/lectures");
    } catch {
      toast.error("Failed to update lecture");
    }
  };

  const handleAddStudents = async () => {
    if (!lecture || !selectedStudents.length) return;

    try {
      await dispatch(
        addStudentsToLecture({
          lectureId: lecture._id,
          studentIds: selectedStudents,
        })
      ).unwrap();
      setSelectedStudents([]);
      setStudentDialogOpen(false);
      toast.success("Students added successfully");
    } catch {
      toast.error("Failed to add students");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!lecture) return;

    try {
      await dispatch(
        removeStudentsFromLecture({
          lectureId: lecture._id,
          studentIds: [studentId],
        })
      ).unwrap();
      toast.success("Student removed successfully");
    } catch {
      toast.error("Failed to remove student");
    }
  };

  if (!lecture) {
    return <Typography>Lecture not found</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4">Edit Lecture</Typography>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">Students</Typography>
                <Button
                  variant="contained"
                  onClick={() => setStudentDialogOpen(true)}
                >
                  Add Students
                </Button>
              </Grid>
              <Grid item xs={12}>
                <List>
                  {lecture.students.map((student: User) => (
                    <ListItem key={student._id}>
                      <ListItemText
                        primary={student.name}
                        secondary={student.email}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveStudent(student._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">Questions</Typography>
                <Button
                  variant="contained"
                  onClick={() => setQuestionDialogOpen(true)}
                >
                  Add Questions
                </Button>
              </Grid>
              <Grid item xs={12}>
                <List>
                  {availableQuestions
                    .filter((question) =>
                      lecture.questions.includes(question._id)
                    )
                    .map((question) => (
                      <ListItem key={question._id}>
                        <ListItemText
                          primary={question.question}
                          secondary={`${question.answers.length} answers`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
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
                                toast.error(
                                  "Failed to remove question from lecture"
                                );
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/lectures")}
            sx={{ ml: 2 }}
          >
            Cancel
          </Button>
        </Grid>
      </Grid>

      {/* Add Students Dialog */}
      <Dialog
        open={studentDialogOpen}
        onClose={() => setStudentDialogOpen(false)}
      >
        <DialogTitle>Add Students</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={availableStudents}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={availableStudents.filter((student) =>
              selectedStudents.includes(student._id)
            )}
            onChange={(_, newValue) => {
              setSelectedStudents(newValue.map((student) => student._id));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select Students"
                placeholder="Search students"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddStudents} variant="contained">
            Add Selected Students
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Questions Dialog */}
      <Dialog
        open={questionDialogOpen}
        onClose={() => setQuestionDialogOpen(false)}
      >
        <DialogTitle>Add Questions</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={availableQuestions}
            getOptionLabel={(option) => option.question}
            value={availableQuestions.filter((question) =>
              selectedQuestions.includes(question._id)
            )}
            onChange={(_, newValue) => {
              setSelectedQuestions(newValue.map((question) => question._id));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select Questions"
                placeholder="Search questions"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (selectedQuestions.length && lecture) {
                try {
                  await dispatch(
                    addQuestionsToLecture({
                      lectureId: lecture._id,
                      questionIds: selectedQuestions,
                    })
                  ).unwrap();
                  toast.success("Questions added successfully");
                  setSelectedQuestions([]);
                  setQuestionDialogOpen(false);
                } catch {
                  toast.error("Failed to add questions");
                }
              }
            }}
            variant="contained"
          >
            Add Selected Questions
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LectureEdit;
