// utils/router.js
const url = require('url');

class Router {
  constructor() {
    this.routes = [];
  }

  add(method, path, handler) {
    this.routes.push({ method, path, handler });
  }

  get(path, handler)    { this.add('GET', path, handler); }
  post(path, handler)   { this.add('POST', path, handler); }
  put(path, handler)    { this.add('PUT', path, handler); }
  delete(path, handler) { this.add('DELETE', path, handler); }

  async handle(req, res) {
    const parsed = url.parse(req.url, true);
    req.query = parsed.query;
    req.pathname = parsed.pathname;

    req.body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({}); }
      });
    });

    const route = this.routes.find(r =>
      r.method === req.method && this.matchPath(r.path, req.pathname, req)
    );

    if (route) {
      await route.handler(req, res);
    } else {
      const send = require('./response');
      send(res, 404, { message: 'Route non trouvée' });
    }
  }

  matchPath(routePath, reqPath, req) {
    const routeParts = routePath.split('/');
    const reqParts = reqPath.split('/');
    if (routeParts.length !== reqParts.length) return false;

    req.params = {};
    return routeParts.every((part, i) => {
      if (part.startsWith(':')) {
        req.params[part.slice(1)] = reqParts[i];
        return true;
      }
      return part === reqParts[i];
    });
  }
}

module.exports = Router;