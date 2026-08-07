import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeychangeinprod';

/**
 * Middleware to verify authorization token
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Invalid Token Format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains { id, role, phone }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Access Denied: Invalid or Expired Token' });
  }
};

/**
 * Middleware to restrict access based on user role
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication Required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: Requires '${role}' permissions` });
    }

    next();
  };
};
