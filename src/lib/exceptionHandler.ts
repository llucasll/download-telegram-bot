import { AnyFunction } from './utils.js';
import log from './log.js';

export function callWithExceptionHandler
	<T extends AnyFunction>
	(f: T):
	ReturnType<T> | null
{
	
	try { return f() }
	catch (e) { log('Unhandled Error', e) }
	
	return null;
}

export default function withExceptionHandler<T extends AnyFunction> (f: T) {
	// @ts-ignore
	return (...args: Parameters<T>) => callWithExceptionHandler(_ => f(...args));
}
