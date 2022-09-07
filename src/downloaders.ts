import process from 'node:process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { dirname, basename } from 'node:path';
import childProcess from 'node:child_process';
import util from 'node:util';

import fetch from 'node-fetch';
import { Message } from 'typegram';

import bot, { downloadsFolder, globals } from './bot.js';

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

interface File {
	file_id: string,
	file_name?: string,
}
interface DownloadResult {
	message_id: number,
	path: string,
}
async function downloadAndSave
	({ file_id, file_name }: File, message: Message):
	Promise<DownloadResult>
{
	const { message_id } = await bot.sendMessage({
		chat_id: message.chat.id,
		text: `Iniciando o download do arquivo...`,
		reply_to_message_id: message.message_id,
	});
	
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
		'downloaded',
		globals.currentDir,
		file_name ?? basename(path),
	].join('/');
	const dir = dirname(destinationPath);
	await fs.mkdir(dir, { recursive: true });
	
	return {
		message_id,
		path: await copyFileFromContainer(path, destinationPath),
	};
}

export async function video (message: Message.VideoMessage) {
	return await downloadAndSave(message.video, message);
}

export async function videoNote (message: Message.VideoNoteMessage) {
	return await downloadAndSave(message.video_note, message);
}

export async function photo (message: Message.PhotoMessage) {
	const selected = message.photo.reduce(
		(a, b) => a.height*a.width > b.height*b.width? a : b
	);
	
	return await downloadAndSave(selected, message);
}

export async function document (message: Message.DocumentMessage) {
	return await downloadAndSave(message.document, message);
}
