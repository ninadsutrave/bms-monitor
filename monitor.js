require("dotenv").config();

const puppeteer = require("puppeteer");
const axios = require("axios");

const URL =
  "https://in.bookmyshow.com/sports/icc-men-s-t20-world-cup-2026-semi-final-2/ET00474271";

const TELEGRAM_BOT_TOKEN_1 = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID_1 = process.env.TELEGRAM_CHAT_ID;

const TELEGRAM_BOT_TOKEN_2 = process.env.TELEGRAM_BOT_TOKEN_2;
const TELEGRAM_CHAT_ID_2 = process.env.TELEGRAM_CHAT_ID_2;

async function sendTelegram(token, chatId, message) {
  if (!token || !chatId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown"
    });

    console.log(`✅ Sent to chat ${chatId}`);
  } catch (err) {
    console.error(`❌ Failed sending to ${chatId}:`, err.message);
  }
}

async function sendAlert(message) {
  await sendTelegram(TELEGRAM_BOT_TOKEN_1, TELEGRAM_CHAT_ID_1, message);
  await sendTelegram(TELEGRAM_BOT_TOKEN_2, TELEGRAM_CHAT_ID_2, message);
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

    // Extra wait for React hydration
    await new Promise(resolve => setTimeout(resolve, 5000));

    const pageText = await page.evaluate(() =>
      document.body.innerText.toLowerCase()
    );

    let status = "unknown";

    if (pageText.includes("coming soon")) {
      status = "coming_soon";
    }

    if (
      pageText.includes("book tickets") ||
      pageText.includes("book now") ||
      pageText.includes("book")
    ) {
      status = "bookable";
    }

    console.log("📌 Status:", status);

    if (status === "coming_soon") {
      console.log("⏳ Still Coming Soon");
    }

    if (status === "bookable") {
      console.log("🚀 BOOKING OPEN — Sending alerts...");

      for (let i = 1; i <= 10; i++) {
        const message = `🔥🔥🔥 ALERT ${i}/10 🔥🔥🔥

T20 Semi Final 2 Tickets Are LIVE!

Book immediately on BookMyShow 🚀`;

        await sendAlert(message);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (status === "unknown") {
      console.log("⚠️ Unknown page state");

      // Helpful debug info (first 1000 chars)
      console.log(
        "🔎 Page preview:",
        pageText.substring(0, 1000).replace(/\n/g, " ")
      );
    }
  } catch (err) {
    console.error("❌ Script failed:", err.message);
  } finally {
    if (browser) await browser.close();
  }
})();
