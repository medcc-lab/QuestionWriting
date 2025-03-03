const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // Changed to false as it will be set on first login
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: false, // Users are inactive by default
    },
    passwordReset: {
      type: Boolean,
      default: true, // Indicates if user needs to set/reset password on next login
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetToken = await bcrypt.hash(resetToken, 10);
  this.resetTokenExpires = Date.now() + 3600000; // 1 hour
  await this.save();
  return resetToken;
};

userSchema.methods.validateResetToken = async function (token) {
  if (
    !this.resetToken ||
    !this.resetTokenExpires ||
    Date.now() > this.resetTokenExpires
  ) {
    return false;
  }
  return await bcrypt.compare(token, this.resetToken);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
