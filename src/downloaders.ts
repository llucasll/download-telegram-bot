import process from 'node:process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { dirname, basename } from 'node:path';
import childProcess from 'node:child_process';
import util from 'node:util';

import fetch from 'node-fetch';
import * as TelegramTypes from 'typegram';

import { downloadsFolder, globals } from './bot.js';

const exec = util.promisify(childProcess.exec);

const fileNamesInUse = [] as string[];

function fileNameAvailable (path: string) {
	if (fileNamesInUse.includes(path))
		return false;
	
	return !fsSync.existsSync(path);
}

async function copyFileFromContainer (source: string, target: string) {
	let finalPath = target;
	for (let i=1; !fileNameAvailable(finalPath); i++)
		finalPath = `${target} (${i})`;
	
	fileNamesInUse.push(finalPath);
	
	await exec(`docker cp telegram-bot-api-server:"${source}" "${finalPath}"`);
	
	return finalPath;
}

async function downloadAndSave ({ file_id, file_name }: { file_id: string, file_name?: string }) {
	const request = await fetch(`http://localhost:8081/bot${process.env.telegramToken}/getFile`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			file_id,
		}),
	});
	
	const { result: { file_path: path } } = await request.json() as any;
	
	const destinationPath = [
		downloadsFolder,
		'files',
		globals.currentDir,
		file_name ?? basename(path),
	].join('/');
	const dir = dirname(destinationPath);
	
	await fs.mkdir(dir, { recursive: true });
	return await copyFileFromContainer(path, destinationPath);
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
