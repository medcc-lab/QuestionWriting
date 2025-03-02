const ScoringConfig = require("../models/ScoringConfig");

// @desc    Get current scoring configuration
// @route   GET /api/scoring/config
// @access  Private
const getConfig = async (req, res) => {
  try {
    const config = await ScoringConfig.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error fetching scoring configuration" });
  }
};

// @desc    Update scoring configuration
// @route   PUT /api/scoring/config
// @access  Private/Faculty
const updateConfig = async (req, res) => {
  try {
    const {
      newQuestionScore,
      editSuggestionBaseScore,
      editAcceptBonus,
      editRejectPenalty,
      gradingScore,
    } = req.body;

    const config = await ScoringConfig.getConfig();

    // Update only provided fields
    if (newQuestionScore !== undefined)
      config.newQuestionScore = newQuestionScore;
    if (editSuggestionBaseScore !== undefined)
      config.editSuggestionBaseScore = editSuggestionBaseScore;
    if (editAcceptBonus !== undefined) config.editAcceptBonus = editAcceptBonus;
    if (editRejectPenalty !== undefined)
      config.editRejectPenalty = editRejectPenalty;
    if (gradingScore !== undefined) config.gradingScore = gradingScore;

    config.lastUpdatedBy = req.user._id;
    await config.save();

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error updating scoring configuration" });
  }
};

module.exports = {
  getConfig,
  updateConfig,
};
