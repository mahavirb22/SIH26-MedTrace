import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Store from '../models/Store.js';
import env from '../config/env.js';

function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { userId: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
}

/**
 * POST /api/auth/register
 * Dynamic registration for Patient, Pharmacist, Admin, Manufacturer.
 */
export async function register(req, res, next) {
  try {
    const { email, password, name, role, phone, storeId, manufacturerId } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const validRoles = ['patient', 'pharmacist', 'manufacturer', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'patient';

    // For pharmacist, associate or dynamically create store
    let storeRef = null;
    if (userRole === 'pharmacist') {
      const licenseCode = (storeId || `PHARM-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
      let store = await Store.findOne({ licenseId: licenseCode });
      if (!store) {
        // Dynamically create store if license ID doesn't exist yet
        store = await Store.create({
          licenseId: licenseCode,
          name: `${name.trim()}'s Pharmacy`,
          region: 'Central Region',
          address: 'Registered Dispensary Location',
          isActive: true,
          complianceScore: 100.0,
        });
      }
      storeRef = store._id;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
      role: userRole,
      phone: phone || '',
      storeId: storeRef,
      manufacturerId: manufacturerId || null,
    });

    const tokens = generateTokens(user);

    res.status(201).json({
      message: 'Registration successful.',
      user: user.toJSON(),
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Dynamic login checking email + hashed password in database.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
    }

    const tokens = generateTokens(user);

    res.json({
      message: 'Login successful.',
      user: user.toJSON(),
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 */
export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const tokens = generateTokens(user);
    res.json({ ...tokens });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please re-login.' });
    }
    return res.status(401).json({ error: 'Invalid refresh token.' });
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.userId).populate('storeId');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}
