const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Offenders ORDER BY LastName');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { lastName } = req.query;
    
    if (!lastName) {
      return res.status(400).json({ error: 'lastName parameter is required' });
    }

    const result = await db.query(`
      SELECT * FROM Offenders 
      WHERE LOWER(LastName) LIKE LOWER('%${lastName}%')
      ORDER BY LastName
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM Offenders WHERE Offender_ID = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offender not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { lastName, firstName, patronymic, address, workplace } = req.body;
    
    if (!lastName || !firstName) {
      return res.status(400).json({ error: 'Прізвище та ім\'я обов\'язкові' });
    }

    const result = await db.query(
      `INSERT INTO Offenders (LastName, FirstName, Patronymic, Address, Workplace) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [lastName, firstName, patronymic, address, workplace]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lastName, firstName, patronymic, address, workplace } = req.body;
    
    const result = await db.query(
      `UPDATE Offenders 
       SET LastName = $1, FirstName = $2, Patronymic = $3, Address = $4, Workplace = $5
       WHERE Offender_ID = $6 RETURNING *`,
      [lastName, firstName, patronymic, address, workplace, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offender not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const detentions = await db.query(
      'SELECT COUNT(*) FROM Detentions WHERE Offender_ID = $1',
      [id]
    );
    
    if (parseInt(detentions.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Неможливо видалити порушника, який має затримання в системі' 
      });
    }

    const result = await db.query(
      'DELETE FROM Offenders WHERE Offender_ID = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offender not found' });
    }
    
    res.json({ message: 'Offender deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;