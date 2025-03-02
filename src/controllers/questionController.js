const Question = require("../models/Question");
const User = require("../models/User");
const ScoringConfig = require("../models/ScoringConfig");

// @desc    Create a new MCQ
// @route   POST /api/questions
// @access  Private
const createQuestion = async (req, res) => {
  try {
    const { question, answers } = req.body;

    // Validate input before creating
    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (
      !answers ||
      !Array.isArray(answers) ||
      answers.length < 2 ||
      answers.length > 4
    ) {
      return res
        .status(400)
        .json({ message: "Questions must have between 2 and 4 answers" });
    }

    if (!answers.some((answer) => answer.isCorrect)) {
      return res
        .status(400)
        .json({ message: "At least one answer must be marked as correct" });
    }

    if (answers.some((answer) => !answer.text || !answer.text.trim())) {
      return res
        .status(400)
        .json({ message: "All answer fields must be filled" });
    }

    // Create and populate the question
    const newQuestion = await Question.create({
      owner: req.user._id,
      question: question.trim(),
      answers: answers.map((a) => ({
        ...a,
        text: a.text.trim(),
        grades: [], // Initialize empty grades array
      })),
      editSuggestions: [], // Initialize empty suggestions array
      grades: [], // Initialize empty grades array
      facultyComments: [], // Initialize empty comments array
      isFinal: false,
    });

    // Populate owner field before sending response
    await newQuestion.populate("owner", "name");

    // Award points for creating a question
    const config = await ScoringConfig.getConfig(req.user._id);
    if (config) {
      const user = await User.findById(req.user._id);
      user.score += config.newQuestionScore;
      await user.save();
    }

    return res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Create question error:", error);
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }
    return res.status(500).json({
      message: "Error creating question",
    });
  }
};

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("owner", "name")
      .populate("editSuggestions.student", "name")
      .populate("grades.student", "name")
      .populate("facultyComments.faculty", "name");
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching questions" });
  }
};

// @desc    Submit edit suggestion
// @route   POST /api/questions/:id/suggestions
// @access  Private
const submitEditSuggestion = async (req, res) => {
  try {
    const { suggestedQuestion, suggestedAnswers } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.isFinal) {
      return res
        .status(400)
        .json({ message: "Cannot edit finalized questions" });
    }

    const suggestion = {
      student: req.user._id,
      suggestedQuestion,
      suggestedAnswers,
    };

    question.editSuggestions.push(suggestion);
    await question.save();

    // Award base points for suggestion
    const config = await ScoringConfig.getConfig(req.user._id);
    if (config) {
      const user = await User.findById(req.user._id);
      user.score += config.editSuggestionBaseScore;
      await user.save();
    }

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: "Error submitting suggestion" });
  }
};

// @desc    Handle suggestion (accept/reject)
// @route   PUT /api/questions/:id/suggestions/:suggestionId
// @access  Private
const handleSuggestion = async (req, res) => {
  try {
    const { status, rebuttalComment } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const suggestion = question.editSuggestions.id(req.params.suggestionId);
    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    // Check if user is owner or faculty
    if (
      req.user.role !== "faculty" &&
      question.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    suggestion.status = status;
    suggestion.rebuttalComment = rebuttalComment;

    // Update score based on acceptance/rejection
    const config = await ScoringConfig.getConfig(req.user._id);
    if (config) {
      const student = await User.findById(suggestion.student);
      student.score +=
        status === "accepted"
          ? config.editAcceptBonus
          : config.editRejectPenalty;
      await student.save();
    }

    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Error handling suggestion" });
  }
};

// @desc    Submit grades for question/answers
// @route   POST /api/questions/:id/grades
// @access  Private
const submitGrades = async (req, res) => {
  try {
    const { questionScore, answerGrades } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.isFinal) {
      return res
        .status(400)
        .json({ message: "Cannot grade finalized questions" });
    }

    // Add question grade
    if (questionScore) {
      question.grades.push({
        student: req.user._id,
        questionScore,
      });
    }

    // Add answer grades
    answerGrades.forEach(({ answerId, score }) => {
      const answer = question.answers.id(answerId);
      if (answer) {
        answer.grades.push({
          student: req.user._id,
          score,
        });
      }
    });

    await question.save();

    // Award points for grading
    const config = await ScoringConfig.getConfig(req.user._id);
    if (config) {
      const user = await User.findById(req.user._id);
      user.score += config.gradingScore;
      await user.save();
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Error submitting grades" });
  }
};

// @desc    Finalize question
// @route   PUT /api/questions/:id/finalize
// @access  Private/Faculty
const finalizeQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("owner")
      .populate("editSuggestions.student")
      .populate("grades.student");

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const config = await ScoringConfig.getConfig(req.user._id);
    if (!config) {
      return res
        .status(500)
        .json({ message: "Scoring configuration not found" });
    }

    // 1. Award credits to owner for entering the MCQ
    question.owner.score += config.newQuestionScore;
    await question.owner.save();

    // 2. Award/deduct credits for edit suggestions
    const processedStudents = new Set(); // To handle multiple suggestions from same student
    for (const suggestion of question.editSuggestions) {
      if (!processedStudents.has(suggestion.student._id.toString())) {
        // Base credits for suggesting
        suggestion.student.score += config.editSuggestionBaseScore;

        // Additional bonus/penalty for acceptance/rejection
        if (suggestion.status === "accepted") {
          suggestion.student.score += config.editAcceptBonus;
        } else if (suggestion.status === "rejected") {
          suggestion.student.score += config.editRejectPenalty;
        }

        await suggestion.student.save();
        processedStudents.add(suggestion.student._id.toString());
      }
    }

    // 3. Award credit for each user who graded the MCQ
    const gradingStudents = new Set(); // To ensure each student is counted once
    // Check question grades
    for (const grade of question.grades) {
      if (!gradingStudents.has(grade.student._id.toString())) {
        grade.student.score += config.gradingScore;
        await grade.student.save();
        gradingStudents.add(grade.student._id.toString());
      }
    }

    question.isFinal = true;
    await question.save();

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Error finalizing question" });
  }
};

// @desc    Add faculty comment
// @route   POST /api/questions/:id/comments
// @access  Private/Faculty
const addFacultyComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    question.facultyComments.push({
      faculty: req.user._id,
      comment,
    });

    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment" });
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private/Faculty
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting question" });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  submitEditSuggestion,
  handleSuggestion,
  submitGrades,
  finalizeQuestion,
  addFacultyComment,
  deleteQuestion,
};
