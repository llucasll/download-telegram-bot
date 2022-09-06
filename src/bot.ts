import process from 'node:process';
import fs from 'node:fs/promises';

// @ts-ignore
import TelegramBot from 'telegram-bot-api';
import * as TelegramTypes from 'typegram';

type Methods = {
	[Property in keyof TelegramTypes.Telegram]: TelegramTypes.Telegram[Property] extends Function
		? (...args: Parameters<TelegramTypes.Telegram[Property]>) =>
			Promise<ReturnType<TelegramTypes.Telegram[Property]>>
		: TelegramTypes.Telegram[Property]
}

const globals = { currentDir: null as unknown as string };
const downloadsFolder = process.env.downloadsFolder ?? '../telegramDownloads';
await fs.mkdir(downloadsFolder, { recursive: true });
const token = process.env.telegramToken;
const bot: Methods = new TelegramBot({
	token,
	baseUrl: 'http://localhost:8081',
});
// @ts-ignore
bot.setMessageProvider(new TelegramBot.GetUpdateMessageProvider());

export default bot;
export {
	token,
	downloadsFolder,
	globals,
};
