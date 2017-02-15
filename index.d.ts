/// <reference types="express" />
import { DriverFunction } from '@cycle/base';
import * as express from 'express';
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
export declare const makeRouterDriver: (router: express.Router) => DriverFunction;
