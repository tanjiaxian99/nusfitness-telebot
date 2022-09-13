const { Telegraf, Markup } = require("telegraf");
const { updateMenu, retrieveMenu } = require("./helper.js");
const express = require("express");
const app = express();
const fetch = require("node-fetch");
const { stripIndents } = require("common-tags");
const { oneLine } = require("common-tags");
const { addDays, addHours } = require("date-fns");
const puppeteer = require("puppeteer");
require("dotenv").config();

const bot = new Telegraf(process.env.TOKEN);

// Set webhook
bot.telegram.setWebhook(
  `${process.env.BOT_URL}:443/${process.env.BOT_SECRET_PATH}`
);
app.use(bot.webhookCallback(`/${process.env.BOT_SECRET_PATH}`));

// Connect express to keep port open
const PORT = process.env.PORT || 4000;
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

const startMenu = async (ctx) => {
  try {
    ctx.deleteMessage();
    const chat = await ctx.getChat();

    const url = `${process.env.BACKEND_URL}/telegram/isLoggedIn`;

    const res = await fetch(url, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: chat.id,
      }),
      credentials: "include",
    });
    const data = await res.json();

    if (data.success) {
      ctx.reply(
        "What would you like to do today?",
        Markup.inlineKeyboard([
          Markup.button.callback("Booking", "Booking"),
          Markup.button.callback("Dashboard", "Dashboard"),
        ])
      );
    } else {
      ctx.replyWithHTML(
        oneLine`
        You are currently not logged in to @NUSFitness_Bot. Please login through the 
        <a href='https://jereldlimjy.github.io/nusfitness/#/'>NUSFitness website</a>
        and click on the "Log in with Telegram" button. For more information, send /help`
      );
    }
    updateMenu(ctx, "Start");
  } catch (err) {
    console.log(err);
  }
};

const getPreviousMenu = async (ctx, skips) => {
  try {
    ctx.deleteMessage();
    await updateMenu(ctx, ctx.match.input);
    return await retrieveMenu(ctx, skips);
  } catch (err) {
    console.log(err);
  }
};

// Global commands
bot.start(async (ctx) => await startMenu(ctx));

bot.help((ctx) => {
  ctx.replyWithHTML(
    oneLine`
    This bot aims to deliver as many functionalities as possible that can be found on the
    <a href="https://jereldlimjy.github.io/nusfitness/#/">NUSFitness website</a>. The bot
    currently implements booking and cancellation, as well as view booked slots. You may also
    view the current traffic, along with the traffic chart for the day.` +
      "\n\n" +
      oneLine`
    Do head to the website to link your web account with Telegram. This can be done by logging in
    with a registered account, heading to the Profile section, and clicking on the "Log in with
    Telegram" button. Thereafter, enter your mobile number and accept the session on the Telegram
    app to login to Telegram on your browser. Lastly, select "Yes" on the next pop-up (or if it
    doesn't appear, click on the "Log in with Telegram" button once more) and accept the connection
    on the Telegram app to log in to @NUSFitness_Bot.` +
      "\n\n" +
      oneLine`
      Once you have successfully logged in, send /start to begin your @NUSFitness_Bot journey! If
      you would like to report a bug, do file an issue at Github. The link can be found in the
      /about section.
    `
  );
});

bot.command("about", (ctx) => {
  ctx.replyWithHTML(
    stripIndents`
    Do submit inquiries or bug report to <a href="https://github.com/tanjiaxian99/nusfitness-telebot/issues">Github</a>
    This bot is developed by @ilovecheezles and @jereldlimjy
    `
  );
});

// Callbacks
bot.action("Start", async (ctx) => await startMenu(ctx));

bot.action("Booking", async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  ctx.reply(
    "What kind of booking function would you like to perform?",
    Markup.inlineKeyboard([
      [Markup.button.callback("View booked slots", "BookedSlots")],
      [Markup.button.callback("Make or cancel a booking", "MakeAndCancel")],
      [Markup.button.callback("Back", previousMenu)],
    ])
  );
});

