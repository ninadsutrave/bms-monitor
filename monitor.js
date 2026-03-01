const puppeteer = require("puppeteer");
const axios = require("axios");

const URL = process.env.TARGET_URL;

const TELEGRAM_CHAT_IDS = [
  process.env.TELEGRAM_CHAT_ID,
  process.env.TELEGRAM_CHAT_ID_2,
].filter(Boolean);

const TELEGRAM_TOKENS = [
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_BOT_TOKEN_2,
].filter(Boolean);

if (!URL) {
  console.error("❌ TARGET_URL not defined");
  process.exit(1);
}

if (TELEGRAM_CHAT_IDS.length === 0 || TELEGRAM_TOKENS.length === 0) {
  console.error("❌ Telegram secrets missing");
  process.exit(1);
}

async function checkBooking() {
  console.log(`🔍 Checking booking status at ${new Date().toISOString()}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.goto(URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for booking section to load
    await page.waitForTimeout(4000);

    const status = await page.evaluate(() => {
      const container = document.querySelector(
        'div[style*="background-color:#FFFFFF"]'
      );

      if (!container) return "not_found";

      const text = container.innerText.toLowerCase();

      if (text.includes("coming soon")) return "coming_soon";
      if (text.includes("book now")) return "bookable";

      return "unknown";
    });

    console.log("📌 Status:", status);

    if (status === "bookable") {
      console.log("🚀 BOOKING OPEN — Sending alerts...");
      await sendTelegramAlert("🎟 ICC T20 WC Semi Final 2 tickets are LIVE! Book now!");
    }

  } catch (err) {
    console.error("❌ Error checking booking:", err.message);
  } finally {
    await browser.close();
  }
}

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
        console.log(`✅ Alert sent to ${chatId}`);
      } catch (error) {
        console.error(
          `❌ Failed for ${chatId}:`,
          error.response?.data || error.message
        );
      }
    }
  }
}

checkBooking();
