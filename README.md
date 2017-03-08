# cycle-express-driver [![npm version](https://badge.fury.io/js/cycle-express-driver.svg)](https://badge.fury.io/js/cycle-express-driver)
[Express.js](http://expressjs.com/) driver for [cycle.js](http://cycle.js.org/) forked from [here](https://github.com/whitecolor/cycle-express)

## Stream of requests
```
router.METHOD(path) // -> stream of requests
```

```js
router.get('/').map(({id}) => {
  return {id, send: 'Hello, world'}
})
```

### Nested
```js
const nested = router.route('/api')
nested.post('/users').map((req) => {})
 ```