// Retrieve the user's bookings
bot.action("BookedSlots", async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  const url = `${process.env.BACKEND_URL}/bookedSlots`;

  const res = await fetch(url, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: ctx.update.callback_query.from.id,
    }),
    credentials: "include",
  });

  const data = await res.json();
  if (data.length === 0) {
    ctx.reply(
      "No bookings found.",
      Markup.inlineKeyboard([Markup.button.callback("Back", previousMenu)])
    );
  }

  const slots = data.map((e) => ({
    facility: e.facility,
    date: new Date(e.date).toDateString(),
    hour: new Date(e.date)
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(":", ""),
  }));
  const dates = slots.reduce((accumulator, currentValue) => {
    if (!accumulator[currentValue.date]) {
      accumulator[currentValue.date] = [
        `${currentValue.hour}: ${currentValue.facility}`,
      ];
    } else {
      accumulator[currentValue.date].push(
        `${currentValue.hour}: ${currentValue.facility}`
      );
    }
    return accumulator;
  }, {});

  ctx.replyWithHTML(
    Object.keys(dates).reduce(
      (accumulator, date) =>
        accumulator +
        "\n\n" +
        stripIndents`<b>${date}</b>
        ${dates[date].reduce((accumulator, currentValue) => {
          return accumulator + "\n" + currentValue;
        })}`,
      ""
    ),
    Markup.inlineKeyboard([Markup.button.callback("Back", previousMenu)])
  );
});

// Facility selector
bot.action("MakeAndCancel", async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  ctx.reply(
    "Which facility are you interested in?",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "Kent Ridge Swimming Pool",
          "Kent Ridge Swimming Pool"
        ),
      ],
      [
        Markup.button.callback(
          "University Town Swimming Pool",
          "University Town Swimming Pool"
        ),
      ],
      [Markup.button.callback("Kent Ridge Gym", "Kent Ridge Gym")],
      [
        Markup.button.callback(
          "University Sports Centre Gym",
          "University Sports Centre Gym"
        ),
      ],
      [Markup.button.callback("University Town Gym", "University Town Gym")],
      [
        Markup.button.callback(
          "Wellness Outreach Gym",
          "Wellness Outreach Gym"
        ),
      ],
      [Markup.button.callback("Back", previousMenu)],
    ])
  );
});

// Date selector, format = "Kent Ridge Swimming Pool"
bot.action(/Pool$|Gym$/, async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  const now = new Date();
  let dates = [];
  for (let i = 0; i < 3; i++) {
    dates[i] = addDays(now, i).toDateString();
  }
  const buttons = dates.map((e) => [
    Markup.button.callback(e, `${ctx.match.input}_${e}`),
  ]);
  buttons.push([Markup.button.callback("Back", previousMenu)]);
  ctx.reply(
    "Which date would you like to pick?",
    Markup.inlineKeyboard(buttons)
  );
});

// Facility list
const facilities = [
  {
    name: "Kent Ridge Swimming Pool",
    weekdayHours: [
      "0730",
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
      "1900",
      "2000",
    ],
    weekendHours: [
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
    ],
  },
  {
    name: "University Town Swimming Pool",
    weekdayHours: [
      "0730",
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
      "1900",
      "2000",
    ],
    weekendHours: [
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
    ],
  },
  {
    name: "Kent Ridge Gym",
    weekdayHours: [
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
      "1900",
    ],
    weekendHours: [],
  },
  {
    name: "University Sports Centre Gym",
    weekdayHours: [
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
      "1900",
      "2000",
    ],
    weekendHours: [
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
    ],
  },
  {
    name: "University Town Gym",
    weekdayHours: [
      "0700",
      "0800",
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
      "1900",
      "2000",
      "2100",
    ],
    weekendHours: [
      "0700",
      "0800",
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
      "1900",
      "2000",
      "2100",
    ],
  },
  {
    name: "Wellness Outreach Gym",
    weekdayHours: [
      "0700",
      "0800",
      "0900",
      "1000",
      "1100",
      "1200",
      "1300",
      "1400",
      "1500",
      "1600",
      "1700",
      "1800",
      "1900",
      "2000",
      "2100",
    ],
    weekendHours: [],
  },
];

