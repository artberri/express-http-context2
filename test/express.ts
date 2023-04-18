import { init, REQUEST_ID_CONTEXT_KEY, REQUEST_ID_IN_RESPONSE_HTTP_HEADER_NAME } from '@oliverlockwood/express-http-context-intermediate-library'
import express, { Express, Request, Response } from 'express'
import supertest from 'supertest'
import tap from 'tap'

import { get, middleware, set } from '../src'

const randomValue = Math.random()

void tap.test('do not persist values if middleware is not used', async (t) => {
	const app = express()
	app.get('/', (_: Request, res: Response) => {
		set('value', randomValue)

		res.status(200).json({
			value: get<number>('value'),
		})
	})

	const response = await supertest(app).get('/')

	t.strictSame(response.body.value, undefined)
})

void tap.test('do persist values in request', async (t) => {
	const app = initAppWithMiddleware((_, res) => {
		set('value', randomValue)

		res.status(200).json({
			value: get<number>('value'),
		})
	})

	const response = await supertest(app).get('/')

	t.strictSame(response.body.value, randomValue)
})

void tap.test('return undefined if the value is not set', async (t) => {
	const app = initAppWithMiddleware((_, res) => {
		set('value', randomValue)

		res.status(200).json({
			value: get<number>('nokey'),
		})
	})

	const response = await supertest(app).get('/')

	t.strictSame(response.body.value, undefined)
})

void tap.test(
	'maintains unique value across concurrent requests',
	async (t) => {
		const app = initAppWithMiddleware((req, res) => {
			set('value', req.query['value'])

			res.status(200).json({
				value: get<number>('value'),
			})
		})

		const request = supertest(app)
		const [response1, response2] = await Promise.all([
			request.get('/').query({ value: 'value1' }),
			request.get('/').query({ value: 'value2' }),
		])

		t.strictSame(response1.body.value, 'value1')
		t.strictSame(response2.body.value, 'value2')
	}
)

void tap.test(
	'maintains unique value across concurrent requests after response is sent',
	(t) => {
		t.plan(4)
		const app = initAppWithMiddleware((req, res) => {
			set('value', req.query['value'])
			setTimeout(() => {
				const value = get<number>('value')
				t.strictSame(value, req.query['value'])
			}, 50)

			res.status(200).json({
				value: get<number>('value'),
			})
		})

		const request = supertest(app)
		void Promise.all([
			request.get('/').query({ value: 'value1' }),
			request.get('/').query({ value: 'value2' }),
		]).then(([response1, response2]) => {
			t.strictSame(response1.body.value, 'value1')
			t.strictSame(response2.body.value, 'value2')
		})
	}
)

void tap.test(
	'maintains unique value across concurrent requests after response is sent',
	(t) => {
		t.plan(4)
		const app = initAppWithMiddleware((req, res) => {
			set('value', req.query['value'])
			setTimeout(() => {
				const value = get<number>('value')
				t.strictSame(value, req.query['value'])
			}, 50)

			res.status(200).json({
				value: get<number>('value'),
			})
		})

		const request = supertest(app)
		void Promise.all([
			request.get('/').query({ value: 'value1' }),
			request.get('/').query({ value: 'value2' }),
		]).then(([response1, response2]) => {
			t.strictSame(response1.body.value, 'value1')
			t.strictSame(response2.body.value, 'value2')
		})
	}
)

void tap.test(
	'maintains unique value across concurrent requests with native promises',
	async (t) => {
		const app = initAppWithMiddleware((req, res) => {
			set('value', req.query['value'])

			const asyncTask = (): void => {
				void new Promise((resolve) => setTimeout(resolve, 30)).then(() => {
					res.status(200).json({
						value: get<number>('value'),
					})
				})
			}

			asyncTask()
		})

		const request = supertest(app)
		const [response1, response2] = await Promise.all([
			request.get('/').query({ value: 'value3' }),
			request.get('/').query({ value: 'value4' }),
		])

		t.strictSame(response1.body.value, 'value3')
		t.strictSame(response2.body.value, 'value4')
	}
)

void tap.test(
	'maintains unique value across concurrent requests with async/await',
	async (t) => {
		const app = initAppWithMiddleware(async (req, res) => {
			set('value', req.query['value'])

			const asyncTask = async (): Promise<void> => {
				await new Promise((resolve) => setTimeout(resolve, 15)).then(() => {
					res.status(200).json({
						value: get<number>('value'),
					})
				})
			}

			await asyncTask()
		})

		const request = supertest(app)
		const [response1, response2] = await Promise.all([
			request.get('/').query({ value: 'value5' }),
			request.get('/').query({ value: 'value6' }),
		])

		t.strictSame(response1.body.value, 'value5')
		t.strictSame(response2.body.value, 'value6')
	}
)

void tap.test(
	'maintains unique value when the library is depended upon both directly and transitively',
	async (t) => {
		const app = express()

		// this function in the test library does app.use(middleware) and
		// httpContext.set(REQUEST_ID_CONTEXT_KEY, <a unique id>)
		init(app)

		app.get('/', ((req, res) => {
			set('value', req.query['value'])

			res.status(200).json({
				value: req.query['value'],
				valueFromContext: get<number>('value'),
				requestId: get<string>(REQUEST_ID_CONTEXT_KEY)
			})
		}))

		const request = supertest(app)
		const [response1, response2] = await Promise.all([
			request.get('/').query({ value: 'value1' }),
			request.get('/').query({ value: 'value2' }),
		])

		console.log(response1.body);
		console.log(response1.headers);
		console.log(response2.body);
		console.log(response2.headers);

		t.strictSame(response1.body.value, 'value1')
		t.strictSame(response2.body.value, 'value2')

		t.type(response1.header[REQUEST_ID_IN_RESPONSE_HTTP_HEADER_NAME], "string")
		t.strictSame(response1.header[REQUEST_ID_IN_RESPONSE_HTTP_HEADER_NAME].length, 21)
		t.type(response2.header[REQUEST_ID_IN_RESPONSE_HTTP_HEADER_NAME], "string")
		t.strictSame(response2.header[REQUEST_ID_IN_RESPONSE_HTTP_HEADER_NAME].length, 21)

		// This is the specific example I had flagged in the Github issue - where
		// setting something into the httpContext in a common library, but it's
		// unusable from within the application code.
		t.strictSame(response1.body.requestId, response1.header[REQUEST_ID_IN_RESPONSE_HTTP_HEADER_NAME])
		t.strictSame(response2.body.requestId, response2.header[REQUEST_ID_IN_RESPONSE_HTTP_HEADER_NAME])

		// These operations also fail, I suspect, because neither of the set/get
		// functions are usable, because the directly imported AsyncLocalStorage has
		// not been initialised by a call to `app.use(middleware)` within our code
		// here.  Effectively this is another manifestation of the same bug -
		// showing that although the middleware *has* already been initialised in
		// Express request handler chain, it is not usable because the
		// AsyncLocalStorage context is not identical for all usages of the
		// `express-http-context2` library code.
		t.strictSame(response1.body.valueFromContext, 'value1')
		t.strictSame(response2.body.valueFromContext, 'value2')
	}
)

const initAppWithMiddleware = (
	endpoint: (req: Request, res: Response) => void
): Express => {
	const app = express()
	app.use(middleware)
	app.get('/', endpoint)

	return app
}
