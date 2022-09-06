import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import { dirname } from 'node:path';

import fetch from 'node-fetch';
import * as TelegramTypes from 'typegram';

import bot, { downloadsFolder, token, globals } from './bot.js';

const fileNamesInUse = [] as string[];

function fileNameAvailable (path: string) {
	if (fileNamesInUse.includes(path))
		return false;
	
	return !fsSync.existsSync(path);
}

async function saveFile (path: string, content: NodeJS.ReadableStream) {
	let finalPath = path;
	
	for (let i=1; !fileNameAvailable(finalPath); i++)
		finalPath = `${path} (${i})`;
	
	fileNamesInUse.push(finalPath);
	await fs.writeFile(finalPath, content);
	
	return finalPath;
}

async function downloadAndSave ({ file_id }: { file_id: string }) {
	const { file_path: path } = await bot.getFile({ file_id });
	// const response = await fetch(`https://api.telegram.org/file/bot${token}/${path}`);
	const response = await fetch(`http://localhost:8081/file/bot${token}/${path}`);
	
	const destinationPath = [
		downloadsFolder,
		'files',
		globals.currentDir,
		path!.replaceAll('/', '_'),
	].join('/');
	const dir = dirname(destinationPath);
	
	await fs.mkdir(dir, { recursive: true });
	return await saveFile(destinationPath, response.body!);
}

export async function video (message: TelegramTypes.Message.VideoMessage) {
	return await downloadAndSave(message.video);
}

export async function videoNote (message: TelegramTypes.Message.VideoNoteMessage) {
	return await downloadAndSave(message.video_note);
}

export async function photo (message: TelegramTypes.Message.PhotoMessage) {
	const selected = message.photo.reduce(
		(a, b) => a.height*a.width > b.height*b.width? a : b
	);
	
	return await downloadAndSave(selected);
}

export async function document (message: TelegramTypes.Message.DocumentMessage) {
	return await downloadAndSave(message.document);
}
