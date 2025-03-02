const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for optimizing student lookup
lectureSchema.index({ students: 1 });

// Index for faculty lookup since we often filter by faculty
lectureSchema.index({ faculty: 1 });

// Index for active lectures since we filter by isActive
lectureSchema.index({ isActive: 1 });

// Middleware to prevent actual deletion of questions when removing them from a lecture
lectureSchema.pre("save", async function (next) {
  if (this.isModified("questions")) {
    // Questions are only being modified, not deleted from the database
    next();
  }
});

const Lecture = mongoose.model("Lecture", lectureSchema);
module.exports = Lecture;
