# Cycle-Express 
[Express.js](http://expressjs.com/) driver for [cycle.js](http://cycle.js.org/)

This is a **experimental driver** that allows you to have express router requests as stream, 
and use it in cycle.js apps.


## API

**streams of requests**

API of router object is very similar to `express.Router`

```
router.METHOD(path) // -> stream of requests
```

```js
router.get('/api/users')
  .filter(req => req.user)
  ...
```

**nested streams of requests**

Method `route` internally will create new `express.Router` 
and `use` (attach) it on current `Router` instance that will supply you with kind of *isolated* stream of request 
from the `path`.
 
 ```
 let nestedRouter = router.route(path) // --> nested router attached on `path`
 nestedRouter.METHOD(path) // -> stream of requests
 ```

You can use this to pass such nested router to function: 
 
```js
RouteUser({router: router.route('/api/user'), db, log})
```

**streams of responses**

Each incoming request from stream has unique `id`, you should put this 
`id` into to sink stream, so driver could make find a corresponding response (usually referred as `res`) 
object. So, such object passed to router sink steam:

```js
{
  id: '123',
  status: 202,
  send: {a: 1, b: 2}
}
```

will set response `status` to `202` and send (calling `send` method on express's `res` object) `{a: 1, b: 2}` 



## Example

```js
import {run} from '@cycle/core'
import {Observable as O} from 'rx'
import {makeRouterDriver} from 'cycle-express'
import {Router} from 'express'

const router = Router()

const Main = ({router, cb}) => {
  return {
    router: db.map(result => ({
      id: result.query.id, // send back to router object that contains original request id 
      send: result.data
    ))
    db: router.map((req) => ({
      req: req.id, // mark db query with original request id 
      id: req.params.id // this is just "db query API" for the sake of simplicity
    }))
  }
}

run(Main, {
  router: makeRouterDriver(router),
  db: simpleFlatDbDriver
})

```