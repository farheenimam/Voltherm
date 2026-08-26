module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: "internal_error", message: err.message });
};
