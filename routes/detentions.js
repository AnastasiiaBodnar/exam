const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        d.*,
        o.LastName || ' ' || o.FirstName AS OfficerName,
        off.LastName || ' ' || off.FirstName AS OffenderName
      FROM Detentions d
      JOIN Officers o ON d.Officer_ID = o.Officer_ID
      JOIN Offenders off ON d.Offender_ID = off.Offender_ID
      ORDER BY d.DetentionDate DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/filter', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const result = await db.query(`
      SELECT 
        d.*,
        o.LastName || ' ' || o.FirstName AS OfficerName,
        off.LastName || ' ' || off.FirstName AS OffenderName
      FROM Detentions d
      JOIN Officers o ON d.Officer_ID = o.Officer_ID
      JOIN Offenders off ON d.Offender_ID = off.Offender_ID
      WHERE d.DetentionDate BETWEEN $1 AND $2
      ORDER BY d.DetentionDate DESC
    `, [startDate, endDate]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT 
        d.*,
        o.LastName || ' ' || o.FirstName AS OfficerName,
        off.LastName || ' ' || off.FirstName AS OffenderName
      FROM Detentions d
      JOIN Officers o ON d.Officer_ID = o.Officer_ID
      JOIN Offenders off ON d.Offender_ID = off.Offender_ID
      WHERE d.Detention_ID = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Detention not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { officerId, offenderId, detentionDate, protocolNumber, passportNumber, violationType } = req.body;
    
    if (!officerId || !offenderId || !detentionDate || !protocolNumber || !violationType) {
      return res.status(400).json({ 
        error: 'Обов\'язкові поля: officerId, offenderId, detentionDate, protocolNumber, violationType' 
      });
    }

    const existingProtocol = await db.query(
      'SELECT Detention_ID FROM Detentions WHERE ProtocolNumber = $1',
      [protocolNumber]
    );
    
    if (existingProtocol.rows.length > 0) {
      return res.status(400).json({ error: 'Протокол з таким номером вже існує' });
    }

    const result = await db.query(
      `INSERT INTO Detentions (Officer_ID, Offender_ID, DetentionDate, ProtocolNumber, PassportNumber, ViolationType) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [officerId, offenderId, detentionDate, protocolNumber, passportNumber, violationType]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    
    if (err.message && err.message.includes('майбутньому')) {
      return res.status(400).json({ error: 'Дата затримання не може бути в майбутньому' });
    }
    
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('CALL DeleteDetention($1)', [id]);
    
    res.json({ message: `Detention ${id} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;