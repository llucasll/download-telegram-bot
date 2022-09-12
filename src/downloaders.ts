import fs from 'node:fs/promises';
import { dirname, basename } from 'node:path';

import { Message } from 'typegram';

import { findAvailableFileName } from './lib/findAvailableFileName.js';
import copyFileFromContainer from './lib/copyFileFromContainer.js';
import bot, { callApi, rootFolder, globals } from './lib/bot.js';

interface File {
	file_id: string,
	file_name?: string,
}

/** Result about the download of a file */
interface DownloadResult {
	/** Message sent prior to the download of the file, to be edited. */
	message_id: number,
	/** Path where the file was saved. */
	path: string,
}
async function downloadAndSaveFile
	({ file_id, file_name }: File, message: Message):
	Promise<DownloadResult>
{
	const { message_id } = await bot.sendMessage({
		chat_id: message.chat.id,
		text: `Iniciando o download do arquivo...`,
		reply_to_message_id: message.message_id,
	});
	
	const { file_path: pathInsideContainer } = await callApi('getFile', { file_id });
	
	const desiredPath = [
		rootFolder,
		globals.currentDir,
		file_name ?? basename(pathInsideContainer!),
	].join('/');
	const dir = dirname(desiredPath);
	await fs.mkdir(dir, { recursive: true });
	
	const targetPath = findAvailableFileName(desiredPath);
	await copyFileFromContainer(pathInsideContainer!, targetPath);
	
	return {
		message_id,
		path: targetPath,
	};
}

export async function video (message: Message.VideoMessage) {
	return await downloadAndSaveFile(message.video, message);
}

export async function videoNote (message: Message.VideoNoteMessage) {
	return await downloadAndSaveFile(message.video_note, message);
}

export async function photo (message: Message.PhotoMessage) {
	const selected = message.photo.reduce(
		(a, b) => a.height*a.width > b.height*b.width? a : b
	);
	
	return await downloadAndSaveFile(selected, message);
}

export async function document (message: Message.DocumentMessage) {
	return await downloadAndSaveFile(message.document, message);
}
