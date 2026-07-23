import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(ApiError.unauthorized('Authentication token is required'));
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

function requireCustomer(req, res, next) {
  if (req.auth?.type !== 'customer') {
    return next(ApiError.forbidden('A customer account is required for this action'));
  }
  next();
}

function requireStaffRole(...roles) {
  return (req, res, next) => {
    if (req.auth?.type !== 'staff' || !roles.includes(req.auth.role)) {
      return next(ApiError.forbidden('Insufficient permissions for this action'));
    }
    next();
  };
}

export { authenticate, requireCustomer, requireStaffRole };
