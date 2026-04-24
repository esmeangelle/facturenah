const Router = require('../utils/router');
const db = require('../config/db');
const send = require('../utils/response');
const verifyToken = require('../middleware/authMiddleware');

const router = new Router();

function generateId() {
  return 'INV-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

// ── GET toutes les factures (non supprimées)
router.get('/api/factures', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    const [factures] = await db.query(
      'SELECT * FROM factures WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [req.userId]
    );
    const [items] = await db.query(
      `SELECT fi.* FROM facture_items fi
       JOIN factures f ON fi.facture_id = f.id
       WHERE f.user_id = ? AND f.deleted_at IS NULL`,
      [req.userId]
    );
    const result = factures.map(f => ({
      id: f.id,
      companyName: f.company_name,
      companyAddress: f.company_address,
      companyEmail: f.company_email,
      companyPhone: f.company_phone,
      clientName: f.client_name,
      clientAddress: f.client_address,
      clientEmail: f.client_email,
      clientPhone: f.client_phone,
      invoiceNumber: f.invoice_number,
      invoiceDate: f.invoice_date,
      dueDate: f.due_date,
      currency: f.currency,
      tvaRate: parseFloat(f.tva_rate),
      paymentMethod: f.payment_method,
      notes: f.notes,
      discount: parseFloat(f.discount),
      totalHT: parseFloat(f.total_ht),
      tva: parseFloat(f.tva),
      totalTTC: parseFloat(f.total_ttc),
      status: f.status,
      date: f.created_at,
      items: items
        .filter(i => i.facture_id === f.id)
        .map(i => ({
          qty: parseFloat(i.qty),
          description: i.description,
          price: parseFloat(i.price),
          unit: i.unit,
        })),
    }));
    send(res, 200, result);
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur', error: err.message });
  }
});

// ── GET corbeille
router.get('/api/factures/trash', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    const [factures] = await db.query(
      'SELECT * FROM factures WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC',
      [req.userId]
    );
    const [items] = await db.query(
      `SELECT fi.* FROM facture_items fi
       JOIN factures f ON fi.facture_id = f.id
       WHERE f.user_id = ? AND f.deleted_at IS NOT NULL`,
      [req.userId]
    );
    const result = factures.map(f => ({
      id: f.id,
      companyName: f.company_name,
      companyAddress: f.company_address,
      clientName: f.client_name,
      clientAddress: f.client_address,
      totalHT: parseFloat(f.total_ht),
      tva: parseFloat(f.tva),
      totalTTC: parseFloat(f.total_ttc),
      status: f.status,
      date: f.created_at,
      deletedAt: f.deleted_at,
      items: items
        .filter(i => i.facture_id === f.id)
        .map(i => ({
          qty: parseFloat(i.qty),
          description: i.description,
          price: parseFloat(i.price),
          unit: i.unit,
        })),
    }));
    send(res, 200, result);
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur', error: err.message });
  }
});

// ── DELETE vider toute la corbeille  ← NOUVEAU
router.delete('/api/factures/trash', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    // Supprimer les items d'abord
    await db.query(
      `DELETE fi FROM facture_items fi
       JOIN factures f ON fi.facture_id = f.id
       WHERE f.user_id = ? AND f.deleted_at IS NOT NULL`,
      [req.userId]
    );
    await db.query(
      'DELETE FROM factures WHERE user_id = ? AND deleted_at IS NOT NULL',
      [req.userId]
    );
    send(res, 200, { message: 'Corbeille vidée' });
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur', error: err.message });
  }
});

