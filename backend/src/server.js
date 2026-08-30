require("dotenv").config();
const express = require("express");
const cors = require("cors");
const screenSiteRoute = require("./routes/screenSite");
const sitesRoute = require("./routes/sites");
const copilotRoute = require("./routes/copilot");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// REST API Routers
app.use("/api/sites", sitesRoute);
app.use("/api/copilot", copilotRoute);
app.use("/api", screenSiteRoute);

// Serve static frontend build if available (Production All-in-One Deployment)
const path = require("path");
const fs = require("fs");
const frontendDistPath = path.join(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// Centralized error handler
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);
const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`VoltShield API active on :${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/sites`);
  console.log(`  POST /api/sites`);
  console.log(`  GET  /api/sites/:id`);
  console.log(`  PUT  /api/sites/:id/mitigations`);
  console.log(`  POST /api/copilot/chat`);
  console.log(`  POST /api/screen-site`);
  console.log(`  POST /api/screen-sites`);
  console.log(`Database: SQLite (voltherm.db)`);
  console.log(`=================================================`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing process or start on a different port.`);
    process.exit(1);
  }

  console.error("Server failed to start:", err);
  process.exit(1);
});
