import fs from 'node:fs/promises';

import { rootFolder } from './bot.js';

const path = [
	rootFolder,
	'logs.json',
].join('/');

export default async function log (message: string, data?: any, persist=true) {
	const now = new Date();
	const newLog = {
		timestamp: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
		message,
		data,
	};
	console.log(newLog);
	
	if (!persist)
		return;
	
	const str = await fs.readFile(path, { encoding: 'utf-8' })
		.catch(_ => '[]');
	
	const logs = JSON.parse(str? str : '[]');
	logs.unshift(newLog);
	
	await fs.writeFile(path, JSON.stringify(logs, null, '\t'));
}