// ── POST créer une facture
router.post('/api/factures', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    const {
      companyName, companyAddress, companyEmail, companyPhone,
      clientName, clientAddress, clientEmail, clientPhone,
      invoiceNumber, invoiceDate, dueDate,
      currency, tvaRate, paymentMethod, notes, discount,
      totalHT, tva, totalTTC, status, items,
    } = req.body;

    const id = generateId();

    await db.query(
      `INSERT INTO factures (
        id, user_id, company_name, company_address, company_email, company_phone,
        client_name, client_address, client_email, client_phone,
        invoice_number, invoice_date, due_date,
        currency, tva_rate, payment_method, notes, discount,
        total_ht, tva, total_ttc, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, req.userId, companyName, companyAddress, companyEmail, companyPhone,
        clientName, clientAddress, clientEmail, clientPhone,
        invoiceNumber, invoiceDate || null, dueDate || null,
        currency, tvaRate, paymentMethod, notes, discount || 0,
        totalHT, tva, totalTTC, status || 'pending',
      ]
    );

    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          'INSERT INTO facture_items (facture_id, description, qty, price, unit) VALUES (?,?,?,?,?)',
          [id, item.description, item.qty, item.price, item.unit || 'piece']
        );
      }
    }

    send(res, 201, { id, message: 'Facture créée' });
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur', error: err.message });
  }
});

// ── PUT modifier une facture
router.put('/api/factures/:id', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    const { id } = req.params;
    const {
      companyName, companyAddress, companyEmail, companyPhone,
      clientName, clientAddress, clientEmail, clientPhone,
      invoiceNumber, invoiceDate, dueDate,
      currency, tvaRate, paymentMethod, notes, discount,
      totalHT, tva, totalTTC, status, items,
    } = req.body;

    await db.query(
      `UPDATE factures SET
        company_name=?, company_address=?, company_email=?, company_phone=?,
        client_name=?, client_address=?, client_email=?, client_phone=?,
        invoice_number=?, invoice_date=?, due_date=?,
        currency=?, tva_rate=?, payment_method=?, notes=?, discount=?,
        total_ht=?, tva=?, total_ttc=?, status=?
       WHERE id=? AND user_id=?`,
      [
        companyName, companyAddress, companyEmail, companyPhone,
        clientName, clientAddress, clientEmail, clientPhone,
        invoiceNumber, invoiceDate || null, dueDate || null,
        currency, tvaRate, paymentMethod, notes, discount || 0,
        totalHT, tva, totalTTC, status,
        id, req.userId,
      ]
    );

    await db.query('DELETE FROM facture_items WHERE facture_id = ?', [id]);
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          'INSERT INTO facture_items (facture_id, description, qty, price, unit) VALUES (?,?,?,?,?)',
          [id, item.description, item.qty, item.price, item.unit || 'piece']
        );
      }
    }

    send(res, 200, { message: 'Facture mise à jour' });
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur', error: err.message });
  }
});

// ── PUT changer le statut
router.put('/api/factures/:id/status', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    const { status } = req.body;
    await db.query(
      'UPDATE factures SET status=? WHERE id=? AND user_id=?',
      [status, req.params.id, req.userId]
    );
    send(res, 200, { message: 'Statut mis à jour' });
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur' });
  }
});

// ── DELETE envoyer à la corbeille (soft delete)
router.delete('/api/factures/:id', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    await db.query(
      'UPDATE factures SET deleted_at=NOW() WHERE id=? AND user_id=?',
      [req.params.id, req.userId]
    );
    send(res, 200, { message: 'Facture déplacée dans la corbeille' });
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur' });
  }
});

// ── POST restaurer de la corbeille
router.post('/api/factures/:id/restore', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    await db.query(
      'UPDATE factures SET deleted_at=NULL WHERE id=? AND user_id=?',
      [req.params.id, req.userId]
    );
    send(res, 200, { message: 'Facture restaurée' });
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur' });
  }
});

// ── DELETE supprimer définitivement
router.delete('/api/factures/:id/permanent', async (req, res) => {
  if (!verifyToken(req, res)) return;
  try {
    await db.query('DELETE FROM facture_items WHERE facture_id=?', [req.params.id]);
    await db.query('DELETE FROM factures WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    send(res, 200, { message: 'Facture supprimée définitivement' });
  } catch (err) {
    send(res, 500, { message: 'Erreur serveur' });
  }
});

module.exports = router;