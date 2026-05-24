/**
 * Build a goal string from recent user messages (topic recommendations).
 */
const extractGoalFromHistory = (conversationHistory) => {
  const userMessages = conversationHistory
    .filter((m) => m.role === 'user' && typeof m.content === 'string')
    .map((m) => m.content.trim())
    .filter(Boolean);

  return userMessages.slice(-3).join('. ') || 'Learning recommendation';
};

module.exports = { extractGoalFromHistory };
