# cycle-express-driver
[Express.js](http://expressjs.com/) driver for [cycle.js](http://cycle.js.org/) forked from [here](https://github.com/whitecolor/cycle-express)

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

 ```js
let nestedRouter = router.route(path) // --> nested router attached on `path`
nestedRouter.METHOD(path) // -> stream of requests
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
Check out this repo: [Alex0007/cycle-express-hello-world](https://github.com/Alex0007/cycle-express-hello-world)
