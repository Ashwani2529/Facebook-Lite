const crypto = require('crypto');

class JsonWebTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JsonWebTokenError';
  }
}

class TokenExpiredError extends Error {
  constructor(message, expiredAt) {
    super(message);
    this.name = 'TokenExpiredError';
    this.expiredAt = expiredAt;
  }
}

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');

const decode = value => {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    throw new JsonWebTokenError('Invalid token payload');
  }
};

const parseDuration = value => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = /^(\d+)(s|m|h|d|w)?$/i.exec(String(value || ''));
  if (!match) throw new JsonWebTokenError('Invalid token expiration');
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  return Number(match[1]) * multipliers[(match[2] || 's').toLowerCase()];
};

const signatureFor = (unsignedToken, secret) => (
  crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url')
);

const sign = (payload, secret, options = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new JsonWebTokenError('Payload must be an object');
  }
  if (!secret) throw new JsonWebTokenError('A signing secret is required');

  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: payload.iat || now };
  if (options.expiresIn !== undefined) {
    claims.exp = now + parseDuration(options.expiresIn);
  }

  const unsignedToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}`;
  return `${unsignedToken}.${signatureFor(unsignedToken, secret)}`;
};

const verify = (token, secret) => {
  if (typeof token !== 'string' || !secret) {
    throw new JsonWebTokenError('Token and secret are required');
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => !part)) {
    throw new JsonWebTokenError('JWT malformed');
  }

  const [encodedHeader, encodedPayload, suppliedSignature] = parts;
  const header = decode(encodedHeader);
  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new JsonWebTokenError('Unsupported token algorithm');
  }

  const expectedSignature = signatureFor(`${encodedHeader}.${encodedPayload}`, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  if (
    expectedBuffer.length !== suppliedBuffer.length
    || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    throw new JsonWebTokenError('Invalid signature');
  }

  const payload = decode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp !== undefined && (!Number.isFinite(payload.exp) || now >= payload.exp)) {
    throw new TokenExpiredError('JWT expired', new Date(payload.exp * 1000));
  }
  if (payload.nbf !== undefined && (!Number.isFinite(payload.nbf) || now < payload.nbf)) {
    throw new JsonWebTokenError('JWT not active');
  }

  return payload;
};

module.exports = {
  sign,
  verify,
  JsonWebTokenError,
  TokenExpiredError
};
