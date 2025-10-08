const express = require('express');
const { authenticateToken } = require('../server'); // Importer le middleware depuis server.js
const router = express.Router();

// Route pour la page calendrier (redirige vers le client si nécessaire)
router.get('/', authenticateToken, (req, res) => {
  // Rediriger vers le client pour l'interface calendrier
  res.redirect('/index.html');
});

// Exemples de routes métier (à développer)
router.get('/events', authenticateToken, (req, res) => {
  // Récupérer les événements
  res.json({ events: [] });
});

router.post('/events', authenticateToken, (req, res) => {
  // Créer un événement
  res.json({ message: 'Event created' });
});

router.put('/events/:id', authenticateToken, (req, res) => {
  // Modifier un événement
  res.json({ message: 'Event updated' });
});

router.delete('/events/:id', authenticateToken, (req, res) => {
  // Supprimer un événement
  res.json({ message: 'Event deleted' });
});

module.exports = router;