const Router = require('../utils/router');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const send = require('../utils/response');

const router = new Router();

// POST /api/auth/register
router.post('/api/auth/register', async (req, res) => {
  const { prenom, nom, email, mot_de_passe } = req.body;

  if (!prenom || !nom || !email || !mot_de_passe) {
    return send(res, 400, { message: 'Tous les champs sont obligatoires' });
  }

  if (mot_de_passe.length < 8) {
    return send(res, 400, { message: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    console.log('=== REGISTER TENTATIVE DB ===');
    const [existant] = await db.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    console.log('=== REGISTER DB OK ===');

    if (existant.length > 0) {
      return send(res, 409, { message: 'Cet email est déjà utilisé' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    const [result] = await db.query(
      'INSERT INTO users (prenom, nom, email, mot_de_passe) VALUES (?, ?, ?, ?)',
      [prenom, nom, email, hash]
    );

    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    send(res, 201, {
      token,
      user: { id: result.insertId, prenom, nom, email }
    });

  } catch (err) {
    console.log('=== REGISTER ERREUR DB ===', err.message);
    send(res, 500, { message: 'Erreur serveur', error: err.message });
  }
});

// POST /api/auth/login
router.post('/api/auth/login', async (req, res) => {
  console.log('=== LOGIN REÇU ===');
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return send(res, 400, { message: 'Email et mot de passe requis' });
  }

  try {
    console.log('=== LOGIN TENTATIVE DB ===');
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    console.log('=== LOGIN DB OK ===', rows.length, 'utilisateur(s) trouvé(s)');

    if (rows.length === 0) {
      return send(res, 401, { message: 'Email ou mot de passe incorrect' });
    }

    const user = rows[0];
    const valide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!valide) {
      return send(res, 401, { message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    send(res, 200, {
      token,
      user: { id: user.id, prenom: user.prenom, nom: user.nom, email: user.email }
    });

  } catch (err) {
    console.log('=== LOGIN ERREUR DB ===', err.message);
    send(res, 500, { message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;