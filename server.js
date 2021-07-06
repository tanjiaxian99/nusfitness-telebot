const { Telegraf, Markup } = require("telegraf");
const fetch = require("node-fetch");
const { stripIndents } = require("common-tags");
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

bot.action("Booking", (ctx) => {
  ctx.deleteMessage();
  ctx.reply(
    "What kind of booking function would you like to perform?",
    Markup.inlineKeyboard([
      Markup.button.callback("View booked slots", "BookedSlots"),
      Markup.button.callback("Make or cancel a booking", "MakeAndCancel"),
    ])
  );
});

// Retrieve the user's bookings
bot.action("BookedSlots", async (ctx) => {
  const url = `${
    process.env.NODE_ENV === "production"
      ? "http://local.nusfitness.com:5000/"
      : "https://salty-reaches-24995.herokuapp.com/"
  }bookedSlots`;

  const res = await fetch(url, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: ctx.update.callback_query.from.id,
    }),
    credentials: "include",
  });

  const data = await res.json();
  const slots = data.map((e) => ({
    facility: e.facility,
    date: new Date(e.date),
  }));
  const rows = slots.map(
    (e) =>
      `| ${e.facility.padEnd(29)} | ${e.date.toDateString()} | ${e.date
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(":", "")} |`
  );

  ctx.replyWithHTML(
    stripIndents`
    <pre>
      |            Facilty            |       Date      | Time |
      |-------------------------------|-----------------|------|
      ${rows.reduce(
        (accumulator, currentValue) => accumulator + "\n" + currentValue
      )}
    </pre>`
  );
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