// Show slots for specified facility and date, format = Kent Ridge Swimming Pool_Thu Jul 08 2021
bot.action(/^[a-zA-Z ]+_\w{3}\s\w{3}\s\d{2}\s\d{4}$/, async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  const [facilityName, date] = ctx.match.input.split("_");
  const facility = facilities.find((e) => e.name === facilityName);
  const assignedDate = new Date(date);

  // Get credits count
  let url = `${process.env.BACKEND_URL}/creditsLeft`;
  let res = await fetch(url, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: ctx.update.callback_query.from.id,
    }),
    credentials: "include",
  });
  data = await res.json();
  const credits = data.credits;

  // Get slot count
  url = `${process.env.BACKEND_URL}/slots`;
  res = await fetch(url, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facility: facilityName,
      startDate: assignedDate,
    }),
    credentials: "include",
  });
  data = await res.json();
  const slotCount = data.map((e) => ({
    date: new Date(e._id),
    count: e.count,
  }));

  // Get booked slots
  url = `${process.env.BACKEND_URL}/bookedSlots`;
  res = await fetch(url, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: ctx.update.callback_query.from.id,
      facility: facility.name,
    }),
    credentials: "include",
  });
  data = await res.json();
  const bookedSlots = data.map((e) => new Date(e.date));

  // Initialize buttons
  const day = assignedDate.getDay();
  const hours =
    day % 7 === 0 || day % 7 === 6
      ? facility.weekendHours
      : facility.weekdayHours;

  const slots = hours.map((hourString) => {
    const hour = parseInt(hourString.slice(0, 2));
    const minute = parseInt(hourString.slice(2, 4));
    const date = new Date(assignedDate);

    date.setHours(hour, minute, 0, 0);

    const maxCap = 40; // adjust depending on facility
    let slotsLeft = maxCap;

    // Retrieve number of slots left
    const matchingSlot = slotCount.find(
      (e) => e.date.getTime() === date.getTime()
    );
    if (matchingSlot) {
      slotsLeft = maxCap - matchingSlot.count;
    }

    // Determine if slot is booked
    const booked = bookedSlots.find((e) => e.getTime() === date.getTime());

    // Determine if slot is full or slot's time has elapsed
    const slotTime = addHours(date, 1);
    const currentTime = new Date().getTime();
    const disabled = slotTime <= currentTime;

    return {
      text: `${disabled ? "❌ " : ""}${
        booked ? "✅ " : ""
      }${hourString} (${slotsLeft} slots)`,
      hourString,
      icons: `${disabled ? "❌" : ""}${booked ? "✅" : ""}${
        disabled || booked ? "_" : ""
      }`,
    };
  });
  let buttons = slots.map((e) =>
    Markup.button.callback(
      e.text,
      `${e.icons}${facilityName}_${date}_${e.hourString}`
    )
  );
  buttons = buttons.reduce(function (rows, key, index) {
    return (
      (index % 2 == 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) &&
      rows
    );
  }, []);
  buttons.push([Markup.button.callback("🔄 Refresh", ctx.match.input)]);
  buttons.push([Markup.button.callback("Back", previousMenu)]);

  // Reply
  ctx.replyWithHTML(
    `Select a slot to book or cancel\n\nNumber of credits left: <b>${credits}</b>`,
    Markup.inlineKeyboard(buttons)
  );
});

// Disabled slots, format = ❌
bot.action(/❌/, (ctx) => {
  return ctx.answerCbQuery(
    "Slot cannot be booked or cancelled as its time has elapsed."
  );
});

