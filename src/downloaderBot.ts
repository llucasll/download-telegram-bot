import { normalize } from 'node:path';

import { Message, Update } from 'typegram';

import * as constants from './lib/constants.js';
import log from './lib/log.js';
import bot, { authorizedUsers, rootFolder, globals } from './lib/bot.js';
import * as download from './downloaders.js';

const downloadsAbsolutePath = [ rootFolder, constants.downloadsRelativePath ].join('/');

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

/**
 * @return null if the given path is invalid
 */
function getNormalizedRelativePath (requested: string) {
	const target = [ downloadsAbsolutePath, requested ].join('/');
	const relative = normalize(target).replace(downloadsAbsolutePath + '/', '');
	
	if (!relative || !normalize(target).startsWith(downloadsAbsolutePath))
		return null;
	
	return relative;
}

export default async function updateHandler (update: Update) {
	if (!('message' in update))
		return await log('Not a message', update);
	
	const { message } = update;
	
	if (!authorizedUsers.includes(message.from.id))
		return await log('User is not authorized', update);
	
	if ('text' in message) {
		const relative = getNormalizedRelativePath(message.text);
		
		if (!relative)
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
