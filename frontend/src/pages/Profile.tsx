import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { RootState } from "../store";
import { getLeaderboard } from "../store/slices/authSlice";

interface LeaderboardEntry {
  _id: string;
  name: string;
  score: number;
}

const getRankColor = (index: number): string => {
  switch (index) {
    case 0:
      return "#FFD700"; // Gold
    case 1:
      return "#C0C0C0"; // Silver
    case 2:
      return "#CD7F32"; // Bronze
    default:
      return "transparent";
  }
};

const Profile = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { questions } = useAppSelector((state: RootState) => state.questions);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const userQuestions = questions.filter((q) => q.owner._id === user?._id);
  const acceptedSuggestions = questions.reduce((count, question) => {
    return (
      count +
      question.editSuggestions.filter(
        (suggestion) =>
          suggestion.student._id === user?._id &&
          suggestion.status === "accepted"
      ).length
    );
  }, 0);

  useEffect(() => {
    if (user?.role === "faculty") {
      setIsLoadingLeaderboard(true);
      dispatch(getLeaderboard())
        .unwrap()
        .then((data) => {
          setLeaderboard(data);
        })
        .finally(() => {
          setIsLoadingLeaderboard(false);
        });
    }
  }, [dispatch, user?.role]);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4 }}>
      <Grid container spacing={4}>
        {/* User Profile Section */}
        <Grid item xs={12} md={user?.role === "faculty" ? 8 : 12}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Profile
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {user?.name}
              </Typography>
              <Typography color="textSecondary">{user?.email}</Typography>
              <Typography color="textSecondary">Role: {user?.role}</Typography>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: "center",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Typography variant="h3" color="primary">
                  {user?.score}
                </Typography>
                <Typography variant="subtitle1">Total Points</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: "center",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Typography variant="h3" color="primary">
                  {userQuestions.length}
                </Typography>
                <Typography variant="subtitle1">Questions Created</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: "center",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Typography variant="h3" color="primary">
                  {acceptedSuggestions}
                </Typography>
                <Typography variant="subtitle1">
                  Accepted Suggestions
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {userQuestions.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                My Questions
              </Typography>
              {userQuestions.map((question) => (
                <Paper key={question._id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6">{question.question}</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography color="textSecondary">
                      Status: {question.isFinal ? "Finalized" : "In Progress"}
                    </Typography>
                    <Typography color="textSecondary">
                      Suggestions: {question.editSuggestions.length}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Grid>

        {/* Leaderboard Section for Faculty */}
        {user?.role === "faculty" && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="h5" gutterBottom align="center">
                Student Leaderboard
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {isLoadingLeaderboard ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {leaderboard.map((student, index) => (
                    <ListItem
                      key={student._id}
                      divider={index !== leaderboard.length - 1}
                      sx={{
                        bgcolor:
                          index < 3
                            ? `${getRankColor(index)}11`
                            : "transparent",
                        borderRadius: 1,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {index < 3 && (
                                <EmojiEventsIcon
                                  sx={{ color: getRankColor(index) }}
                                />
                              )}
                              <Typography>
                                {index + 1}. {student.name}
                              </Typography>
                            </Box>
                            <Typography color="primary" fontWeight="bold">
                              {student.score} pts
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {leaderboard.length === 0 && (
                    <Typography
                      color="textSecondary"
                      align="center"
                      sx={{ py: 2 }}
                    >
                      No students have earned points yet
                    </Typography>
                  )}
                </List>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Profile;