// Booking confirmation, format = Kent Ridge Swimming Pool_Thu Jul 08 2021_2000
bot.action(/^[a-zA-Z ]+_\w{3}\s\w{3}\s\d{2}\s\d{4}_\d{4}$/, async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  const [facilityName, dateString, hourString] = ctx.match[0].split("_");
  ctx.replyWithHTML(
    stripIndents`
    <b>Confirm booking?</b>\n
    <b>Facility</b>: ${facilityName}\n
    <b>Date</b>: ${dateString}\n
    <b>Time</b>: ${hourString}`,
    Markup.inlineKeyboard([
      Markup.button.callback("Back", previousMenu),
      Markup.button.callback("Confirm booking", `${ctx.match[0]}_Book`),
    ])
  );
});

// Make a booking, format = Kent Ridge Swimming Pool_Thu Jul 08 2021_2000_Book
bot.action(
  /^[a-zA-Z ]+_\w{3}\s\w{3}\s\d{2}\s\d{4}_\d{4}_Book$/,
  async (ctx) => {
    const previousMenu = await getPreviousMenu(ctx, 2);

    const [facilityName, dateString, hourString] = ctx.match[0].split("_");
    const date = new Date(dateString);
    const hour = parseInt(hourString.slice(0, 2));
    const minute = parseInt(hourString.slice(2, 4));
    date.setHours(hour, minute, 0, 0);

    // Update credits
    let url = `${process.env.BACKEND_URL}/updateCredits`;

    let res = await fetch(url, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: ctx.update.callback_query.from.id,
      }),
      credentials: "include",
    });
    let data = await res.json();

    if (!data.success) {
      ctx.reply(
        "You do not have any credits left!",
        Markup.inlineKeyboard([
          [Markup.button.callback("Back to booking slots", previousMenu)],
          [Markup.button.callback("Back to start menu", "Start")],
        ])
      );
      return;
    }

    // Book the slot
    url = `${process.env.BACKEND_URL}/book`;

    res = await fetch(url, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: ctx.update.callback_query.from.id,
        facility: facilityName,
        date,
      }),
      credentials: "include",
    });
    data = await res.json();

    if (data.success) {
      ctx.reply(
        "Your slot has been confirmed!",
        Markup.inlineKeyboard([
          [Markup.button.callback("Back to booking slots", previousMenu)],
          [Markup.button.callback("Back to start menu", "Start")],
        ])
      );
    } else {
      ctx.reply(
        "Slot has been fully booked :(",
        Markup.inlineKeyboard([
          [Markup.button.callback("Back to booking slots", previousMenu)],
          [Markup.button.callback("Back to start menu", "Start")],
        ])
      );
    }
  }
);

// Cancellation confirmation, format = ✅
bot.action(/✅/, async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  const [icon, facilityName, dateString, hourString] =
    ctx.match.input.split("_");
  ctx.replyWithHTML(
    stripIndents`
    <b>Cancel booking?</b>\n
    <b>Facility</b>: ${facilityName}\n
    <b>Date</b>: ${dateString}\n
    <b>Time</b>: ${hourString}`,
    Markup.inlineKeyboard([
      Markup.button.callback("Back", previousMenu),
      Markup.button.callback(
        "Cancel booking",
        `${facilityName}_${dateString}_${hourString}_Cancel`
      ),
    ])
  );
});

// Cancel a booking, format = Kent Ridge Swimming Pool_Thu Jul 08 2021_2000_Cancel
bot.action(
  /^[a-zA-Z ]+_\w{3}\s\w{3}\s\d{2}\s\d{4}_\d{4}_Cancel$/,
  async (ctx) => {
    const previousMenu = await getPreviousMenu(ctx, 2);

    const [facilityName, dateString, hourString] = ctx.match[0].split("_");
    const date = new Date(dateString);
    const hour = parseInt(hourString.slice(0, 2));
    const minute = parseInt(hourString.slice(2, 4));
    date.setHours(hour, minute, 0, 0);

    const url = `${process.env.BACKEND_URL}/cancel`;

    const res = await fetch(url, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: ctx.update.callback_query.from.id,
        facility: facilityName,
        date,
      }),
      credentials: "include",
    });
    const data = await res.json();

    if (data.success) {
      ctx.reply(
        "Your slot has been cancelled!",
        Markup.inlineKeyboard([
          [Markup.button.callback("Back to booking slots", previousMenu)],
          [Markup.button.callback("Back to start menu", "Start")],
        ])
      );
    } else {
      ctx.reply(
        "Unable to cancel slot because it is within the 2 hour cancellation window.",
        Markup.inlineKeyboard([
          [Markup.button.callback("Back to booking slots", previousMenu)],
          [Markup.button.callback("Back to start menu", "Start")],
        ])
      );
    }
  }
);

