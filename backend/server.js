const http = require('http');
require('dotenv').config();

const authRouter     = require('./routes/auth');
const facturesRouter = require('./routes/factures');
const send           = require('./utils/response');

const server = http.createServer(async (req, res) => {

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  if (req.url.startsWith('/api/auth'))     return authRouter.handle(req, res);
  if (req.url.startsWith('/api/factures')) return facturesRouter.handle(req, res);

  send(res, 404, { message: 'Route inconnue' });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${process.env.PORT || 5000}`);
});