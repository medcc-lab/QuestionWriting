import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { toast } from "react-toastify";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { RootState } from "../store";
import { getConfig, updateConfig } from "../store/slices/scoringSlice";

const ScoringConfig = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { config, error, isLoading } = useAppSelector(
    (state: RootState) => state.scoring
  );

  const [formData, setFormData] = useState({
    newQuestionScore: "",
    editSuggestionBaseScore: "",
    editAcceptBonus: "",
    editRejectPenalty: "",
    gradingScore: "",
  });

  useEffect(() => {
    if (user?.role !== "faculty") {
      navigate("/");
      return;
    }
    dispatch(getConfig());
  }, [dispatch, navigate, user]);

  useEffect(() => {
    if (config) {
      setFormData({
        newQuestionScore: config.newQuestionScore.toString(),
        editSuggestionBaseScore: config.editSuggestionBaseScore.toString(),
        editAcceptBonus: config.editAcceptBonus.toString(),
        editRejectPenalty: config.editRejectPenalty.toString(),
        gradingScore: config.gradingScore.toString(),
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericData = {
      newQuestionScore: parseInt(formData.newQuestionScore),
      editSuggestionBaseScore: parseInt(formData.editSuggestionBaseScore),
      editAcceptBonus: parseInt(formData.editAcceptBonus),
      editRejectPenalty: parseInt(formData.editRejectPenalty),
      gradingScore: parseInt(formData.gradingScore),
    };

    try {
      await dispatch(updateConfig(numericData)).unwrap();
      toast.success("Scoring configuration updated successfully");
    } catch (err) {
      toast.error("Failed to update scoring configuration");
    }
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  if (user?.role !== "faculty") {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Scoring Configuration
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Question Score"
              type="number"
              value={formData.newQuestionScore}
              onChange={handleChange("newQuestionScore")}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Edit Suggestion Base Score"
              type="number"
              value={formData.editSuggestionBaseScore}
              onChange={handleChange("editSuggestionBaseScore")}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Edit Accept Bonus"
              type="number"
              value={formData.editAcceptBonus}
              onChange={handleChange("editAcceptBonus")}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Edit Reject Penalty"
              type="number"
              value={formData.editRejectPenalty}
              onChange={handleChange("editRejectPenalty")}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Grading Score"
              type="number"
              value={formData.gradingScore}
              onChange={handleChange("gradingScore")}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              type="submit"
              size="large"
              disabled={isLoading}
            >
              Save Configuration
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ScoringConfig;
