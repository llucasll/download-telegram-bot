import { AnyFunction } from './utils.js';
import log from './log.js';

export async function callWithExceptionHandler
	<T extends AnyFunction>
	(f: T):
	Promise<ReturnType<T> | null>
{
	
	try { return await f() }
	catch (e) { await log('Unhandled Error', e) }
	
	return null;
}

export default function withExceptionHandler<T extends AnyFunction> (f: T) {
	// @ts-ignore
	return (...args: Parameters<T>) => callWithExceptionHandler(_ => f(...args));
}
