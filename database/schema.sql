-- Match Predictor schema (SQLite)
-- This is a points-only prediction game. No gambling.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  boost_tokens INTEGER DEFAULT 0,
  premium_until TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  ton_wallet_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff_time TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming',
  home_score INTEGER,
  away_score INTEGER
);

CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  match_id INTEGER NOT NULL,
  predicted_home INTEGER NOT NULL,
  predicted_away INTEGER NOT NULL,
  locked_at TEXT,
  used_boost INTEGER DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(match_id) REFERENCES matches(id)
);

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(referrer_id) REFERENCES users(id),
  FOREIGN KEY(referred_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS weekly_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  reward_label TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
