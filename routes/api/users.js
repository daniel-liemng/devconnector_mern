const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');

// POST  /api/users
// Register user
// Public
router.post(
  '/',
  [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // 1. See if user exists
    // 2. Get users gravatar
    // 3. Encrypt password
    // 4. Return jsonwebtoken

    try {
      // 1. See if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User alreadyy exists' }] });
      }

      // 2. Get users gravatar
      const avatar = gravatar.url(email, { s: '200', r: 'pg', d: 'mm' });
      user = new User({ name, email, avatar, password });

      // 3. Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // 4. Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      const secretKey = config.get('jwtSecret');

      jwt.sign(payload, secretKey, { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
