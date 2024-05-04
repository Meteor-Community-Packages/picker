import { pathToRegexp } from 'path-to-regexp';
// TODO remove fibers
import Fiber from 'fibers';

function parseQuery(queryString) {
  if (!queryString) return {}
  let query = {};
  const pairs = queryString.replace(/^\?/, '').split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

export const PickerImp = function(filterFunction) {
  this.filterFunction = filterFunction;
  this.routes = [];
  this.subRouters = [];
  this.middlewares = [];
}

PickerImp.prototype.middleware = function(callback) {
  this.middlewares.push(callback);
  for(const subRouter of this.subRouters) {
    subRouter.middleware(callback);
  }
};

PickerImp.prototype.route = function(path, callback) {
  const keys = [];
  const regExp = pathToRegexp(path, keys);
  regExp.callback = callback;
  regExp.keys = keys;
  this.routes.push(regExp);
  return this;
};

PickerImp.prototype.filter = function(callback) {
  const subRouter = new PickerImp(callback);
  this.subRouters.push(subRouter);
  for(const middleware of this.middlewares) {
    subRouter.middleware(middleware);
  }
  return subRouter;
};

PickerImp.prototype._dispatch = function(req, res, bypass) {
  let currentRoute = 0;
  let currentSubRouter = 0;
  let currentMiddleware = 0;

  if(this.filterFunction) {
    const result = this.filterFunction(req, res);
    if(!result) {
      return bypass();
    }
  }

  const processNextMiddleware = (onDone) => {
    const middleware = this.middlewares[currentMiddleware++];
    if(middleware) {
      this._processMiddleware(middleware, req, res, () => processNextMiddleware(onDone));
    } else {
      onDone();
    }
  }

  const processNextRoute = () => {
    const route = this.routes[currentRoute++];
    if(route) {
      const uri = req.url.replace(/\?.*/, '');
      const m = uri.match(route);
      if(m) {
        processNextMiddleware(() => {
          const params = this._buildParams(route.keys, m);
          params.query = parseQuery(req._parsedUrl?.query);
          // See https://github.com/meteorhacks/picker/pull/39 for processNextRoute reason in the following method.
          this._processRoute(route.callback, params, req, res, processNextRoute);
        });
      } else {
        processNextRoute();
      }
    } else {
      processNextSubRouter();
    } 
  }

  const processNextSubRouter = () => {
    const subRouter = this.subRouters[currentSubRouter++];
    if(subRouter) {
      subRouter._dispatch(req, res, processNextSubRouter);
    } else {
      bypass();
    }
  }
  processNextRoute();
};

PickerImp.prototype._buildParams = function(keys, m) {
  const params = {};
  for(let lc = 1; lc < m.length; lc++) {
    const key = keys[lc-1]?.name;
    params[key] = decodeURIComponent(m[lc]);
  }

  return params;
};

PickerImp.prototype._processRoute = function(callback, params, req, res, next) {
  if(Fiber.current) {
    doCall();
  } else {
    new Fiber(doCall).run();
  }

  function doCall () {
    callback.call(null, params, req, res, next); 
  }
  // callback.call(null, params, req, res, next); 
};

PickerImp.prototype._processMiddleware = function(middleware, req, res, next) {
  if(Fiber.current) {
    doCall();
  } else {
    new Fiber(doCall).run();
  }

  function doCall() {
    middleware.call(null, req, res, next);
  }
  // middleware.call(null, req, res, next);
};
