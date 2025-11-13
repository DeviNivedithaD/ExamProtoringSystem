exports.logWarning = async (req, res) => {
  const { studentId, type } = req.body;
  // Save to DB logic should go here
  res.json({ success: true, warning: { studentId, type } });
};
