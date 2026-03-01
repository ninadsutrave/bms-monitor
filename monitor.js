require("dotenv").config();

const puppeteer = require("puppeteer");
const axios = require("axios");

const URL = "https://in.bookmyshow.com/sports/icc-men-s-t20-world-cup-2026-semi-final-2/ET00474271";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Missing TELEGRAM credentials in environment variables");
  process.exit(1);
}

async function sendTelegram(message) {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown"
    }
  );
}

(async () => {
  console.log("Checking booking status...");

  const browser = await puppeteer.launch({
    headless: "new"
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });

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

  console.log("Status:", status);

  if (status === "bookable") {
    await sendTelegram(
      "🚀 *T20 Semi Final 2 Tickets Are LIVE!*\n\nBook now on BookMyShow."
    );
  }

  await browser.close();
})();
