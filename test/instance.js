import { Picker } from 'meteor/communitypackages:picker'
import { fetch } from 'meteor/fetch'
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'

function getPath(path) {
  return Meteor.absoluteUrl(path);
}

async function getAsync (url, options) {
  try {
    const response = await fetch(url, options)
    return await response.text()
  } catch (e) {
    throw new Meteor.Error(500, e.message)
  }
}

const get = Meteor.wrapAsync(getAsync)

Tinytest.add('normal route', function(test) {
  const id = Random.id();
  Picker.route(`/${id}`, function(params, req, res) {
    res.end("done");
  });

  get(getPath(id), { method: 'GET' }, (error, success) => {
    test.equal(success, 'done');
  });

});

Tinytest.add('with params', function(test) {
  const id = Random.id();
  const path = "/post/:id";
  Picker.route(path, function(params, req, res) {
    res.end(params.id);
  });

  get(getPath(`post/${id}`), { method: 'GET' }, (error, res) => {
    test.equal(res, id);
  });
});

Tinytest.add('filter only POST', function(test) {
  const id = Random.id();
  const postRoutes = Picker.filter(function(req, res) {
    return req.method === "POST";
  });

  postRoutes.route(`/${id}`, function(params, req, res) {
    res.end("done");
  });

  get(getPath(`/${id}`), { method: 'GET' }, (error, res) => {
    test.isFalse(res === "done");
  });


  get(getPath(`/${id}`), { method: 'POST' }, (error, res) => {
    test.isTrue(res === "done");
  });

});

Tinytest.add('query strings', function(test) {
  const id = Random.id();
  Picker.route(`/${id}`, function(params, req, res) {
    res.end("" + params.query.aa);
  });

  get(getPath(`/${id}?aa=10&bb=10`), { method: 'GET' }, (error, res) => {
    test.equal(res, "10");
  });

});

Tinytest.add('middlewares', function(test) {
  const id = Random.id();

  Picker.middleware(function(req, res, next) {
    setTimeout(function() {
      req.middlewarePass = "ok";
      next();
    }, 100);
  });

  Picker.route(`/${id}`, function(params, req, res) {
    res.end(req.middlewarePass);
  });

  get(getPath(`/${id}?aa=10`), { method: 'GET' }, (error, res) => {
    test.equal(res, "ok");
  });

});

Tinytest.add('middlewares - with filtered routes', function(test) {
  const path = `${Random.id()}/coola`;

  const routes = Picker.filter(function(req, res) {
    const matched = /coola/.test(req.url);
    return matched;
  });

  routes.middleware(function(req, res, next) {
    setTimeout(function() {
      req.middlewarePass = "ok";
      next();
    }, 100);
  });

  routes.route(`/${path}`, function(params, req, res) {
    res.end(req.middlewarePass);
  });

  get(getPath(path), { method: 'GET' }, (error, res) => {
    test.equal(res, "ok");
  });

});


Tinytest.add('middlewares - with several filtered routes', function(test) {
  const path1 = `${Random.id()}/coola`;
  const path2 = `${Random.id()}/coola`;

  const routes1 = Picker.filter();
  const routes2 = Picker.filter();

  const increaseResultBy = (i) => (req, res, next) => {
    setTimeout(function() {
      req.result = req.result || 0;
      req.result += i;
      next();
    }, 100);
  };

  routes1.middleware(increaseResultBy(1));
  routes2.middleware(increaseResultBy(2));

  Picker.middleware(increaseResultBy(10));

  routes1.route(`/${path1}`, function(params, req, res) {
    res.end(req.result+'');
  });
  routes2.route(`/${path2}`, function(params, req, res) {
    res.end(req.result+'');
  });

  get(getPath(path1), { method: 'GET' }, (error, res) => {
    test.equal(res, "11");
  });


  get(getPath(path2), { method: 'GET' }, (error, res) => {
    test.equal(res, "12");
  });

});
