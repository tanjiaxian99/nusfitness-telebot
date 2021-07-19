const fetch = require("node-fetch");
require("dotenv").config();

const updateMenu = async (ctx, currentMenu) => {
  try {
    const chat = await ctx.getChat();

    const url = `${
      process.env.NODE_ENV === "production"
        ? "http://local.nusfitness.com:5000/"
        : "https://salty-reaches-24995.herokuapp.com/"
    }telegram/updateMenus`;

    const res = await fetch(url, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: chat.id,
        currentMenu,
      }),
      credentials: "include",
    });
  } catch (err) {
    console.log(err);
  }
};

const retrieveMenu = async (ctx, skips) => {
  try {
    const chat = await ctx.getChat();

    const url = `${
      process.env.NODE_ENV === "production"
        ? "http://local.nusfitness.com:5000/"
        : "https://salty-reaches-24995.herokuapp.com/"
    }telegram/getPreviousMenu`;

    const res = await fetch(url, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: chat.id,
        skips,
      }),
      credentials: "include",
    });
    const data = await res.json();
    return data.previousMenu;
  } catch (err) {
    console.log(err);
  }
};

module.exports = { updateMenu, retrieveMenu };
