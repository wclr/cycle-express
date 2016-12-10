import {Observer, StreamAdapter, Subject} from '@cycle/base'
import * as cuid from 'cuid'
import * as express from 'express'
import * as methods from 'methods'
import xs from 'xstream'

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

const createRouterStream = (router: express.Router): RouterStream => {
  const driverRouter: any = {}
  const createRouteStream = (method: string, path: Path) => {
    const req$ = xs.create({
      start: (listener) => {
        router[method](path, (req: express.Request, res: express.Response) => {
          const request = <Request>Object.assign({ id: cuid(), locals: {} }, req)
          requestsStore[request.id] = { req: request, res }
          listener.next(request)
        })
      },
      stop: noop
    })

    return req$
  }

  methods.concat('all').forEach((method: string) => {
    driverRouter[method] = (path: Path) => createRouteStream(method, path)
  })

  driverRouter.route = (path: Path) => {
    let nestedRouter = express.Router()
    router.use(path, nestedRouter)
    return createRouterStream(nestedRouter)
  }

  return <RouterStream>driverRouter
}

export const makeRouterDriver: MakeRouterDriver = (router) => {
  return (outgoing$, streamAdapter) => {
    streamAdapter.streamSubscribe<Response>(outgoing$, {
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

    return createRouterStream(router)
  }
}

type Path = string | RegExp

interface RequestsStore {
  [prop: string]: {
    req: Request,
    res: express.Response
  }
}

interface Request extends express.Request {
  id: string
  locals: any
}

interface Response {
  id: string
  status?: number
  send: any
}

interface RouterStream {
  route: (path: Path) => RouterStream
  get: (path: Path) => Observer<Response>
  post: (path: Path) => Observer<Response>
  put: (path: Path) => Observer<Response>
  delete: (path: Path) => Observer<Response>
}

export interface MakeRouterDriver {
  (router: express.Router): (outgoing$: Subject<Response>, SA: StreamAdapter) => RouterStream
}
