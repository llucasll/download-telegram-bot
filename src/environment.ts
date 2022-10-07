import os from 'node:os';
import fs from 'node:fs';
import process from 'node:process';

import dotenv from 'dotenv';

const cwd = process.env.userCurrentDirectory // can be injected/forced, in case of issues
	?? process.env.INIT_CWD // can be detected automatically
	?? process.cwd(); // default

// TODO workaround to take precedence from existing env var over .env files
const telegramToken = process.env.telegramToken;

const possiblyPaths = [
	// more precedence
	cwd + '/.env',
	cwd + '/../.env',
	
	// less precedence
	'.env',
	'../.env',
	
	// last resource
	os.homedir() + '/bot.env',
];
const path = possiblyPaths.find(path => fs.existsSync(path));

if (!path) {
	console.error(
		'Environment file not provided at '
			+ '`./.env`, `../.env` or `~/bot.env`'
			+ ' (this precedence order)'
	);
	process.exit(1);
}

dotenv.config({ path });
// TODO workaround to take precedence from existing env var over .env files
if (telegramToken) // high precedence
	process.env.telegramToken = telegramToken;
