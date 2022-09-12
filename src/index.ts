import log from './lib/log.js';
import bot, { authorizedUsers } from './lib/bot.js';
import withExceptionHandler from './lib/exceptionHandler.js';

import updateHandler from './downloaderBot.js';

/*
TODO check if 'process.env.authorizedUsers'
 and 'process.env.telegramToken' variables are set, and prompt to the user if not.
 */

// @ts-ignore
bot.on('update', withExceptionHandler(updateHandler));

// @ts-ignore
await bot.start();

await log('Authorized users', await Promise.all(
	authorizedUsers.map(chat_id => bot.getChat({ chat_id })
		.then(({ first_name, last_name }: any) => first_name + ' ' + last_name)
	)
), false);
