require("dotenv").config();

const puppeteer = require("puppeteer");
const axios = require("axios");

const URL =
  "https://in.bookmyshow.com/sports/icc-men-s-t20-world-cup-2026-semi-final-2/ET00474271";

const BOT_1 = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  chatId: process.env.TELEGRAM_CHAT_ID
};

const BOT_2 = {
  token: process.env.TELEGRAM_BOT_TOKEN_2,
  chatId: process.env.TELEGRAM_CHAT_ID_2
};

if (!BOT_1.token || !BOT_1.chatId) {
  console.error("❌ Primary TELEGRAM credentials missing");
  process.exit(1);
}

async function sendTelegram(bot, message) {
  if (!bot.token || !bot.chatId) {
    console.log("⚠️ Skipping undefined bot configuration");
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${bot.token}/sendMessage`,
      {
        chat_id: bot.chatId,
        text: message,
        parse_mode: "Markdown"
      }
    );
    console.log(`✅ Sent via bot (${bot.chatId})`);
  } catch (err) {
    console.error(`❌ Failed sending via bot (${bot.chatId}):`, err.message);
  }
}

(async () => {
  console.log("🔍 Checking booking status at", new Date().toISOString());

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );

    await page.goto(URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const status = await page.evaluate(() => {
      const comingSoonEl = Array.from(document.querySelectorAll("div"))
        .find(d => d.innerText.trim() === "Coming Soon");

      const bookButton = Array.from(document.querySelectorAll("button"))
        .find(b => b.innerText.toLowerCase().includes("book"));

      if (comingSoonEl) return "coming_soon";
      if (bookButton) return "bookable";
      return "unknown";
    });

    console.log("📌 Status:", status);

    if (status === "bookable") {
      console.log("🚀 BOOKING OPEN — Sending 10 alerts...");

      for (let i = 1; i <= 10; i++) {
        const message = `🔥🔥🔥 *ALERT ${i}/10* 🔥🔥🔥\n\n*T20 Semi Final 2 Tickets Are LIVE!*\n\nBook now on BookMyShow 🚀`;

        await sendTelegram(BOT_1, message);
        await sendTelegram(BOT_2, message);

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (status === "coming_soon") {
      console.log("⏳ Still Coming Soon");
    }

    if (status === "unknown") {
      console.log("⚠️ Unknown page state");
    }

  } catch (err) {
    console.error("❌ Script failed:", err.message);
  } finally {
    if (browser) await browser.close();
  }
})();
