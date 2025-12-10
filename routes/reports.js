const express = require('express');
const router = express.Router();
const db = require('../db');

// ЗВІТ: Затримання по офіцеру з підрахунком кількості
router.get('/officer-detentions/:officerId', async (req, res) => {
  try {
    const { officerId } = req.params;
    
    // Перевірка чи існує офіцер
    const officer = await db.query(
      'SELECT * FROM Officers WHERE Officer_ID = $1',
      [officerId]
    );
    
    if (officer.rows.length === 0) {
      return res.status(404).json({ error: 'Офіцера не знайдено' });
    }

    // Отримуємо затримання
    const detentions = await db.query(`
      SELECT 
        d.*,
        off.LastName || ' ' || off.FirstName AS OffenderName,
        COUNT(*) OVER() as TotalDetentions
      FROM Detentions d
      JOIN Offenders off ON d.Offender_ID = off.Offender_ID
      WHERE d.Officer_ID = $1
      ORDER BY d.DetentionDate DESC
    `, [officerId]);
    
    res.json({
      officer: officer.rows[0],
      detentions: detentions.rows,
      totalCount: detentions.rows.length > 0 ? parseInt(detentions.rows[0].totaldetentions) : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ЗАПИТ: Кількість правопорушень за прізвищем порушника
router.get('/offender-violations', async (req, res) => {
  try {
    const { lastName } = req.query;
    
    if (!lastName) {
      return res.status(400).json({ error: 'Параметр lastName обов\'язковий' });
    }

    const result = await db.query(`
      SELECT 
        off.Offender_ID,
        off.LastName,
        off.FirstName,
        off.Patronymic,
        off.Address,
        off.Workplace,
        COUNT(d.Detention_ID) as ViolationCount
      FROM Offenders off
      LEFT JOIN Detentions d ON off.Offender_ID = d.Offender_ID
      WHERE LOWER(off.LastName) = LOWER($1)
      GROUP BY off.Offender_ID, off.LastName, off.FirstName, off.Patronymic, off.Address, off.Workplace
    `, [lastName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Порушника з таким прізвищем не знайдено' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Статистика по типах порушень
router.get('/violation-types', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        ViolationType,
        COUNT(*) as Count
      FROM Detentions
      GROUP BY ViolationType
      ORDER BY Count DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Статистика затримань по місяцях
router.get('/detentions-by-month', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    
    const result = await db.query(`
      SELECT 
        EXTRACT(MONTH FROM DetentionDate) as Month,
        TO_CHAR(DetentionDate, 'Month') as MonthName,
        COUNT(*) as Count
      FROM Detentions
      WHERE EXTRACT(YEAR FROM DetentionDate) = $1
      GROUP BY EXTRACT(MONTH FROM DetentionDate), TO_CHAR(DetentionDate, 'Month')
      ORDER BY Month
    `, [year]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Топ найактивніших офіцерів
router.get('/top-officers', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    
    const result = await db.query(`
      SELECT 
        o.Officer_ID,
        o.LastName || ' ' || o.FirstName as OfficerName,
        o.Rank,
        o.Position,
        COUNT(d.Detention_ID) as DetentionCount
      FROM Officers o
      LEFT JOIN Detentions d ON o.Officer_ID = d.Officer_ID
      GROUP BY o.Officer_ID, o.LastName, o.FirstName, o.Rank, o.Position
      ORDER BY DetentionCount DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Топ порушників
router.get('/top-offenders', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    
    const result = await db.query(`
      SELECT 
        off.Offender_ID,
        off.LastName || ' ' || off.FirstName as OffenderName,
        off.Address,
        off.Workplace,
        COUNT(d.Detention_ID) as ViolationCount
      FROM Offenders off
      LEFT JOIN Detentions d ON off.Offender_ID = d.Offender_ID
      GROUP BY off.Offender_ID, off.LastName, off.FirstName, off.Address, off.Workplace
      HAVING COUNT(d.Detention_ID) > 0
      ORDER BY ViolationCount DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;