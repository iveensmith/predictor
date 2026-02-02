const dayjs = require("dayjs");
const { scorePrediction } = require("./scoring");
const config = require("./config");

const weekStart = () => dayjs().startOf("week").add(1, "day").format("YYYY-MM-DD");

const attachRoutes = (app, db) => {
  app.get("/api/matches", (req, res) => {
    const today = dayjs().format("YYYY-MM-DD");
    const query = "SELECT * FROM matches WHERE kickoff_time >= ? ORDER BY kickoff_time";
    db.all(query, [today], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json(rows);
    });
  });

  app.get("/api/profile/:telegramId", (req, res) => {
    db.get(
      "SELECT * FROM users WHERE telegram_id = ?",
      [req.params.telegramId],
      (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "User not found" });

        db.get(
          "SELECT COUNT(*) AS count FROM predictions WHERE user_id = ? AND DATE(created_at) = DATE('now')",
          [user.id],
          (predErr, predictionCount) => {
            if (predErr) return res.status(500).json({ error: predErr.message });
            const premiumLimit = user.premium_until ? config.PREMIUM_EXTRA_LIMIT : 0;
            return res.json({
              ...user,
              daily_limit: config.DAILY_FREE_LIMIT + premiumLimit,
              predictions_today: predictionCount.count,
              week_start: weekStart(),
            });
          }
        );
      }
    );
  });

  app.post("/api/predictions", (req, res) => {
    const { telegramId, matchId, predictedHome, predictedAway, useBoost } = req.body;
    if (!telegramId || !matchId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    db.get("SELECT * FROM users WHERE telegram_id = ?", [telegramId], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found" });

      db.get("SELECT * FROM matches WHERE id = ?", [matchId], (matchErr, match) => {
        if (matchErr) return res.status(500).json({ error: matchErr.message });
        if (!match) return res.status(404).json({ error: "Match not found" });

        const kickoff = dayjs(match.kickoff_time);
        if (kickoff.isBefore(dayjs())) {
          return res.status(400).json({ error: "Predictions are locked for this match." });
        }

        db.get(
          "SELECT COUNT(*) AS count FROM predictions WHERE user_id = ? AND DATE(created_at) = DATE('now')",
          [user.id],
          (countErr, countRow) => {
            if (countErr) return res.status(500).json({ error: countErr.message });
            const premiumLimit = user.premium_until ? config.PREMIUM_EXTRA_LIMIT : 0;
            const limit = config.DAILY_FREE_LIMIT + premiumLimit;
            if (countRow.count >= limit) {
              return res.status(400).json({ error: "Daily prediction limit reached." });
            }

            if (useBoost && user.boost_tokens <= 0) {
              return res.status(400).json({ error: "No boost tokens available." });
            }

            const insert =
              "INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, locked_at, used_boost) VALUES (?, ?, ?, ?, ?, ?)";
            db.run(
              insert,
              [user.id, matchId, predictedHome, predictedAway, dayjs().toISOString(), useBoost ? 1 : 0],
              function (insertErr) {
                if (insertErr) return res.status(500).json({ error: insertErr.message });

                if (useBoost) {
                  db.run(
                    "UPDATE users SET boost_tokens = boost_tokens - 1 WHERE id = ?",
                    [user.id]
                  );
                }

                return res.json({ id: this.lastID, message: "Prediction locked!" });
              }
            );
          }
        );
      });
    });
  });

  app.get("/api/leaderboard/weekly", (req, res) => {
    const start = weekStart();
    const query = `
      SELECT users.username, users.avatar_url, SUM(predictions.points_awarded) AS points
      FROM predictions
      JOIN users ON users.id = predictions.user_id
      WHERE predictions.created_at >= ?
      GROUP BY predictions.user_id
      ORDER BY points DESC
      LIMIT 20
    `;
    db.all(query, [start], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ week_start: start, leaderboard: rows });
    });
  });

  app.post("/api/admin/settle", (req, res) => {
    const { matchId, homeScore, awayScore } = req.body;
    if (!matchId) return res.status(400).json({ error: "matchId required" });

    db.run(
      "UPDATE matches SET status = 'finished', home_score = ?, away_score = ? WHERE id = ?",
      [homeScore, awayScore, matchId],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(
          "SELECT * FROM predictions WHERE match_id = ?",
          [matchId],
          (predErr, predictions) => {
            if (predErr) return res.status(500).json({ error: predErr.message });

            predictions.forEach((prediction) => {
              const points = scorePrediction({
                predictedHome: prediction.predicted_home,
                predictedAway: prediction.predicted_away,
                actualHome: homeScore,
                actualAway: awayScore,
              });
              const boostedPoints = prediction.used_boost ? points * 2 : points;

              db.run(
                "UPDATE predictions SET points_awarded = ? WHERE id = ?",
                [boostedPoints, prediction.id]
              );
              db.run(
                "UPDATE users SET total_points = total_points + ? WHERE id = ?",
                [boostedPoints, prediction.user_id]
              );
            });

            return res.json({ message: "Match settled", predictions: predictions.length });
          }
        );
      }
    );
  });

  app.post("/api/referral/redeem", (req, res) => {
    const { telegramId, referralCode } = req.body;
    if (!telegramId || !referralCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    db.get("SELECT * FROM users WHERE telegram_id = ?", [telegramId], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.referred_by) {
        return res.status(400).json({ error: "Referral already used." });
      }

      db.get("SELECT * FROM users WHERE referral_code = ?", [referralCode], (refErr, referrer) => {
        if (refErr) return res.status(500).json({ error: refErr.message });
        if (!referrer) return res.status(404).json({ error: "Invalid referral code" });

        db.run(
          "UPDATE users SET referred_by = ? , boost_tokens = boost_tokens + ? WHERE id = ?",
          [referrer.telegram_id, config.BOOST_REFERRAL_BONUS, user.id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });

            db.run(
              "UPDATE users SET boost_tokens = boost_tokens + ? WHERE id = ?",
              [config.BOOST_REFERRAL_BONUS, referrer.id]
            );

            db.run(
              "INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)",
              [referrer.id, user.id]
            );

            return res.json({ message: "Referral redeemed. Boost tokens added!" });
          }
        );
      });
    });
  });
};

module.exports = {
  attachRoutes,
};
