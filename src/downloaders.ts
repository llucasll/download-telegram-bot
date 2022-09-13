import fs from 'node:fs/promises';
import { dirname, basename } from 'node:path';

import { findAvailableFileName } from './lib/findAvailableFileName.js';
import copyFileFromContainer from './lib/copyFileFromContainer.js';
import bot, { rootFolder, globals } from './lib/bot.js';

interface File {
	file_id: string,
	file_name?: string,
}

interface SetStatusCallback {
	// TODO
	(status: string): Promise<unknown>;
}

async function downloadAndSaveFile ({ file_id, file_name }: File, setStatus: SetStatusCallback) {
	await setStatus(file_name
		? `⬇️ 2/4: Baixando '${file_name}'...`
		: '⬇️ 2/4: Baixando...'
	);
	
	const { file_path: pathInsideContainer } = await bot.getFile({ file_id });
	
	const desiredPath = [
		rootFolder,
		globals.currentDir,
		file_name ?? basename(pathInsideContainer!),
	].join('/');
	const dir = dirname(desiredPath);
	await fs.mkdir(dir, { recursive: true });
	
	const targetPath = findAvailableFileName(desiredPath);
	await setStatus(`🔶 3/4: Download finalizado. Salvando em '${targetPath}}'...`);
	await copyFileFromContainer(pathInsideContainer!, targetPath);
	
	return targetPath;
}

interface FileInfoExtractor {
	(): File;
}
export default function getDownloader (fileInfoExtractor: FileInfoExtractor) {
	return async (setStatus: SetStatusCallback) =>
		await downloadAndSaveFile(fileInfoExtractor(), setStatus);
}
