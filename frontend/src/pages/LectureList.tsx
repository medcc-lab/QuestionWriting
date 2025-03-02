import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import {
  fetchLectures,
  setActiveLecture,
  deleteLecture,
  createLecture,
} from "../store/slices/lectureSlice";
import { Lecture } from "../types/lecture";
import {
  Button,
  Card,
  Container,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { toast } from "react-toastify";

const LectureList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { lectures, loading, error } = useAppSelector(
    (state) => state.lectures
  );
  const { user } = useAppSelector((state) => state.auth);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState("");
  const [newLectureDescription, setNewLectureDescription] = useState("");

  useEffect(() => {
    dispatch(fetchLectures());
  }, [dispatch]);

  const handleSelectLecture = (lecture: Lecture) => {
    dispatch(setActiveLecture(lecture));
    // Navigate back to the previous page with the selected lecture, or to questions if there's no history
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(`/questions?lectureId=${lecture._id}`);
    }
  };

  const handleDeleteLecture = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this lecture? Questions will remain in the system."
      )
    ) {
      try {
        await dispatch(deleteLecture(id)).unwrap();
        toast.success("Lecture deleted successfully");
      } catch {
        toast.error("Failed to delete lecture");
      }
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid
          item
          xs={12}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4">Lectures</Typography>
          {user?.role === "faculty" && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setCreateDialogOpen(true)}
            >
              Create New Lecture
            </Button>
          )}
        </Grid>

        {lectures.map((lecture) => (
          <Grid item xs={12} sm={6} md={4} key={lecture._id}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">{lecture.title}</Typography>
              {lecture.description && (
                <Typography variant="body2" color="textSecondary">
                  {lecture.description}
                </Typography>
              )}
              <Typography variant="body2" color="textSecondary">
                Questions: {lecture.questions.length}
              </Typography>
              {user?.role === "faculty" && (
                <Typography variant="body2" color="textSecondary">
                  Students: {lecture.students.length}
                </Typography>
              )}
              <Grid container spacing={1} sx={{ mt: 2 }}>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSelectLecture(lecture)}
                  >
                    Select
                  </Button>
                </Grid>
                {user?.role === "faculty" && (
                  <>
                    <Grid item>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          navigate(`/lectures/${lecture._id}/edit`)
                        }
                      >
                        Edit
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteLecture(lecture._id)}
                      >
                        Delete
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Create New Lecture</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={newLectureTitle}
            onChange={(e) => setNewLectureTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newLectureDescription}
            onChange={(e) => setNewLectureDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!newLectureTitle.trim()) {
                toast.error("Please enter a title for the lecture");
                return;
              }

              try {
                await dispatch(
                  createLecture({
                    title: newLectureTitle.trim(),
                    description: newLectureDescription.trim() || undefined,
                  })
                ).unwrap();
                toast.success("Lecture created successfully");
                setCreateDialogOpen(false);
                setNewLectureTitle("");
                setNewLectureDescription("");
              } catch {
                toast.error("Failed to create lecture");
              }
            }}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LectureList;
