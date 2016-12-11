import {Observer, StreamAdapter, Subject} from '@cycle/base'
import * as express from 'express'

export const makeRouterDriver: CycleExpress.MakeRouterDriver

export namespace CycleExpress {
  type Path = string | RegExp

  interface RouterStream {
    route: (path: Path) => RouterStream
    get: (path: Path) => Observer<Response>
    post: (path: Path) => Observer<Response>
    put: (path: Path) => Observer<Response>
    delete: (path: Path) => Observer<Response>
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

  interface MakeRouterDriver {
    (router: express.Router):
      (outgoing$: Subject<CycleExpress.Response>, SA: StreamAdapter) =>
        CycleExpress.RouterStream
  }
}
