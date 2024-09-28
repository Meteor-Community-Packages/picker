import { pathToRegexp } from 'path-to-regexp';

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

PickerImp.prototype._dispatch = async function(req, res, bypass) {
  let currentRoute = 0;
  let currentSubRouter = 0;
  let currentMiddleware = 0;

  if(this.filterFunction) {
    const result = this.filterFunction(req, res);
    if(!result) {
      return await bypass();
    }
  }

  const processNextMiddleware = async (onDone) => {
    const middleware = this.middlewares[currentMiddleware++];
    if(middleware) {
      await this._processMiddleware(middleware, req, res, async () => await processNextMiddleware(onDone));
    } else {
      await onDone();
    }
  }

  const processNextRoute = async () => {
    const route = this.routes[currentRoute++];
    if(route) {
      const uri = req.url.replace(/\?.*/, '');
      const m = uri.match(route);
      if(m) {
        await processNextMiddleware(async () => {
          const params = this._buildParams(route.keys, m);
          params.query = parseQuery(req._parsedUrl?.query);
          // See https://github.com/meteorhacks/picker/pull/39 for processNextRoute reason in the following method.
          await this._processRoute(route.callback, params, req, res, processNextRoute);
        });
      } else {
        await processNextRoute();
      }
    } else {
      await processNextSubRouter();
    } 
  }

  const processNextSubRouter = async () => {
    const subRouter = this.subRouters[currentSubRouter++];
    if(subRouter) {
      await subRouter._dispatch(req, res, processNextSubRouter);
    } else {
      await bypass();
    }
  }
  await processNextRoute();
};

PickerImp.prototype._buildParams = function(keys, m) {
  const params = {};
  for(let lc = 1; lc < m.length; lc++) {
    const key = keys[lc-1]?.name;
    params[key] = decodeURIComponent(m[lc]);
  }

  return params;
};

PickerImp.prototype._processRoute = async function(callback, params, req, res, next) {
  await callback.call(null, params, req, res, next); 
};

PickerImp.prototype._processMiddleware = async function(middleware, req, res, next) {
  await middleware.call(null, req, res, next);
};
