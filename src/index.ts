import './environment.js';

import log from './lib/log.js';
import bot, { authorizedUsers } from './lib/bot.js';
import withExceptionHandler from './lib/exceptionHandler.js';

import updateHandler from './downloaderBot.js';

/*
TODO check if 'process.env.authorizedUsers'
 and 'process.env.telegramToken' variables are set, and prompt to the user if not.
 */

bot.on('update', withExceptionHandler(updateHandler));
await bot.start();

await log('Authorized users', await Promise.all(
	authorizedUsers.map(chat_id => bot.getChat({ chat_id })
		.then(({ first_name, last_name }: any) => first_name + ' ' + last_name)
	)
), false);

await Promise.all(
	authorizedUsers.map(async chat_id => await bot.sendMessage({
		chat_id,
		text: `Bot de download iniciado!\nEnvie o nome da pasta`,
	}))
);
