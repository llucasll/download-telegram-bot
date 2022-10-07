import { normalize } from 'node:path';

import { Message, Telegram, Update } from 'typegram';

import log from './lib/log.js';
import bot, { authorizedUsers, rootFolder, globals } from './lib/bot.js';
import getDownloader from './downloaders.js';

let filesDownloading = 0;
/**
 * @return true if the message contains a downloadable file
 */
async function downloadFile (message: Message) {
	const fileDownloader = getFileHandler(message);
	
	if (!fileDownloader)
		return false;
	
	filesDownloading++;
	
	const { message_id } = await bot.sendMessage({
		chat_id: message.chat.id,
		text: `⏳ 1/4: Aguardando para iniciar o download do arquivo...`,
		reply_to_message_id: message.message_id,
	});
	
	const setStatus = async (status: string) => await bot.editMessageText({
		message_id,
		chat_id: message.chat.id,
		text: status,
	});
	
	// TODO
	const path = await fileDownloader(setStatus);
	
	await setStatus(`☑️ 4/4: Arquivo salvo em '${path.replace('../', '')}'!`);
	
	filesDownloading--;
	
	if (filesDownloading === 0)
		await bot.sendMessage({
			chat_id: message.chat.id,
			text: `✅ O download de todos os arquivos foi finalizado!`,
			reply_to_message_id: message.message_id,
		});
	
	return true;
}

function getFileHandler (message: Message) {
	if ('video' in message)
		return getDownloader(() => message.video);
	
	if ('video_note' in message)
		return getDownloader(() => message.video_note);
	
	if ('photo' in message)
		return getDownloader(() =>
			message.photo.reduce(
				(a, b) => a.height*a.width > b.height*b.width? a : b
			)
		);
	
	if ('document' in message)
		return getDownloader(() => message.document);
	
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
		return log('Not a message', update);
	
	const { message } = update;
	
	if (!authorizedUsers.includes(message.from.id))
		return log('User is not authorized', update);
	
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
		reply_to_message_id: message.message_id,
	});
}
