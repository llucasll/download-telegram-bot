import process from 'node:process';
import fs from 'node:fs/promises';

// @ts-ignore
import TelegramBot from 'telegram-bot-api';
import { Telegram } from 'typegram';

type Methods = {
	[Property in keyof Telegram]: Telegram[Property] extends Function
		? (...args: Parameters<Telegram[Property]>) =>
			Promise<ReturnType<Telegram[Property]>>
		: Telegram[Property]
}

export const globals = { currentDir: '' };
export const downloadsFolder = process.env.downloadsFolder ?? '../telegramDownloads';
export const token = process.env.telegramToken;

await fs.mkdir(downloadsFolder, { recursive: true });
const bot = new TelegramBot({
	token,
	baseUrl: 'http://localhost:8081',
}) as Methods;
// @ts-ignore
bot.setMessageProvider(new TelegramBot.GetUpdateMessageProvider());

export default bot;
