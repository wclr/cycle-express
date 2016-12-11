"use strict";
const cuid = require("cuid");
const express = require("express");
const methods = require("methods");
const noop = () => undefined;
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
const requestsStore = {};
const createRouterStream = (router, streamAdapter) => {
    const driverRouter = {};
    const createRouteStream = (method, path) => {
        const { stream, observer } = streamAdapter.makeSubject();
        router[method](path, (req, res) => {
            const request = Object.assign({ id: cuid(), locals: {} }, req);
            requestsStore[request.id] = { req: request, res };
            observer.next(request);
        });
        return stream;
    };
    methods.concat('all').forEach((method) => {
        driverRouter[method] = (path) => createRouteStream(method, path);
    });
    driverRouter.route = (path) => {
        let nestedRouter = express.Router();
        router.use(path, nestedRouter);
        return createRouterStream(nestedRouter, streamAdapter);
    };
    return driverRouter;
};
exports.makeRouterDriver = (router) => {
    return (outgoing$, streamAdapter) => {
        streamAdapter.streamSubscribe(outgoing$, {
            complete: noop,
            error: noop,
            next: (response) => {
                const { res } = requestsStore[response.id];
                if (!res) {
                    throw new Error(`request with id ${response.id} not found`);
                }
                let terminateRequestWith;
                const methods = [];
                for (let key in response) {
                    if (typeof res[key] === 'function') {
                        if (terminateRequestWithMethodsMap[key]) {
                            terminateRequestWith = key;
                        }
                        else {
                            methods.push(key);
                        }
                    }
                }
                if (terminateRequestWith) {
                    methods.push(terminateRequestWith);
                }
                methods.forEach((method) => res[method](response[method]));
                if (terminateRequestWith) {
                    delete requestsStore[response.id];
                }
            }
        });
        return createRouterStream(router, streamAdapter);
    };
};
