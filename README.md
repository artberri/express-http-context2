# Express HTTP Context 2

[![Rate on Openbase](https://badges.openbase.com/js/rating/express-http-context2.svg)](https://openbase.com/js/express-http-context2?utm_source=embedded&utm_medium=badge&utm_campaign=rate-badge)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](./CODE_OF_CONDUCT.md)
[![MIT license](https://img.shields.io/npm/l/express-http-context2)](./LICENSE)
[![Build status](https://github.com/artberri/express-http-context2/actions/workflows/qa.yml/badge.svg)](https://github.com/artberri/express-http-context2/actions/workflows/qa.yml)
[![codecov](https://codecov.io/gh/artberri/express-http-context2/branch/main/graph/badge.svg?token=VSIC7EAX0Y)](https://codecov.io/gh/artberri/express-http-context2)

Modern request-scoped storage support for Express.js, based on native Node.js Asynchronous Local Storage. It's a great place to store user state, claims from a JWT, request/correlation IDs, and any other request-scoped data.

This package is a drop-in replacement and has been inspired by the work done in [express-http-context](https://github.com/skonves/express-http-context), but with ESM support, no dependencies, and only supporting modern versions of Node.js (+v14).

## Installation

```bash
npm install express-http-context2
# or
yarn add express-http-context2
# or
pnpm add express-http-context2
```

> **Requirements**
>
> `express-http-context2` is a middleware intended for `express`, so although it is not explicitly declared as a dependency or peer dependency, it requires `express` to work, as well as `@types/express` if you are using Typescript. The reason the dependency is not explicitly declared is that it could also eventually be used with `fastify` or other Node.js HTTP servers.

## Configuration

Use the middleware immediately before the first middleware that needs to have access to the context. You won't have access to the context in any middleware "used" before this one.

```js
const express = require('express')
const httpContext = require('express-http-context2')

const app = express()
// Use any third party middleware that does not need to access the context here, e.g.
// app.use(some3rdParty.middleware);
app.use(httpContext.middleware)
// All code from this point on will have access to the per-request context
```

Note that some popular middlewares (such as `body-parser`, `express-jwt`) can cause the context to be lost. To work around such problems, it is recommended that you use any third-party middleware that does NOT require the context BEFORE using this middleware.

## Usage

Examples of setting values:

```js
const httpContext = require('express-http-context2')
const { nanoid } = require('nanoid') // This is just an example, nanoid is not included in this lib

app.use((req, res, next) => {
	// Get the user ID from wherever and save it for later use...
	httpContext.set('userId', userId)
	// Create a request ID to be able to trace/correlate everything that happens within the same request
	httpContext.set('requestId', nanoid())
})
```

Get them from anywhere in your code:

```js
var httpContext = require('express-http-context2')

function logError(error) {
	const userId = httpContext.get('userId')
	const requestId = httpContext.get('requestId')
	console.error(error, { userId, requestId })
}
```

## API

### middleware

It is an Express.js middleware that is responsible for initializing the independent context for each request. The `get` and `set` calls will operate on a set of keys/values unique to those contexts.

#### Example

```js
import { middleware } from 'express-http-context2'

app.use(middleware)
```

### set

Adds a value to the request context by key.
If the key already exists, its value will be overwritten.
No value will persist if the context has not yet been initialized.

#### Parameters

- `key` a string key to store the variable by
- `value` any value to store under the key for the later lookup.

#### Example

```js
import { set } from 'express-http-context2'

set('user', { id: 'overwrittenUser', email: 'foo@bar.com' })
```

### get

Gets a value from the request context by key.
Will return `undefined` if the context has not yet been initialized for this request or if a value is not found for the specified key.

#### Parameters

- `key` a string key to retrieve the stored value for

#### Example

```js
import { get } from 'express-http-context2'

const user = get('user')
```

## License

Express HTTP Context 2 is released under the MIT license:

MIT License

Copyright (c) 2023 Alberto Varela Sánchez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
