import fsSync from 'node:fs';

const fileNamesInUse = [] as string[];

function isFileNameAvailable (path: string) {
	if (fileNamesInUse.includes(path))
		return false;
	
	return !fsSync.existsSync(path);
}

export function findAvailableFileName (desired: string) {
	let finalPath = desired;
	for (let i = 1; !isFileNameAvailable(finalPath); i++)
		finalPath = `${desired} (${i})`;
	
	fileNamesInUse.push(finalPath);
	
	return finalPath;
}
