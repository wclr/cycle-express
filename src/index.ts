import {StreamAdapter, Subject} from '@cycle/base'
import * as CycleExpress from '../typings/index.d'

import * as cuid from 'cuid'
import * as express from 'express'
import * as methods from 'methods'

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

const requestsStore: RequestsStore = {}

const createRouterStream: CreateRouterStream = (router, streamAdapter) => {
  const driverRouter: any = {}
  const createRouteStream: CreateRouteStream = (method, path) => {
    const {stream, observer} = streamAdapter.makeSubject()

    router[method](path, (req: express.Request, res: express.Response) => {
      const request = <CycleExpress.Request>Object.assign({ id: cuid(), locals: {} }, req)
      requestsStore[request.id] = { req: request, res }
      observer.next(request)
    })

    return stream
  }

  methods.concat('all').forEach((method: string) => {
    driverRouter[method] = (path: CycleExpress.RoutePath) => createRouteStream(method, path)
  })

  driverRouter.route = (path: CycleExpress.RoutePath) => {
    let nestedRouter = express.Router()
    router.use(path, nestedRouter)
    return createRouterStream(nestedRouter, streamAdapter)
  }

  return <CycleExpress.RouterStream>driverRouter
}

export const makeRouterDriver: CycleExpress.MakeRouterDriver = (router) => {
  return (outgoing$, streamAdapter) => {
    streamAdapter.streamSubscribe<CycleExpress.Response>(outgoing$, {
      complete: noop,
      error: noop,
      next: (response) => {
        const {res} = requestsStore[response.id]
        if (!res) { throw new Error(`request with id ${response.id} not found`) }

        let terminateRequestWith: string | undefined
        const methods: string[] = []

        for (let key in response) {
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
}

interface CreateRouteStream {
  (method: string, path: CycleExpress.RoutePath): Subject<CycleExpress.Request>
}

interface CreateRouterStream {
  (router: express.Router, streamAdapter: StreamAdapter): CycleExpress.RouterStream
}

interface RequestsStore {
  [prop: string]: {
    req: CycleExpress.Request,
    res: express.Response
  }
}
