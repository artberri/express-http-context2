import assert from 'node:assert/strict'
import { test } from 'node:test'

import express, { type Express, type Request, type Response } from 'express'
import supertest from 'supertest'

import { get, middleware, set } from '../src/index.ts'

const randomValue = Math.random()

const initAppWithMiddleware = (
	endpoint: (req: Request, res: Response) => void | Promise<void>,
): Express => {
	const app = express()
	app.use(middleware)
	app.get('/', endpoint)

	return app
}

const delay = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms))

void test('do not persist values if middleware is not used', async () => {
	const app = express()
	app.get('/', (_: Request, res: Response) => {
		set('value', randomValue)

		res.status(200).json({
			value: get<number>('value'),
		})
	})

	const response = await supertest(app).get('/')

	assert.equal(response.body.value, undefined)
})

void test('do persist values in request', async () => {
	const app = initAppWithMiddleware((_, res) => {
		set('value', randomValue)

		res.status(200).json({
			value: get<number>('value'),
		})
	})

	const response = await supertest(app).get('/')

	assert.equal(response.body.value, randomValue)
})

void test('return undefined if the value is not set', async () => {
	const app = initAppWithMiddleware((_, res) => {
		set('value', randomValue)

		res.status(200).json({
			value: get<number>('nokey'),
		})
	})

	const response = await supertest(app).get('/')

	assert.equal(response.body.value, undefined)
})

void test('maintains unique value across concurrent requests', async () => {
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

	assert.equal(response1.body.value, 'value1')
	assert.equal(response2.body.value, 'value2')
})

void test('maintains unique value across concurrent requests after response is sent', async () => {
	const laterChecks: Array<Promise<void>> = []
	const app = initAppWithMiddleware((req, res) => {
		set('value', req.query['value'])
		laterChecks.push(
			delay(50).then(() => {
				assert.equal(get<string>('value'), req.query['value'])
			}),
		)

		res.status(200).json({
			value: get<number>('value'),
		})
	})

	const request = supertest(app)
	const [response1, response2] = await Promise.all([
		request.get('/').query({ value: 'value1' }),
		request.get('/').query({ value: 'value2' }),
	])

	assert.equal(response1.body.value, 'value1')
	assert.equal(response2.body.value, 'value2')
	assert.equal(laterChecks.length, 2)
	await Promise.all(laterChecks)
})

void test('maintains unique value across concurrent requests with native promises', async () => {
	const app = initAppWithMiddleware((req, res) => {
		set('value', req.query['value'])

		const asyncTask = (): void => {
			void delay(30).then(() => {
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

	assert.equal(response1.body.value, 'value3')
	assert.equal(response2.body.value, 'value4')
})

void test('maintains unique value across concurrent requests with async/await', async () => {
	const app = initAppWithMiddleware(async (req, res) => {
		set('value', req.query['value'])

		const asyncTask = async (): Promise<void> => {
			await delay(15)
			res.status(200).json({
				value: get<number>('value'),
			})
		}

		await asyncTask()
	})

	const request = supertest(app)
	const [response1, response2] = await Promise.all([
		request.get('/').query({ value: 'value5' }),
		request.get('/').query({ value: 'value6' }),
	])

	assert.equal(response1.body.value, 'value5')
	assert.equal(response2.body.value, 'value6')
})
