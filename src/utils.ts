import log from './log.js';

async function callWithHandler <T extends (...args: any) => any> (f: T): Promise<ReturnType<T> | null> {
	try {
		return await f();
	}
	catch (e) {
		await log('Unhandled Error', e);
	}
	return null;
}

export function withHandler <T extends (...args: any) => any> (f: T) {
	// @ts-ignore
	return (...args: Parameters<T>) => callWithHandler(_ => f(...args));
}
