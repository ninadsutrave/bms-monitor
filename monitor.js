const axios = require("axios");
const { JSDOM } = require("jsdom");

const URL = process.env.TARGET_URL;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS.split(",");

async function checkBooking() {
  try {
    console.log(`🔍 Checking booking status at ${new Date().toISOString()}`);

    const response = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // 🔎 Target ONLY the booking container
    const bookingContainer = document.querySelector(
      'div[style*="background-color:#FFFFFF"].sc-133848s-3'
    );

    if (!bookingContainer) {
      console.log("⚠️ Booking container not found");
      return;
    }

    const containerText = bookingContainer.textContent.toLowerCase();

    if (containerText.includes("book now")) {
      console.log("📌 Status: bookable");
      console.log("🚀 BOOKING OPEN — Sending alerts...");
      await sendTelegramAlert("🎟 Tickets are LIVE! Book now!");
    } else if (containerText.includes("coming soon")) {
      console.log("📌 Status: coming soon");
    } else {
      console.log("📌 Status: unknown");
      console.log("⚠️ Unknown page state");
    }
  } catch (error) {
    console.error("❌ Error checking booking:", error.message);
  }
}

async function sendTelegramAlert(message) {
  for (const chatId of TELEGRAM_CHAT_IDS) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: chatId.trim(),
          text: message,
        }
      );
      console.log(`✅ Alert sent to ${chatId}`);
    } catch (error) {
      console.error(
        `❌ Failed sending to ${chatId}:`,
        error.response?.data || error.message
      );
    }
  }
}

checkBooking();
