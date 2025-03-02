const express = require("express");
const router = express.Router();
const { protect, isFaculty } = require("../middleware/auth");
const {
  getLectures,
  createLecture,
  updateLecture,
  deleteLecture,
  addStudents,
  removeStudents,
  addQuestions,
  removeQuestions,
} = require("../controllers/lectureController");

// Base route: /api/lectures
router.use(protect); // All lecture routes require authentication

// Public routes (both faculty and students)
router.get("/", getLectures);

// Faculty-only routes
router.post("/", isFaculty, createLecture);
router
  .route("/:id")
  .put(isFaculty, updateLecture)
  .delete(isFaculty, deleteLecture);

router
  .route("/:id/students")
  .post(isFaculty, addStudents)
  .delete(isFaculty, removeStudents);

router
  .route("/:id/questions")
  .post(isFaculty, addQuestions)
  .delete(isFaculty, removeQuestions);

module.exports = router;
