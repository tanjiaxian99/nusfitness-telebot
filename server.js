const { Telegraf, Markup } = require("telegraf");
const fetch = require("node-fetch");
const { stripIndents } = require("common-tags");
const { addDays, addHours } = require("date-fns");
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

// Facility selector
bot.action("MakeAndCancel", (ctx) => {
  ctx.reply(
    "Which facility are you interested in?",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "Kent Ridge Swimming Pool",
          "Kent Ridge Swimming Pool"
        ),
        Markup.button.callback(
          "University Town Swimming Pool",
          "University Town Swimming Pool"
        ),
      ],
      [
        Markup.button.callback("Kent Ridge Gym", "Kent Ridge Gym"),
        Markup.button.callback(
          "University Sports Centre Gym",
          "University Sports Centre Gym"
        ),
      ],
      [
        Markup.button.callback("University Town Gym", "University Town Gym"),
        Markup.button.callback(
          "Wellness Outreach Gym",
          "Wellness Outreach Gym"
        ),
      ],
    ])
  );
});

// Date selector, format = "Kent Ridge Swimming Pool"
bot.action(/Pool$|Gym$/, (ctx) => {
  const now = new Date();
  let dates = [];
  for (let i = 0; i < 3; i++) {
    dates[i] = addDays(now, i).toDateString();
  }
  ctx.reply(
    "Which date would you like to pick?",
    Markup.inlineKeyboard(
      dates.map((e) => Markup.button.callback(e, `${ctx.match.input}_${e}`))
    )
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
  const [facilityName, date] = ctx.match.input.split("_");
  const facility = facilities.find((e) => e.name === facilityName);
  const assignedDate = new Date(date);

  // Get slot count
  let url = `${
    process.env.NODE_ENV === "production"
      ? "http://local.nusfitness.com:5000/"
      : "https://salty-reaches-24995.herokuapp.com/"
  }slots`;
  let res = await fetch(url, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facility: facilityName,
      startDate: assignedDate,
      endDate: addDays(assignedDate, 1),
    }),
    credentials: "include",
  });
  let data = await res.json();
  const slotCount = data.map((e) => ({
    date: new Date(e._id),
    count: e.count,
  }));

  // Get booked slots
  url = `${
    process.env.NODE_ENV === "production"
      ? "http://local.nusfitness.com:5000/"
      : "https://salty-reaches-24995.herokuapp.com/"
  }bookedSlots`;
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

    const maxCap = 20; // adjust depending on facility
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
    const disabled = slotsLeft <= 0 || slotTime <= currentTime;

    return {
      text: `${disabled ? "❌ " : ""}${
        booked ? "✅ " : ""
      }${hourString} (${slotsLeft} slots)`,
      hourString,
    };
  });
  const buttons = slots.map((e) =>
    Markup.button.callback(e.text, `${facilityName}_${date}_${e.hourString}`)
  );

  // Reply
  ctx.reply(
    "Select a slot to book or cancel",
    Markup.inlineKeyboard(
      buttons.reduce(function (rows, key, index) {
        return (
          (index % 2 == 0
            ? rows.push([key])
            : rows[rows.length - 1].push(key)) && rows
        );
      }, [])
    )
  );
});

// Disabled slots, format = ❌
bot.action(/❌/, (ctx) => {
  return ctx.answerCbQuery(
    "Slot cannot be booked or cancelled. It is either full or its time has elapsed"
  );
});

// Book a slot, format = Kent Ridge Swimming Pool_Thu Jul 08 2021_2000
bot.action(/[a-zA-Z ]+_\w{3}\s\w{3}\s\d{2}\s\d{4}_\d{4}/, (ctx) => {
  const [facilityName, dateString, hourString] = ctx.match[0].split("_");
  ctx.replyWithHTML(
    stripIndents`
    <b>Confirm booking?</b>\n
    <b>Facility</b>: ${facilityName}\n
    <b>Date</b>: ${dateString}\n
    <b>Time</b>: ${hourString}`,
    Markup.inlineKeyboard([
      Markup.button.callback("Cancel", "Cancel"),
      Markup.button.callback("Confirm booking", "ConfirmBooking"),
    ])
  );
});

bot.action("Cancel", (ctx) => {
  ctx.deleteMessage();
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
