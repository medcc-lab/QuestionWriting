const mongoose = require("mongoose");

const scoringConfigSchema = new mongoose.Schema(
  {
    newQuestionScore: {
      type: Number,
      default: 10,
    },
    editSuggestionBaseScore: {
      type: Number,
      default: 3,
    },
    editAcceptBonus: {
      type: Number,
      default: 2,
    },
    editRejectPenalty: {
      type: Number,
      default: -2,
    },
    gradingScore: {
      type: Number,
      default: 1,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make it optional initially
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one config exists
scoringConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

const ScoringConfig = mongoose.model("ScoringConfig", scoringConfigSchema);
module.exports = ScoringConfig;
