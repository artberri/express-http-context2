import { AsyncLocalStorage } from 'async_hooks'
import type { NextFunction, Request, Response } from 'express'

const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>()

/**
 * Express.js middleware that is responsible for initializing the context for each request.
 */
export function middleware(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	asyncLocalStorage.run(new Map(), () => next())
}

/**
 * Gets a value from the context by key.
 * Will return undefined if the context has not yet been initialized for this request
 * or if a value is not found for the specified key.
 */
export function get<T = any>(key: string): T | undefined {
	return asyncLocalStorage.getStore()?.get(key)
}

/**
 * Adds a value to the context by key.
 * If the key already exists, its value will be overwritten.
 * No value will persist if the context has not yet been initialized.
 */
export function set<T = any>(key: string, value: T): void {
	asyncLocalStorage.getStore()?.set(key, value)
}

export default { get, middleware, set }
