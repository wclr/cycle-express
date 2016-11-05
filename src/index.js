const xs = require('xstream').default
const express = require('express')
const cuid = require('cuid')
const methods = require('methods')

const Router = express.Router

var terminateMethods = [
  'download',
  'end',
  'json',
  'jsonp',
  'redirect',
  'render',
  'send',
  'sendFile',
  'sendStatus'
]

var terminateMethodsMap = terminateMethods.reduce((methods, m) => {
  methods[m] = true
  return methods
}, {})

const isExpressRouter = router => router && typeof router.use === 'function'

const makeRouterDriver = (routerOptions, options = {}) => {
  const requestsStore = {}

  const router = isExpressRouter(routerOptions) ? routerOptions : Router(routerOptions)

  const createDriverRouter = router => {
    const driverRouter = {}
    const createReq$ = (method, path) => {
      const req$ = xs.create({
        start: listener => {
          router[method](path, (req, res, next) => {
            const id = cuid()
            req.id = id
            requestsStore[id] = { req, res }
            listener.next(req)
          })
        },
        stop: () => {}
      })

      return req$
    }

    methods.concat('all').forEach(method => {
      driverRouter[method] = (path) => createReq$(method, path)
    })

    driverRouter.method = createReq$

    driverRouter.route = (path, options) => {
      let nestedRouter = Router()
      router.use(path, nestedRouter)
      return createDriverRouter(nestedRouter, options || routerOptions)
    }

    return driverRouter
  }

  return outgoing$ => {
    outgoing$.addListener({
      next: response => {
        const _r = requestsStore[response.id]

        if (!_r) throw new Error(`request with id ${response.id} not found`)

        let terminate
        const res = _r.res
        const methods = []
        for (let key in response) {
          if (typeof res[key] === 'function') {
            if (terminateMethodsMap[key]) {
              terminate = key
            } else {
              methods.push(key)
            }
          }
        }
        terminate && methods.push(terminate)

        methods.forEach(m => res[m](response[m]))

        if (terminate) {
          delete requestsStore[response.id]
        }
      }
    })

    return createDriverRouter(router)
  }
}

module.exports = makeRouterDriver
