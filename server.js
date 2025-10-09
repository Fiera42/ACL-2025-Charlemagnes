const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mysqlAdmin = require('node-mysql-admin');
const { authenticateToken } = require('./src/middleware/auth');


const authRoutes = require('./src/routes/auth');
const calendarRoutes = require('./src/routes/calendar');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.use('/auth', authRoutes);
app.use('/calendar', calendarRoutes);

// Sécurisé avec JWT
app.use('/mysql-admin', mysqlAdmin(app));


// Route 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});