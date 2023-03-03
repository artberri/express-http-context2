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

const initAppWithMiddleware = (
	endpoint: (req: Request, res: Response) => void
): Express => {
	const app = express()
	app.use(middleware)
	app.get('/', endpoint)

	return app
}
