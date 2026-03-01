const axios = require("axios");
const { JSDOM } = require("jsdom");

// ===== ENV VARIABLES =====
const URL = process.env.TARGET_URL;

const TELEGRAM_CHAT_IDS = [
  process.env.TELEGRAM_CHAT_ID,
  process.env.TELEGRAM_CHAT_ID_2,
].filter(Boolean);

const TELEGRAM_TOKENS = [
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_BOT_TOKEN_2,
].filter(Boolean);

// ===== VALIDATION =====
if (!URL) {
  console.error("❌ TARGET_URL not defined");
  process.exit(1);
}

if (TELEGRAM_CHAT_IDS.length === 0) {
  console.error("❌ No TELEGRAM_CHAT_ID secrets defined");
  process.exit(1);
}

if (TELEGRAM_TOKENS.length === 0) {
  console.error("❌ No TELEGRAM_BOT_TOKEN secrets defined");
  process.exit(1);
}

// ===== MAIN FUNCTION =====
async function checkBooking() {
  try {
    console.log(`🔍 Checking booking status at ${new Date().toISOString()}`);

    const response = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      timeout: 15000,
    });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // 🔎 Restrict ONLY to the booking component
    const bookingContainer = document.querySelector(
      'div[style*="background-color:#FFFFFF"].sc-133848s-3'
    );

    if (!bookingContainer) {
      console.log("⚠️ Booking container not found");
      return;
    }

    const text = bookingContainer.textContent.toLowerCase();

    if (text.includes("coming soon")) {
      console.log("📌 Status: coming soon");
      return;
    }

    if (text.includes("book now")) {
      console.log("📌 Status: bookable");
      console.log("🚀 BOOKING OPEN — Sending alerts...");
      await sendTelegramAlert("🎟 Tickets are LIVE! Book now!");
      return;
    }

    console.log("📌 Status: unknown");
    console.log("⚠️ Unknown page state");

  } catch (error) {
    console.error("❌ Error checking booking:", error.message);
  }
}

// ===== TELEGRAM ALERT =====
async function sendTelegramAlert(message) {
  for (const token of TELEGRAM_TOKENS) {
    for (const chatId of TELEGRAM_CHAT_IDS) {
      try {
        await axios.post(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            chat_id: chatId,
            text: message,
          }
        );
        console.log(`✅ Alert sent to ${chatId} via bot`);
      } catch (error) {
        console.error(
          `❌ Failed for ${chatId}:`,
          error.response?.data || error.message
        );
      }
    }
  }
}

// ===== RUN =====
checkBooking();
