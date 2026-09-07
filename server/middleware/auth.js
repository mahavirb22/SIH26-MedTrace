import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

/**
 * JWT authentication middleware.
 * Attaches req.user (full user document minus passwordHash) on success.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please provide a Bearer token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please refresh or re-login.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * Optional authentication — attaches user info if token is present, but doesn't block.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.userId = null;
    req.userRole = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  } catch {
    req.userId = null;
    req.userRole = null;
  }
  next();
}

/**
 * Role-based access control middleware factory.
 * Usage: authorize('pharmacist', 'admin')
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.userRole}.`,
      });
    }
    next();
  };
}

/**
 * Attach full user document to req.user (call after authenticate).
 */
export async function attachUser(req, res, next) {
  if (!req.userId) return next();
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    delete user.passwordHash;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
