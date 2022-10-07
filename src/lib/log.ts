import fs from 'node:fs';

import { rootFolder } from './bot.js';

const path = [
	rootFolder,
	'logs.json',
].join('/');

export default function log (message: string, data?: any, persist=true) {
	const now = new Date();
	const newLog = {
		timestamp: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
		message,
		data,
	};
	console.log(newLog);
	
	if (!persist)
		return;
	
	const str = fs.readFileSync(path, { encoding: 'utf-8' }) ?? '[]';
	
	const logs = JSON.parse(str? str : '[]');
	logs.unshift(newLog);
	
	fs.writeFileSync(path, JSON.stringify(logs, null, '\t'));
}
