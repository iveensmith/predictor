const TelegramBot = require("node-telegram-bot-api");
const config = require("./config");

const initTelegramBot = (db) => {
  if (!config.TELEGRAM_BOT_TOKEN) {
    console.log("Telegram bot token missing. Bot will not start.");
    return null;
  }

  const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

  bot.onText(/\/start(?:\s+(\w+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const referralCode = match && match[1];
    const telegramId = String(msg.from.id);
    const username = msg.from.username || msg.from.first_name || "player";

    db.get("SELECT * FROM users WHERE telegram_id = ?", [telegramId], (err, user) => {
      if (err) return bot.sendMessage(chatId, "Error loading your profile.");

      if (user) {
        bot.sendMessage(chatId, "Welcome back! Open Match Predictor:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Open Match Predictor", web_app: { url: config.WEBAPP_URL } }],
            ],
          },
        });
        return;
      }

      const referral = `ref_${telegramId}_${Date.now()}`;
      db.run(
        "INSERT INTO users (telegram_id, username, referral_code, referred_by) VALUES (?, ?, ?, ?)",
        [telegramId, username, referral, referralCode || null],
        function (insertErr) {
          if (insertErr) return bot.sendMessage(chatId, "Could not create your profile.");

          if (referralCode) {
            bot.sendMessage(chatId, "Referral noted! Claim your boost in the app.");
          }

          bot.sendMessage(chatId, "Account created! Open Match Predictor:", {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Open Match Predictor", web_app: { url: config.WEBAPP_URL } }],
              ],
            },
          });
        }
      );
    });
  });

  return bot;
};

module.exports = {
  initTelegramBot,
};
