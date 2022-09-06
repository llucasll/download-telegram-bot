import process from 'node:process';
import { normalize } from 'node:path';

import * as TelegramTypes from 'typegram';

import bot, { downloadsFolder, globals } from './bot.js';
import log from './log.js';
import * as download from './downloaders.js';
import { withHandler } from './utils.js';

const authorizedUsers = process.env.authorizedUsers!
	.split(',')
	.filter(x => x!=='')
	.map(x => Number(x));
console.log(authorizedUsers);

async function downloadFile (message: TelegramTypes.Message) {
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

async function updateHandler (update: TelegramTypes.Update.MessageUpdate) {
	if (!update.message) {
		await log('Not a message', update);
		return;
	}
	
	const { message } = update;
	
	if (!authorizedUsers.includes(message.from.id)) {
		await log('User is not authorized', update);
		return;
	}
	
	if ('text' in message) {
		const root = [ downloadsFolder, 'files' ].join('/');
		const target = [ root, message.text ].join('/');
		const relative = normalize(target).replace(root + '/', '');
		
		// console.log([ root, target, normalize(target), relative ]);
		
		if (!relative || !normalize(target).startsWith(root)) {
			await bot.sendMessage({
				chat_id: message.chat.id,
				text: `Desculpe, não é permitido salvar na pasta raíz, ou acima dela`,
			});
			
			return;
		}
		
		globals.currentDir = relative;
		
		await bot.sendMessage({
			chat_id: message.chat.id,
			text: `Pasta alterada para '${globals.currentDir}'`,
		});
		
		return;
	}
	
	if (!globals.currentDir) {
		await bot.sendMessage({
			chat_id: message.chat.id,
			text: 'Por favor, digite o nome da pasta antes de enviar arquivos para download',
		});
		return;
	}
	
	const path = await downloadFile(message);
	if (path) {
		await bot.sendMessage({
			chat_id: message.chat.id,
			text: `Arquivo salvo em '${path.replace('../', '')}'!`,
		});
		return;
	}
	
	await bot.sendMessage({
		chat_id: message.chat.id,
		text: 'Desculpe, não entendi. Você deve mandar o nome de uma pasta, ou arquivos.',
	});
	return;
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
