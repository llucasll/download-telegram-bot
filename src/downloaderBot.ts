import { normalize } from 'node:path';

import { Message, Update } from 'typegram';

import log from './lib/log.js';
import bot, { authorizedUsers, rootFolder, globals } from './lib/bot.js';
import * as download from './downloaders.js';

/**
 * @return true if the message contains a downloadable file
 */
async function downloadFile (message: Message) {
	const fileDownloader = chooseFileHandler(message);
	
	if (!fileDownloader)
		return false;
	
	const { message_id } = await bot.sendMessage({
		chat_id: message.chat.id,
		text: `Iniciando o download do arquivo...`,
		reply_to_message_id: message.message_id,
	});
	
	const setStatus = async (status: string) => await bot.editMessageText({
		message_id,
		chat_id: message.chat.id,
		text: status,
	});
	
	// TODO
	const path = await fileDownloader(message as any, setStatus);
	
	await setStatus(`Arquivo salvo em '${path.replace('../', '')}'!`);
	
	return true;
}

function chooseFileHandler (message: Message) {
	if ('video' in message)
		return download.video;
	
	if ('video_note' in message)
		return download.videoNote;
	
	if ('photo' in message)
		return download.photo;
	
	if ('document' in message)
		return download.document;
	
	return null;
}

/**
 * @return null if the given path is invalid
 */
function getNormalizedRelativePath (requested: string) {
	const target = [ rootFolder, requested ].join('/');
	const relative = normalize(target).replace(rootFolder + '/', '');
	
	if (!relative || !normalize(target).startsWith(rootFolder))
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
	
	if (await downloadFile(message))
		return;
	
	await bot.sendMessage({
		chat_id: message.chat.id,
		text: 'Desculpe, não entendi. Você deve mandar o nome de uma pasta, ou arquivos.',
	});
}
