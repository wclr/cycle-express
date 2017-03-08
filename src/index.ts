import { Driver } from '@cycle/run';
import { adapt } from '@cycle/run/lib/adapt';
import * as cuid from 'cuid';
import * as express from 'express';
import * as methods from 'methods';
import xs, { Stream } from 'xstream';

export type RoutePath = string | RegExp;

export interface RouterSourceTemplate<T> {
    route: (path: RoutePath) => RouterSourceTemplate<T>;
    get: (path: RoutePath) => T;
    post: (path: RoutePath) => T;
    put: (path: RoutePath) => T;
    delete: (path: RoutePath) => T;
}

export type RouterSource = RouterSourceTemplate<any>;

export interface Request extends express.Request {
    id: string;
    locals: any;
}

export interface Response {
    id: string;
    status?: number;
    send: any;
}

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
    obj[method] = true;
    return obj;
}, {});

const requestsStore: {
    [prop: string]: {
        req: Request,
        res: express.Response
    }
} = {};

const createRouterSource = (router) => {
    const driverRouter: any = {};

    const createRouteStream = (method, path) => {
        const incoming$ = xs.create<Request>({
            start: (listener) => {
                router[method](path, (req: express.Request, res: express.Response) => {
                    const request = Object.assign({
                        id: cuid()
                    }, req) as Request;

                    request.locals = request.locals || {};
                    requestsStore[request.id] = { req: request, res };

                    listener.next(request);
                });
            },
            stop: () => { /* do nothing */ }
        });

        return adapt(incoming$);
    };

    methods.concat('all').forEach((method: string) => {
        driverRouter[method] = (path: RoutePath) => createRouteStream(method, path);
    });

    driverRouter.route = (path: RoutePath) => {
        const nestedRouter = express.Router();
        router.use(path, nestedRouter);
        return createRouterSource(nestedRouter);
    };

    return driverRouter as RouterSource;
};

export const makeRouterDriver = (router: express.Router) => {
    const driverFunction: Driver<Stream<Response>, RouterSource> = (outgoing$) => {

        outgoing$.addListener({
            next: (response) => {
                if (!requestsStore[response.id]) {
                    console.warn(`request with id ${response.id} not found`);
                    return;
                }

                const { res } = requestsStore[response.id];

                let terminateRequestWith: string | undefined;
                const methods: string[] = [];

                for (const key in response) {
                    if (typeof res[key] === 'function') {
                        if (terminateRequestWithMethodsMap[key]) {
                            terminateRequestWith = key;
                        } else {
                            methods.push(key);
                        }
                    }
                }

                if (terminateRequestWith) { methods.push(terminateRequestWith); }

                methods.forEach((method) => res[method](response[method]));

                if (terminateRequestWith) {
                    delete requestsStore[response.id];
                }

            }
        });

        return createRouterSource(router);
    };

    return driverFunction;
};
