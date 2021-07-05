const Telegraf = require("telegraf");
require("dotenv").config();

const bot = new Telegraf(process.env.TOKEN);
