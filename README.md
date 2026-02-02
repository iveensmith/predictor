# Match Predictor (Telegram Mini App MVP)

A points-only football prediction game for Telegram Web Apps + Bot.

**Important**: This is a prediction game, not gambling. No real money wagers or payouts.

## Folder structure

```
backend/          # Node.js API + Telegram bot
frontend/         # Telegram Web App (mobile-first UI)
database/         # SQLite schema
(data)/           # Sample match data
```

## Quick start

1. Install dependencies:

```bash
cd backend
npm install
```

2. Run the backend:

```bash
npm start
```

3. Open the frontend:

- Serve `frontend/` with any static server, or open `index.html` directly.
- The UI expects the backend at `http://localhost:3000` (edit `frontend/app.js` if needed).

## MVP gameplay loop

1. Users open the Telegram Mini App.
2. They view upcoming matches.
3. They lock predictions before kickoff.
4. After the match, the admin endpoint `/api/admin/settle` awards points:
   - Exact score = +10
   - Correct result = +5
   - Wrong = 0
   - Boost tokens double points on one match.

## Referral rewards

- Each user has a unique referral code.
- When a new user joins with a referral code, both receive **+1 boost token**.

## Weekly leaderboard

- Weekly leaderboard resets on Monday (start-of-week logic in `backend/src/routes.js`).

## Premium mode (soft monetization)

- Premium gives **extra daily predictions**.
- “AI Insight” hints are **not betting advice**.

## Database schema

See `database/schema.sql` for tables: users, matches, predictions, referrals, weekly_rewards.

## Mock data vs API

The backend seeds `data/sample-matches.json` into SQLite on first run.

To replace with a real football API:

- Replace `loadSampleMatches()` in `backend/src/matchData.js` with an API call.
- Normalize the API response into `{ home_team, away_team, kickoff_time }`.
- Insert into the `matches` table the same way the seed function does.

## TON readiness (future)

The schema includes `ton_wallet_address` on the `users` table and a placeholder config note.
No on-chain logic is implemented yet.

## Telegram bot setup

- Create a bot with BotFather.
- Set `TELEGRAM_BOT_TOKEN` env var before running the backend.
- Optionally set `WEBAPP_URL` to your deployed frontend URL.

The `/start` command creates a user, supports a referral code, and shows a button to open the web app.

## Safety

This project is for entertainment only:
- **No gambling**
- **No real money**
- **No cash payouts**
