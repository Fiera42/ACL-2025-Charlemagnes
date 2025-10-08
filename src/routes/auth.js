const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/index.html');
});

router.post('/login', (req, res) => {
  // Logique de connexion
  // Vérifier les credentials, générer JWT, etc.
  res.json({ message: 'Login endpoint' });
});

router.post('/register', (req, res) => {
  // Logique d'inscription
  res.json({ message: 'Register endpoint' });
});

router.get('/logout', (req, res) => {
  // Logique de déconnexion
  res.json({ message: 'Logout endpoint' });
});

module.exports = router;