// Dashboard menu
bot.action("Dashboard", async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  ctx.reply(
    "What would you like to do?",
    Markup.inlineKeyboard([
      [Markup.button.callback("View current traffic", "CurrentTraffic")],
      [Markup.button.callback("View today's chart", "Charts")],
      [Markup.button.callback("Back", previousMenu)],
    ])
  );
});

// Current traffic
bot.action("CurrentTraffic", async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);
  const { message_id } = await ctx.reply("Retrieving traffic...");

  const url = `${process.env.BACKEND_URL}/telegram/currentTraffic`;

  const res = await fetch(url, {
    method: "get",
  });
  const traffic = await res.json();

  ctx.deleteMessage(message_id);
  ctx.replyWithHTML(
    stripIndents`
    <pre>
    Current Traffic\n
    ${[0, 1, 2, 3, 4, 5].reduce(
      (accumulator, i) =>
        accumulator + `${facilities[i].name.padEnd(30)}: ${traffic[i]}\n`,
      ""
    )}
    </pre>`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🔄 Refresh", ctx.match.input)],
      [Markup.button.callback("Back", previousMenu)],
    ])
  );
});

// Facility selector for charts
bot.action("Charts", async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);

  ctx.reply(
    "Which facility are you interested in?",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "Kent Ridge Swimming Pool",
          "Kent Ridge Swimming Pool_Chart"
        ),
      ],
      [
        Markup.button.callback(
          "University Town Swimming Pool",
          "University Town Swimming Pool_Chart"
        ),
      ],
      [Markup.button.callback("Kent Ridge Gym", "Kent Ridge Gym_Chart")],
      [
        Markup.button.callback(
          "University Sports Centre Gym",
          "University Sports Centre Gym_Chart"
        ),
      ],
      [
        Markup.button.callback(
          "University Town Gym",
          "University Town Gym_Chart"
        ),
      ],
      [
        Markup.button.callback(
          "Wellness Outreach Gym",
          "Wellness Outreach Gym_Chart"
        ),
      ],
      [Markup.button.callback("Back", previousMenu)],
    ])
  );
});

// View chart for a specific facility, format = University Town Gym_Chart
bot.action(/_Chart/, async (ctx) => {
  const previousMenu = await getPreviousMenu(ctx, 1);
  const { message_id } = await ctx.reply("Retrieving chart...");
  const [facilityName] = ctx.match.input.split("_");

  // Retrieve image buffer
  let buffer;
  await (async () => {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await page.goto(process.env.FRONTEND_URL);
    await page.click(".MuiSelect-select");
    await page.click(`.MuiListItem-button[data-value="${facilityName}"]`);
    // await page.click('svg[width="900"][height="250"]');
    await page.waitForTimeout(2000);
    buffer = await page.screenshot({
      clip: { x: 370, y: 200, width: 1520, height: 640 },
    });
  })();
  ctx.deleteMessage(message_id);

  ctx.replyWithPhoto(
    { source: buffer },
    {
      caption: stripIndents`
        <b>${facilityName}, ${new Date().toDateString()}</b>\n
        To apply other filters, click <a href='https://jereldlimjy.github.io/nusfitness/#/'>here</a>
        `,
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([Markup.button.callback("Back", previousMenu)]),
    }
  );
});

// Error handling
bot.catch((err) => console.log(err));

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
