const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'LastName';
    const sortOrder = req.query.sortOrder || 'ASC';
    
    const allowedFields = ['Officer_ID', 'LastName', 'FirstName', 'Rank', 'Position'];
    if (!allowedFields.includes(sortBy)) {
      return res.status(400).json({ error: 'Invalid sort field' });
    }

    const query = `
      SELECT * FROM Officers 
      ORDER BY ${sortBy} ${sortOrder}
    `;
    
    const result = await db.query(query);
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
      'SELECT * FROM Officers WHERE Officer_ID = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { lastName, firstName, patronymic, rank, position } = req.body;
    
    if (!lastName || !firstName) {
      return res.status(400).json({ error: 'Прізвище та ім\'я обов\'язкові' });
    }

    const result = await db.query(
      `INSERT INTO Officers (LastName, FirstName, Patronymic, Rank, Position) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [lastName, firstName, patronymic, rank, position]
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
    const { lastName, firstName, patronymic, rank, position } = req.body;
    
    const result = await db.query(
      `UPDATE Officers 
       SET LastName = $1, FirstName = $2, Patronymic = $3, Rank = $4, Position = $5
       WHERE Officer_ID = $6 RETURNING *`,
      [lastName, firstName, patronymic, rank, position, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
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
      'SELECT COUNT(*) FROM Detentions WHERE Officer_ID = $1',
      [id]
    );
    
    if (parseInt(detentions.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Неможливо видалити офіцера, який має затримання в системі' 
      });
    }

    const result = await db.query(
      'DELETE FROM Officers WHERE Officer_ID = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    
    res.json({ message: 'Officer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;