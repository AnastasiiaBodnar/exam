const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/officers', require('./routes/officers'));
app.use('/api/offenders', require('./routes/offenders'));
app.use('/api/detentions', require('./routes/detentions'));
app.use('/api/reports', require('./routes/reports'));

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});