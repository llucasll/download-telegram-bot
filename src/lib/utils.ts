export type AnyFunction = (...args: any) => any;

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
