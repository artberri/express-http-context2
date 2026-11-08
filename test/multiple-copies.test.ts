import assert from 'node:assert/strict'
import { test } from 'node:test'

import express from 'express'
import supertest from 'supertest'

import * as copyA from '../src/index.ts'

// A query string gives the module a different URL, so Node loads a second,
// independent copy of it: what happens when an app and one of its
// dependencies resolve to different copies of this package (CommonJS and ESM
// builds, or two versions). See
// https://github.com/artberri/express-http-context2/issues/1
const copyB: typeof copyA = await import(
	new URL('../src/index.ts?copy=b', import.meta.url).href
)

void test('the second copy is a separate module instance', () => {
	assert.notEqual(copyA.middleware, copyB.middleware)
})

void test('a value set through one copy can be read through another', async () => {
	const app = express()
	// A library mounts the middleware and sets a value with its copy...
	app.use(copyA.middleware)
	app.use((req, _res, next) => {
		copyA.set('requestId', req.query['id'])
		next()
	})
	// ...and the app reads it with its own copy.
	app.get('/', (_req, res) => {
		res.json({ requestId: copyB.get<string>('requestId') })
	})

	const request = supertest(app)
	const [response1, response2] = await Promise.all([
		request.get('/').query({ id: 'id1' }),
		request.get('/').query({ id: 'id2' }),
	])

	assert.equal(response1.body.requestId, 'id1')
	assert.equal(response2.body.requestId, 'id2')
})

void test('sharing works in both directions between copies', async () => {
	const app = express()
	app.use(copyB.middleware)
	app.use((req, _res, next) => {
		copyB.set('requestId', req.query['id'])
		next()
	})
	app.get('/', (_req, res) => {
		res.json({ requestId: copyA.get<string>('requestId') })
	})

	const response = await supertest(app).get('/').query({ id: 'id1' })

	assert.equal(response.body.requestId, 'id1')
})

void test('values survive when each copy mounts its own middleware', async () => {
	const app = express()
	app.use(copyA.middleware)
	app.use((req, _res, next) => {
		copyA.set('requestId', req.query['id'])
		next()
	})
	app.use(copyB.middleware)
	app.get('/', (req, res) => {
		copyB.set('value', req.query['value'])
		res.json({
			requestId: copyB.get<string>('requestId'),
			value: copyA.get<string>('value'),
		})
	})

	const request = supertest(app)
	const [response1, response2] = await Promise.all([
		request.get('/').query({ id: 'id1', value: 'value1' }),
		request.get('/').query({ id: 'id2', value: 'value2' }),
	])

	assert.deepEqual(response1.body, { requestId: 'id1', value: 'value1' })
	assert.deepEqual(response2.body, { requestId: 'id2', value: 'value2' })
})

void test('values survive when the same middleware is mounted twice', async () => {
	const app = express()
	app.use(copyA.middleware)
	app.use((req, _res, next) => {
		copyA.set('requestId', req.query['id'])
		next()
	})
	app.use(copyA.middleware)
	app.get('/', (_req, res) => {
		res.json({ requestId: copyA.get<string>('requestId') })
	})

	const response = await supertest(app).get('/').query({ id: 'id1' })

	assert.equal(response.body.requestId, 'id1')
})

void test('requests do not share values across copies', async () => {
	const app = express()
	app.use(copyA.middleware)
	app.get('/set', (req, res) => {
		copyA.set('value', req.query['value'])
		res.json({ value: copyB.get<string>('value') })
	})
	app.use(copyB.middleware)
	app.get('/get', (_req, res) => {
		res.json({ value: copyB.get<string>('value') ?? null })
	})

	const request = supertest(app)
	await request.get('/set').query({ value: 'leaked' })
	const response = await request.get('/get')

	assert.equal(response.body.value, null)
})
