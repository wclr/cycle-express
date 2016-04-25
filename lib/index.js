'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeRouterDriver = undefined;

var _rx = require('rx');

var _express = require('express');

var _cuid = require('cuid');

var _cuid2 = _interopRequireDefault(_cuid);

var _methods = require('methods');

var _methods2 = _interopRequireDefault(_methods);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var terminateMethods = ['download', 'end', 'json', 'jsonp', 'redirect', 'render', 'send', 'sendFile', 'sendStatus'];

var terminateMethodsMap = terminateMethods.reduce(function (methods, m) {
  methods[m] = true;
  return methods;
}, {});

var isExpressRouter = function isExpressRouter(router) {
  return router && typeof router.use === 'function';
};

var makeRouterDriver = exports.makeRouterDriver = function makeRouterDriver(routerOptions) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var router = isExpressRouter(routerOptions) ? routerOptions : (0, _express.Router)(routerOptions);

  var _requests = {};

  var createDriverRouter = function createDriverRouter(router) {
    var driverRouter = {};
    var createReq$ = function createReq$(m, path) {
      var req$ = _rx.Observable.create(function (observer) {
        router[m](path, function (req, res, next) {
          var id = req.id || (0, _cuid2.default)();
          _requests[id] = {
            req: req,
            res: res
          };
          req.id = id;
          observer.onNext(req);
        });
      }).replay(null, 1);
      req$.connect();
      return req$;
    };
    _methods2.default.concat('all').forEach(function (m) {
      driverRouter[m] = function (path) {
        return createReq$(m, path);
      };
    });
    driverRouter.method = createReq$;
    driverRouter.route = function (path, options) {
      var nestedRouter = (0, _express.Router)();
      router.use(path, nestedRouter);
      return createDriverRouter(nestedRouter, options || routerOptions);
    };
    return driverRouter;
  };

  var handle = function handle(response) {
    var _r = _requests[response.id];
    if (_r) {
      (function () {
        var res = _r.res;
        var terminate = void 0;
        var methods = [];
        for (var key in response) {
          if (typeof res[key] === 'function') {
            if (terminateMethodsMap[key]) {
              terminate = key;
            } else {
              methods.push(key);
            }
          }
        }
        terminate && methods.push(terminate);
        methods.forEach(function (m) {
          return res[m](response[m]);
        });
        if (terminate) {
          delete _requests[response.id];
        }
      })();
    } else {
      throw new Error('request with id ' + response.id + ' not found');
    }
  };
  return function (response$) {
    response$.forEach(handle);
    return createDriverRouter(router);
  };
};