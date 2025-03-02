const Lecture = require("../models/Lecture");
const User = require("../models/User");

// Get all lectures (filtered by role)
exports.getLectures = async (req, res) => {
  try {
    if (req.user.role === "faculty") {
      // Faculty sees their created lectures
      const lectures = await Lecture.find({ faculty: req.user._id })
        .populate("faculty", "name email")
        .populate("students", "name email");
      res.json(lectures);
    } else {
      // Students see lectures they're assigned to
      const lectures = await Lecture.find({ students: req.user._id }).populate(
        "faculty",
        "name email"
      );
      res.json(lectures);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new lecture
exports.createLecture = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res
        .status(403)
        .json({ message: "Only faculty can create lectures" });
    }

    const lecture = new Lecture({
      title: req.body.title,
      description: req.body.description,
      faculty: req.user._id,
      students: req.body.students || [],
    });

    const savedLecture = await lecture.save();
    res.status(201).json(savedLecture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a lecture
exports.updateLecture = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res
        .status(403)
        .json({ message: "Only faculty can update lectures" });
    }

    const lecture = await Lecture.findOne({
      _id: req.params.id,
      faculty: req.user._id,
    });

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    if (req.body.title) lecture.title = req.body.title;
    if (req.body.description) lecture.description = req.body.description;
    if (req.body.isActive !== undefined) lecture.isActive = req.body.isActive;

    const updatedLecture = await lecture.save();
    res.json(updatedLecture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a lecture (soft delete by setting isActive to false)
exports.deleteLecture = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res
        .status(403)
        .json({ message: "Only faculty can delete lectures" });
    }

    const lecture = await Lecture.findOne({
      _id: req.params.id,
      faculty: req.user._id,
    });

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    lecture.isActive = false;
    await lecture.save();
    res.json({ message: "Lecture deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add students to a lecture
exports.addStudents = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can add students" });
    }

    let lecture = await Lecture.findOne({
      _id: req.params.id,
      faculty: req.user._id,
    });

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // Verify all students exist and are students
    const students = await User.find({
      _id: { $in: req.body.studentIds },
      role: "student",
    });

    if (students.length !== req.body.studentIds.length) {
      return res.status(400).json({ message: "Invalid student IDs provided" });
    }

    // Add new students (avoid duplicates)
    const newStudentIds = students.map((s) => s._id);
    lecture.students = [...new Set([...lecture.students, ...newStudentIds])];
    await lecture.save();

    // Populate the students before returning
    lecture = await Lecture.findById(lecture._id)
      .populate("faculty", "name email")
      .populate("students", "name email");

    res.json(lecture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove students from a lecture
exports.removeStudents = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res
        .status(403)
        .json({ message: "Only faculty can remove students" });
    }

    let lecture = await Lecture.findOne({
      _id: req.params.id,
      faculty: req.user._id,
    });

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    lecture.students = lecture.students.filter(
      (id) => !req.body.studentIds.includes(id.toString())
    );

    await lecture.save();

    // Populate the students before returning
    lecture = await Lecture.findById(lecture._id)
      .populate("faculty", "name email")
      .populate("students", "name email");

    res.json(lecture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add questions to a lecture
exports.addQuestions = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res
        .status(403)
        .json({ message: "Only faculty can add questions" });
    }

    const lecture = await Lecture.findOne({
      _id: req.params.id,
      faculty: req.user._id,
    });

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // Add new questions (avoid duplicates)
    lecture.questions = [
      ...new Set([...lecture.questions, ...req.body.questionIds]),
    ];

    await lecture.save();
    res.json(lecture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove questions from a lecture
exports.removeQuestions = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res
        .status(403)
        .json({ message: "Only faculty can remove questions" });
    }

    const lecture = await Lecture.findOne({
      _id: req.params.id,
      faculty: req.user._id,
    });

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    lecture.questions = lecture.questions.filter(
      (id) => !req.body.questionIds.includes(id.toString())
    );

    await lecture.save();
    res.json(lecture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
