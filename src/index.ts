import { DriverFunction } from '@cycle/base'
import * as cuid from 'cuid'
import * as express from 'express'
import * as methods from 'methods'

export type RoutePath = string | RegExp

export interface RouterSourceTemplate<T> {
  route: (path: RoutePath) => RouterSourceTemplate<T>
  get: (path: RoutePath) => T
  post: (path: RoutePath) => T
  put: (path: RoutePath) => T
  delete: (path: RoutePath) => T
}

export type RouterSource = RouterSourceTemplate<any>

export interface Request extends express.Request {
  id: string
  locals: any
}

export interface Response {
  id: string
  status?: number
  send: any
}

const noop = () => undefined

const terminateRequestWithMethodsMap = [
  'download',
  'end',
  'json',
  'jsonp',
  'redirect',
  'render',
  'send',
  'sendFile',
  'sendStatus'
].reduce((obj, method) => {
  obj[method] = true
  return obj
}, {})

const requestsStore: {
  [prop: string]: {
    req: Request,
    res: express.Response
  }
} = {}

const createRouterStream = (router, streamAdapter) => {
  const driverRouter: any = {}
  const createRouteStream = (method, path) => {
    const { stream, observer } = streamAdapter.makeSubject()

    router[method](path, (req: express.Request, res: express.Response) => {
      const request = Object.assign({
        id: cuid()
      }, req) as Request

      request.locals = request.locals || {}
      requestsStore[request.id] = { req: request, res }

      observer.next(request)
    })

    return stream
  }

  methods.concat('all').forEach((method: string) => {
    driverRouter[method] = (path: RoutePath) => createRouteStream(method, path)
  })

  driverRouter.route = (path: RoutePath) => {
    const nestedRouter = express.Router()
    router.use(path, nestedRouter)
    return createRouterStream(nestedRouter, streamAdapter)
  }

  return driverRouter as RouterSource
}

export const makeRouterDriver = (router: express.Router) => {
  const driverFunction: DriverFunction = (outgoing$, streamAdapter) => {
    streamAdapter.streamSubscribe<Response>(outgoing$, {
      complete: noop,
      error: noop,
      next: (response) => {
        const { res } = requestsStore[response.id]

        if (!res) {
          throw new Error(`request with id ${response.id} not found`)
        }

        let terminateRequestWith: string | undefined
        const methods: string[] = []

        for (const key in response) {
          if (typeof res[key] === 'function') {
            if (terminateRequestWithMethodsMap[key]) {
              terminateRequestWith = key
            } else {
              methods.push(key)
            }
          }
        }

        if (terminateRequestWith) { methods.push(terminateRequestWith) }

        methods.forEach((method) => res[method](response[method]))

        if (terminateRequestWith) {
          delete requestsStore[response.id]
        }
      }
    })

    return createRouterStream(router, streamAdapter)
  }

  return driverFunction
}
