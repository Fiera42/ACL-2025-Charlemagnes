const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  res.redirect('/index.html');
});

router.get('/events', authenticateToken, (req, res) => {
  res.json({ events: [] });
});

router.post('/events', authenticateToken, (req, res) => {
  res.json({ message: 'Event created' });
});

router.put('/events/:id', authenticateToken, (req, res) => {
  res.json({ message: 'Event updated' });
});

router.delete('/events/:id', authenticateToken, (req, res) => {
  res.json({ message: 'Event deleted' });
});

module.exports = router;
