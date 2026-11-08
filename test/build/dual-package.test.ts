import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

import express from 'express'
import supertest from 'supertest'

// Checks the built package, so run it after `pnpm run build`. Node loads the
// CommonJS and ESM builds as two separate modules, which is how an ESM app and
// a CommonJS dependency end up with different copies of this package. See
// https://github.com/artberri/express-http-context2/issues/1
type HttpContext = typeof import('../../src/index.ts')

const require = createRequire(import.meta.url)
const cjs: HttpContext = require('../../lib/index.cjs')
const esm: HttpContext = await import(
	new URL('../../lib/index.mjs', import.meta.url).href
)

void test('the CommonJS and ESM builds are separate module instances', () => {
	assert.notEqual(cjs.middleware, esm.middleware)
})

void test('a value set through the CommonJS build can be read through the ESM build', async () => {
	const app = express()
	app.use(cjs.middleware)
	app.use((req, _res, next) => {
		cjs.set('requestId', req.query['id'])
		next()
	})
	app.get('/', (_req, res) => {
		res.json({ requestId: esm.get<string>('requestId') })
	})

	const request = supertest(app)
	const [response1, response2] = await Promise.all([
		request.get('/').query({ id: 'id1' }),
		request.get('/').query({ id: 'id2' }),
	])

	assert.equal(response1.body.requestId, 'id1')
	assert.equal(response2.body.requestId, 'id2')
})
