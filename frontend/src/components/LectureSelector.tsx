import React, { useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchLectures, setActiveLecture } from "../store/slices/lectureSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lecture } from "../types/lecture";

interface LectureSelectorProps {
  open: boolean;
  onClose: () => void;
}

const LectureSelector: React.FC<LectureSelectorProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lectures, loading, error } = useAppSelector((state) => state.lectures);
  const { user, token } = useAppSelector((state) => state.auth);
  const hasFetchedRef = useRef(false);
  const hasSetInitialLectureRef = useRef(false);

  // Memoize the fetch function to prevent it from changing on every render
  const fetchLecturesData = useCallback(() => {
    if (token && !hasFetchedRef.current) {
      console.log("Dispatching fetchLectures");
      hasFetchedRef.current = true;
      dispatch(fetchLectures());
    }
  }, [dispatch, token]);

  // Handle initial fetch when dialog opens
  useEffect(() => {
    if (open) {
      fetchLecturesData();
    } else {
      // Reset the fetch flag when dialog closes
      hasFetchedRef.current = false;
    }
  }, [open, fetchLecturesData]);

  // Handle lecture selection from URL
  useEffect(() => {
    const lectureId = searchParams.get("lectureId");
    if (!hasSetInitialLectureRef.current && lectureId && lectures.length > 0 && !loading) {
      const lecture = lectures.find((l) => l._id === lectureId);
      if (lecture) {
        console.log("Setting active lecture from URL:", lecture.title);
        dispatch(setActiveLecture(lecture));
        hasSetInitialLectureRef.current = true;
      }
    }
  }, [lectures, searchParams, dispatch, loading]);

  const handleSelectLecture = async (lecture: Lecture) => {
    await dispatch(setActiveLecture(lecture));
    const currentPath = window.location.pathname;
    const newPath = currentPath === "/lectures" ? "/questions" : currentPath;
    navigate(`${newPath}?lectureId=${lecture._id}`);
    onClose();
  };

  const handleClose = (_: object, reason: string) => {
    if (loading && (reason === "backdropClick" || reason === "escapeKeyDown")) {
      return;
    }
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>Select a Lecture</DialogTitle>
      <DialogContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : lectures.length === 0 ? (
          <Typography>
            {user.role === "faculty"
              ? "You haven't created any lectures yet. Create one from the Lectures page."
              : "You haven't been assigned to any lectures yet."}
          </Typography>
        ) : (
          <List>
            {lectures.map((lecture) => (
              <ListItem key={lecture._id} disablePadding>
                <ListItemButton onClick={() => handleSelectLecture(lecture)}>
                  <ListItemText
                    primary={lecture.title}
                    secondary={lecture.description || "No description"}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            onClose();
            navigate("/lectures");
          }}
          disabled={loading}
        >
          {user.role === "faculty" ? "Manage Lectures" : "View All Lectures"}
        </Button>
        {user.role === "faculty" && (
          <Button
            onClick={() => {
              dispatch(setActiveLecture(null));
              const currentPath = window.location.pathname;
              navigate(currentPath); // Remove lectureId from URL
              onClose();
            }}
            disabled={loading}
          >
            Continue Without Selection
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LectureSelector;
