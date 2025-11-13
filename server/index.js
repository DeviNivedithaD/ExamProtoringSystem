const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const warningRoutes = require('./routes/warnings');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/warnings', warningRoutes);

app.listen(4000, () => console.log('Server running on port 4000'));
