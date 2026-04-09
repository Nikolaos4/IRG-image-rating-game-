import { Telegraf } from "telegraf";

import "dotenv/config.js";

export const bot = new Telegraf(process.env.TG_TOKEN!);
