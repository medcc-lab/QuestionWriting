const express = require("express");
const router = express.Router();
const { protect, isFaculty } = require("../middleware/auth");
const {
  createQuestion,
  getQuestions,
  submitEditSuggestion,
  handleSuggestion,
  submitGrades,
  finalizeQuestion,
  addFacultyComment,
  deleteQuestion,
} = require("../controllers/questionController");

router.route("/").post(protect, createQuestion).get(protect, getQuestions);

router.post("/:id/suggestions", protect, submitEditSuggestion);
router.put("/:id/suggestions/:suggestionId", protect, handleSuggestion);
router.post("/:id/grades", protect, submitGrades);
router.put("/:id/finalize", protect, isFaculty, finalizeQuestion);
router.post("/:id/comments", protect, isFaculty, addFacultyComment);
router.delete("/:id", protect, isFaculty, deleteQuestion);

module.exports = router;
