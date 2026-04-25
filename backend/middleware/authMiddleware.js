const jwt = require('jsonwebtoken');
const send = require('../utils/response');
// require('dotenv').config();

const verifyToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    send(res, 401, { message: 'Token manquant, accès refusé' });
    return false;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    return true;
  } catch {
    send(res, 401, { message: 'Token invalide ou expiré' });
    return false;
  }
};

module.exports = verifyToken;