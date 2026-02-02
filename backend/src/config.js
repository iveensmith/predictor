module.exports = {
  PORT: process.env.PORT || 3000,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  DAILY_FREE_LIMIT: 5,
  PREMIUM_EXTRA_LIMIT: 5,
  BOOST_REFERRAL_BONUS: 1,
  WEBAPP_URL: process.env.WEBAPP_URL || "http://localhost:3000",
  TON_INTEGRATION_NOTE: "Placeholder for future TON wallet linking",
};
