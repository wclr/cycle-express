/// <reference types="express" />
import { Driver } from '@cycle/run';
import * as express from 'express';
import xs from 'xstream';
export declare type RoutePath = string | RegExp;
export interface RouterSourceTemplate<T> {
    route: (path: RoutePath) => RouterSourceTemplate<T>;
    get: (path: RoutePath) => T;
    post: (path: RoutePath) => T;
    put: (path: RoutePath) => T;
    delete: (path: RoutePath) => T;
}
export declare type RouterSource = RouterSourceTemplate<any>;
export interface Request extends express.Request {
    id: string;
    locals: any;
}
export interface Response {
    id: string;
    status?: number;
    send: any;
}
export declare const makeRouterDriver: (router: express.Router) => Driver<xs<Response>, RouterSourceTemplate<any>>;
