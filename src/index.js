import {Observable} from 'rx'
import {Router} from 'express'
import cuid from 'cuid'
import methods from 'methods'

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

var terminateMethodsMap = terminateMethods
  .reduce((methods, m) => {
    methods[m] = true
    return methods
  }, {})

const isExpressRouter = (router) => router && typeof router.use === 'function'

export const makeRouterDriver = (routerOptions, options = {}) => {
  const router = isExpressRouter(routerOptions) 
    ? routerOptions : Router(routerOptions)

  let _requests = {}

  const createDriverRouter = (router) => {
    const driverRouter = {}
    const createReq$ = (m, path) => {
      let req$ = Observable.create(observer => {
        router[m](path, (req, res, next) => {
          var id = req.id || cuid()
          _requests[id] = {
            req: req,
            res: res
          }
          req.id = id
          observer.onNext(req)
        })
      }).replay(null, 1)
      req$.connect()
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

  const handle = (response) => {
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
  return (response$) => {
    response$.forEach(handle)
    return createDriverRouter(router)
  }
}