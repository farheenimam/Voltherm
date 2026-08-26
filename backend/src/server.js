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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Voltherm backend listening on :${PORT}`));
