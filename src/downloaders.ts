import fs from 'node:fs/promises';
import { dirname, basename } from 'node:path';

import { Message } from 'typegram';

import { findAvailableFileName } from './lib/findAvailableFileName.js';
import copyFileFromContainer from './lib/copyFileFromContainer.js';
import { callApi, rootFolder, globals } from './lib/bot.js';

interface File {
	file_id: string,
	file_name?: string,
}

interface SetStatusCallback {
	(status: string): Promise<unknown>;
}

async function downloadAndSaveFile ({ file_id, file_name }: File, setStatus: SetStatusCallback) {
	await setStatus(file_name
		? `2/4 Baixando '${file_name}'...`
		: '2/4 Baixando...'
	);
	
	const { file_path: pathInsideContainer } = await callApi('getFile', { file_id });
	
	const desiredPath = [
		rootFolder,
		globals.currentDir,
		file_name ?? basename(pathInsideContainer!),
	].join('/');
	const dir = dirname(desiredPath);
	await fs.mkdir(dir, { recursive: true });
	
	const targetPath = findAvailableFileName(desiredPath);
	await setStatus(`3/4 Download finalizado. Salvando em '${targetPath}}'...`);
	await copyFileFromContainer(pathInsideContainer!, targetPath);
	
	return targetPath;
}

export async function video (message: Message.VideoMessage, setStatus: SetStatusCallback) {
	return await downloadAndSaveFile(message.video, setStatus);
}

export async function videoNote (message: Message.VideoNoteMessage, setStatus: SetStatusCallback) {
	return await downloadAndSaveFile(message.video_note, setStatus);
}

export async function photo (message: Message.PhotoMessage, setStatus: SetStatusCallback) {
	const selected = message.photo.reduce(
		(a, b) => a.height*a.width > b.height*b.width? a : b
	);
	
	return await downloadAndSaveFile(selected, setStatus);
}

export async function document (message: Message.DocumentMessage, setStatus: SetStatusCallback) {
	return await downloadAndSaveFile(message.document, setStatus);
}
