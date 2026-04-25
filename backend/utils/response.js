// // utils/response.js

// const send = (res, statusCode, data) => {
//     res.writeHead(statusCode, {
//       'Content-Type': 'application/json',
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     });
//     res.end(JSON.stringify(data));
//   };
  
//   module.exports = send;
const send = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://facturenah.vercel.app',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
};

module.exports = send;