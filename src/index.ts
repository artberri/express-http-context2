import { AsyncLocalStorage } from 'node:async_hooks'
import type { NextFunction, Request, Response } from 'express'

type Store = Map<string, any>

// Several copies of this package can be loaded at once: the CommonJS and ESM
// builds, or different versions required by an app and by its dependencies.
// They all share one AsyncLocalStorage, registered globally, so a value set
// through one copy can be read through any other.
// See https://github.com/artberri/express-http-context2/issues/1
const storageKey: unique symbol = Symbol.for('express-http-context2.storage')
const requestStoreKey: unique symbol = Symbol.for('express-http-context2.store')

const registry = globalThis as typeof globalThis & {
	[storageKey]?: AsyncLocalStorage<Store>
}
const asyncLocalStorage: AsyncLocalStorage<Store> = (registry[storageKey] ??=
	new AsyncLocalStorage<Store>())

/**
 * Returns the store of this request, creating it the first time.
 * Keeping it on the request means that mounting the middleware more than
 * once (for example by the app and by a library) keeps the values already set.
 */
function getRequestStore(req: Request): Store {
	const request = req as Request & { [requestStoreKey]?: Store }
	let store = request[requestStoreKey]
	if (!store) {
		store = new Map()
		Object.defineProperty(request, requestStoreKey, { value: store })
	}

	return store
}

/**
 * Express.js middleware that is responsible for initializing the context for each request.
 */
export function middleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	asyncLocalStorage.run(getRequestStore(req), () => next())
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

const httpContext: {
	get: typeof get
	middleware: typeof middleware
	set: typeof set
} = { get, middleware, set }

export default httpContext
