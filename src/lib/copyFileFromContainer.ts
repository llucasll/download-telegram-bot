import util from 'node:util';
import childProcess from 'node:child_process';

const exec = util.promisify(childProcess.exec);

export default async function copyFileFromContainer
	(pathInsideContainer: string, targetPath: string)
{
	return await exec(
		`docker cp telegram-bot-api-server:"${pathInsideContainer}" "${targetPath}"`
	);
}
