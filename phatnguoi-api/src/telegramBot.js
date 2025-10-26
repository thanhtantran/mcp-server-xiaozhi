import { Telegraf } from "telegraf";
import { callAPI } from "./apiCaller.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Check if TELEGRAM_BOT_TOKEN is set
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set in the .env file.");
  process.exit(1);
}

// Initialize the Telegram bot with the token from .env file
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Set bot commands
bot.telegram.setMyCommands([
  {
    command: "tracuu",
    description: "Tra cứu vi phạm giao thông bằng biển số xe",
  },
]);

// Handle /tracuu command
bot.command("tracuu", async (ctx) => {
  const licensePlate = ctx.message.text.split(" ")[1];

  if (!licensePlate) {
    return ctx.reply("Vui lòng cung cấp biển số xe. Ví dụ: /tracuu 30H47465");
  }

  await handleLicensePlateLookup(ctx, licensePlate);
});

// Handle text messages
bot.on("text", async (ctx) => {
  const licensePlate = ctx.message.text.trim();
  await handleLicensePlateLookup(ctx, licensePlate);
});

// Launch the bot
bot.launch();

// Regular expression to validate license plate format
const licensePlateRegex = /^[0-9]{2}[A-Z][0-9]{5}$/;

/**
 * Handle license plate lookup
 * @param {Object} ctx - Telegram context
 * @param {string} licensePlate - License plate number
 */
const handleLicensePlateLookup = async (ctx, licensePlate) => {
  if (!licensePlateRegex.test(licensePlate)) {
    return ctx.reply("Bạn hãy nhập biển số theo format 30H47465");
  }

  try {
    const violations = await callAPI(licensePlate);
    if (violations && violations.length > 0) {
      ctx.reply(
        `Tìm thấy ${violations.length} lỗi vi phạm cho biển số ${licensePlate}`
      );
      violations.forEach((violation) => {
        const statusIcon = violation.status === "Đã xử phạt" ? "✅" : "❌";
        const resolutionPlaces = violation.resolutionPlaces
          .map(
            (place) =>
              `🏢 ${place.name}${place.address ? `, ${place.address}` : ""}`
          )
          .join("\n");

        const message = `
🚗 Biển số: ${violation.licensePlate}
🔹 Loại xe: ${violation.vehicleType}
⏰ Thời gian vi phạm: ${violation.violationTime}
📍 Địa điểm: ${violation.violationLocation}
⚠️ Hành vi vi phạm: ${violation.violationBehavior}
${statusIcon} Trạng thái: ${violation.status}
🏢 Nơi giải quyết:\n${resolutionPlaces}
        `;

        ctx.reply(message);
      });
    } else {
      ctx.reply(`🎉 Không tìm thấy vi phạm cho biển số ${licensePlate}`);
    }
  } catch (error) {
    ctx.reply(`Đã xảy ra lỗi trong quá trính kiểm tra`);
  }
};

console.log("Telegram bot is running...");
