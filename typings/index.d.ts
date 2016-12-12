import {Observer, StreamAdapter, Subject} from '@cycle/base'
import {RouterStreamTemplate} from './router-stream.d'
import * as express from 'express'

type GenericStream = any
export type RoutePath = string | RegExp

export declare function makeRouterDriver(router: express.Router): Function;

export interface RouterStream extends RouterStreamTemplate<GenericStream> { }

export interface Request extends express.Request {
  id: string
  locals: any
}

export interface Response {
  id: string
  status?: number
  send: any
}

export interface MakeRouterDriver {
  (router: express.Router):
    (outgoing$: Subject<Response>, SA: StreamAdapter) => RouterStream
}
