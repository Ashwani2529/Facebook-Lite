const { authenticate } = require('./auth/authenticate');

// Backward-compatible alias used by legacy routes. Keeping one implementation
// prevents token leakage and inconsistent authentication behavior.
module.exports = authenticate;
