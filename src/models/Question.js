const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  grades: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      score: {
        type: Number,
        enum: [1, 2, 3],
        required: true,
      },
    },
  ],
});

const editSuggestionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  suggestedQuestion: String,
  suggestedAnswers: [answerSchema],
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  rebuttalComment: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const questionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answers: [answerSchema],
    isFinal: {
      type: Boolean,
      default: false,
    },
    editSuggestions: [editSuggestionSchema],
    grades: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        questionScore: {
          type: Number,
          enum: [1, 2, 3],
        },
      },
    ],
    facultyComments: [
      {
        faculty: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate at least one correct answer
questionSchema.pre("save", function (next) {
  const hasCorrectAnswer = this.answers.some((answer) => answer.isCorrect);
  if (!hasCorrectAnswer) {
    next(new Error("Question must have at least one correct answer"));
  }
  next();
});

// Validate number of answers (2-4)
questionSchema.pre("save", function (next) {
  if (this.answers.length < 2 || this.answers.length > 4) {
    next(new Error("Questions must have between 2 and 4 answers"));
  }
  next();
});

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;
