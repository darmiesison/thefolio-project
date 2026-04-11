const express = require('express');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Please provide name, email, and message.' });
  }

  try {
    const result = await ContactMessage.create({ name, email, message });
    res.status(201).json(result);
  } catch (err) {
    console.error('Contact submission failed:', err.message);
    res.status(500).json({ message: 'Unable to send message.' });
  }
});

module.exports = router;
