const express = require("express");
const cors = require("cors");
const dayjs = require("dayjs");
const { db, initDb } = require("./db");
const { loadSampleMatches } = require("./matchData");
const { attachRoutes } = require("./routes");
const { initTelegramBot } = require("./telegram");
const config = require("./config");

const app = express();

app.use(cors());
app.use(express.json());

initDb();

const seedMatches = () => {
  db.get("SELECT COUNT(*) AS count FROM matches", (err, row) => {
    if (err) return console.error(err.message);
    if (row.count > 0) return;

    const matches = loadSampleMatches();
    const insert =
      "INSERT INTO matches (home_team, away_team, kickoff_time, status) VALUES (?, ?, ?, ?)";
    matches.forEach((match) => {
      db.run(insert, [match.home_team, match.away_team, match.kickoff_time, "upcoming"]);
    });
    console.log("Seeded sample matches.");
  });
};

seedMatches();

attachRoutes(app, db);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: dayjs().toISOString(),
    note: "Match Predictor is a prediction game, not gambling.",
  });
});

app.listen(config.PORT, () => {
  console.log(`Match Predictor backend running on port ${config.PORT}`);
});

initTelegramBot(db);
