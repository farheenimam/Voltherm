require("dotenv").config();
const express = require("express");
const cors = require("cors");
const screenSiteRoute = require("./routes/screenSite");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api", screenSiteRoute);

app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);
const server = app.listen(PORT, () => console.log(`Voltherm backend listening on :${PORT}`));

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing process or start the app on a different port, e.g. PORT=4001 node src/server.js`);
    process.exit(1);
  }

  console.error("Server failed to start:", err);
  process.exit(1);
});
