import process from 'node:process';
import fs from 'node:fs/promises';

// @ts-ignore
import TelegramBot from 'telegram-bot-api';
import { Telegram } from 'typegram';
import fetch from 'node-fetch';

import * as constants from './constants.js';

type Methods = {
	[Property in keyof Telegram]: Telegram[Property] extends Function
		? (...args: Parameters<Telegram[Property]>) =>
			Promise<ReturnType<Telegram[Property]>>
		: Telegram[Property]
}

export const globals = { currentDir: '' };
export const rootFolder = process.env.downloadsFolder ?? constants.defaultRootFolder;
export const token = process.env.telegramToken;
export const authorizedUsers = process.env.authorizedUsers!
	.split(',')
	.filter(x => x!=='')
	.map(x => Number(x));
// console.log(authorizedUsers);

await fs.mkdir(rootFolder, { recursive: true });
const bot = new TelegramBot({
	token,
	baseUrl: constants.apiUrl,
}) as Methods;
// @ts-ignore
bot.setMessageProvider(new TelegramBot.GetUpdateMessageProvider());

export default bot;

export async function callApi
	<T extends keyof Telegram>
	(method: T, data: Parameters<Telegram[T]>[0])
{
	const request = await fetch(`${constants.apiUrl}/bot${token}/${method}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});
	
	const { result } = await request.json() as any;
	return result as ReturnType<Telegram[T]>;
}
