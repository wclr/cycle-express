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
  const router = isExpressRouter(routerOptions) ? routerOptions : Router(routerOptions)

  let _requests = {}

  const createDriverRouter = router => {
    const driverRouter = {}
    const createReq$ = (m, path) => {
      const req$ = xs.create({
        id: cuid(),
        start: listener => {
          router[m](path, (req, res, next) => {
            req.id = this.id
            _requests[this.id] = { req, res }
            listener.next(req)
          })
        },
        stop: () => {}
      })

      return req$
    }

    methods.concat('all').forEach(m => {
      driverRouter[m] = (path) => createReq$(m, path)
    })

    driverRouter.method = createReq$

    driverRouter.route = (path, options) => {
      let nestedRouter = Router()
      router.use(path, nestedRouter)
      return createDriverRouter(nestedRouter, options || routerOptions)
    }

    return driverRouter
  }

  const handle = response => {
    var _r = _requests[response.id]
    if (_r) {
      let res = _r.res
      let terminate
      let methods = []
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
      methods.forEach(
        m => res[m](response[m])
      )
      if (terminate) {
        delete _requests[response.id]
      }
    } else {
      throw new Error(`request with id ${response.id} not found`)
    }
  }
  return response$ => {
    response$.forEach(handle)
    return createDriverRouter(router)
  }
}

module.exports = makeRouterDriver
