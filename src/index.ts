import process from 'node:process';
import { normalize } from 'node:path';

import { Message, Update } from 'typegram';

import { withHandler } from './utils.js';
import log from './log.js';
import bot, { downloadsFolder, globals } from './bot.js';
import * as download from './downloaders.js';

/*
TODO check if 'process.env.authorizedUsers' and 'process.env.telegramToken' variables are set, and prompt to the user if not.
 */

const authorizedUsers = process.env.authorizedUsers!
	.split(',')
	.filter(x => x!=='')
	.map(x => Number(x));
// console.log(authorizedUsers);

const rootFolder = [ downloadsFolder, 'files' ].join('/');

async function downloadFile (message: Message) {
	if ('video' in message)
		return await download.video(message);
	
	if ('video_note' in message)
		return await download.videoNote(message);
	
	if ('photo' in message)
		return await download.photo(message);
	
	if ('document' in message)
		return await download.document(message);
	
	return null;
}

async function updateHandler (update: Update.MessageUpdate) {
	if (!update.message)
		return await log('Not a message', update);
	
	const { message } = update;
	
	if (!authorizedUsers.includes(message.from.id))
		return await log('User is not authorized', update);
	
	if ('text' in message) {
		const target = [ rootFolder, message.text ].join('/');
		const relative = normalize(target).replace(rootFolder + '/', '');
		
		if (!relative || !normalize(target).startsWith(rootFolder))
			return await bot.sendMessage({
				chat_id: message.chat.id,
				text: `Desculpe, não é permitido salvar na pasta raíz, ou acima dela`,
				reply_to_message_id: message.message_id,
			});
		
		globals.currentDir = relative;
		
		return await bot.sendMessage({
			chat_id: message.chat.id,
			text: `Pasta alterada para '${globals.currentDir}'`,
		});
	}
	
	if (!globals.currentDir)
		return await bot.sendMessage({
			chat_id: message.chat.id,
			text: 'Por favor, digite o nome da pasta antes de enviar arquivos para download',
		});
	
	const result = await downloadFile(message);
	if (result) {
		const { message_id, path } = result;
		return await bot.editMessageText({
			message_id,
			chat_id: message.chat.id,
			text: `Arquivo salvo em '${path.replace('../', '')}'!`,
		});
	}
	
	await bot.sendMessage({
		chat_id: message.chat.id,
		text: 'Desculpe, não entendi. Você deve mandar o nome de uma pasta, ou arquivos.',
	});
}

// @ts-ignore
bot.on('update', withHandler(updateHandler));

// @ts-ignore
await bot.start();

await log('Authorized users', await Promise.all(
	authorizedUsers.map(chat_id => bot.getChat({ chat_id })
		.then(({ first_name, last_name }: any) => first_name + ' ' + last_name)
	)
), false);
