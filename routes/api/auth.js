const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// GET  /api/auth
// Get auth user
// Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST  /api/auth
// Authenticate user & get token - LOGIN
// Public
router.post(
  '/',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    // handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // 1. Find user by email
    // 2. Check password with hashPassword by bcrypt
    // 3. Get JWT

    try {
      // 1. Find user by email
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credential' }] });
      }

      // 2. Check password with hashPassword by bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credential' }] });
      }

      // 3. Get JWT
      const payload = {
        user: {
          id: user.id,
        },
      };
      const secretKey = config.get('jwtSecret');

      jwt.sign(payload, secretKey, { expiresIn: 3600000 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
