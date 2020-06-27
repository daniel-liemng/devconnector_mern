const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
  // 1. Get token from header
  // 2. Check if no token
  // 3. Verify token

  // 1. Get token from header
  const token = req.header('x-auth-token');

  // 2. Check if no token
  if (!token) {
    return res.status(401).json({
      errors: {
        msg: 'No token, authorization denied',
      },
    });
  }

  // 3. Verify token
  const secretKey = config.get('jwtSecret');
  try {
    const decoded = jwt.verify(token, secretKey);

    req.user = decoded.user;

    next();
  } catch (err) {
    console.error(err.message);
    res.status(401).json({
      errors: {
        msg: 'Token is not valid',
      },
    });
  }
};
