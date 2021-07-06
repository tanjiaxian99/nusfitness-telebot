const { Telegraf, Markup } = require("telegraf");
const fetch = require("node-fetch");
require("dotenv").config();

const bot = new Telegraf(process.env.TOKEN);

bot.start((ctx) => {
  const url = `${
    process.env.NODE_ENV === "production"
      ? "http://local.nusfitness.com:5000/"
      : "https://salty-reaches-24995.herokuapp.com/"
  }telegram/isLoggedIn`;

  fetch(url, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: ctx.update.message.chat.id,
    }),
    credentials: "include",
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        ctx.reply(
          "What would you like to do today?",
          Markup.inlineKeyboard([
            Markup.button.callback("Booking", "Booking"),
            Markup.button.callback("Dashboard", "Dashboard"),
          ])
        );
      } else {
        ctx.reply(
          "You are currently not logged in to @NUSFitness_Bot. Please login using the NUSFitness website."
        );
      }
    });
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
