import { Picker } from 'meteor/communitypackages:picker';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { should, assert } from 'chai';

should();
function getPath (path) {
  return Meteor.absoluteUrl(path);
}



describe('picker - basic routes', function () {
  it('should handle a simple route', async function () {
    const id = Random.id();
    Picker.route(`/${id}`, function (params, req, res) {
      res.end("done");
    });

    const res = await fetch(getPath(id));
    const content = await res.text();
    content.should.equal('done');
  });

  it('should handle a simple route with params', async function () {
    const id = Random.id();
    const path = "/post/:id";
    Picker.route(path, function (params, req, res) {
      res.end(params.id);
    });

    const res = await fetch(getPath(`post/${id}`));
    const content = await res.text();
    content.should.equal(id);
  });

  it('should handle a route that filters all but POST requests', async function () {
    const id = Random.id();
    const postRoutes = Picker.filter(function (req, res) {
      return req.method === "POST";
    });

    postRoutes.route(`/${id}`, function (params, req, res) {
      res.end("done");
    });


    const res1 = await fetch(getPath(`/${id}`));
    const content1 = await res1.text();
    content1.should.not.equal("done");

    const res2 = await fetch(getPath(`/${id}`), { method: "POST"});
    const content2 = await res2.text();
    content2.should.equal("done");
  });

  it('should handle a route with query strings', async function () {
    const id = Random.id();
    Picker.route(`/${id}`, function (params, req, res) {
      res.end("" + params.query.aa);
    });

    const res = await fetch(getPath(`/${id}?aa=10&bb=10`));
    const content = await res.text();
    content.should.equal("10");
  });
});

describe('picker - middleware', function () {
  it('should handle a basic middleware', async function () {
    const id = Random.id();

    Picker.middleware(function (req, res, next) {
      setTimeout(function () {
        req.middlewarePass = "ok";
        next();
      }, 100);
    });

    Picker.route(`/${id}`, function (params, req, res) {
      res.end(req.middlewarePass);
    });

    const res = await fetch(getPath(`/${id}?aa=10`));
    const content = await res.text();
    content.should.equal("ok");
  });

  it('should handle a middleware with params', async function () {
      const path = `${Random.id()}/coola`;

      const routes = Picker.filter(function (req, res) {
        const matched = /coola/.test(req.url);
        return matched;
      });

      routes.middleware(function (req, res, next) {
        setTimeout(function () {
          req.middlewarePass = "ok";
          next();
        }, 100);
      });

      routes.route(`/${path}`, function (params, req, res) {
        res.end(req.middlewarePass);
      });

      const res = await fetch(getPath(path));
      const content = await res.text();
      content.should.equal("ok");
  });

  it('should handle middleware with filtered routes', async function () {
    const path = `${Random.id()}/coola`;

    const routes = Picker.filter(function (req, res) {
      const matched = /coola/.test(req.url);
      return matched;
    });

    routes.middleware(function (req, res, next) {
      setTimeout(function () {
        req.middlewarePass = "ok";
        next();
      }, 100);
    });

    routes.route(`/${path}`, function (params, req, res) {
      res.end(req.middlewarePass);
    });

    const res = await fetch(getPath(path));
    const content = await res.text();
    content.should.equal("ok");
  });

  it('should handle middleware with several filtered routes', async function () {
    const path1 = `${Random.id()}/coola`;
    const path2 = `${Random.id()}/coola`;

    const routes1 = Picker.filter();
    const routes2 = Picker.filter();

    const increaseResultBy = (i) => (req, res, next) => {
      setTimeout(function () {
        req.result = req.result || 0;
        req.result += i;
        next();
      }, 100);
    };

    routes1.middleware(increaseResultBy(1));
    routes2.middleware(increaseResultBy(2));

    Picker.middleware(increaseResultBy(10));

    routes1.route(`/${path1}`, function (params, req, res) {
      res.end(req.result + '');
    });
    routes2.route(`/${path2}`, function (params, req, res) {
      res.end(req.result + '');
    });

    const res1 = await fetch(getPath(path1));
    const content1 = await res1.text();
    content1.should.equal("11");

    const res2 = await fetch(getPath(path2));
    const content2 = await res2.text();
    content2.should.equal("12");
  });
});

