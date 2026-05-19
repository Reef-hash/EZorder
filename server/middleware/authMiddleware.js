import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Staff from '../models/staffModel.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // AUTH BYPASS MODE — no token provided, use first user in DB (pre-licensing phase)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const user = await User.findOne({}).select('-password');
      if (user) {
        req.user = user;
        req.isStaff = false;
        return next();
      }
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Staff token — userId is ownerId, staffId is the Staff document id
    if (decoded.type === 'staff') {
      const staff = await Staff.findById(decoded.staffId);
      if (!staff || !staff.active) {
        return res.status(401).json({ message: 'Staff account inactive or not found' });
      }

      const owner = await User.findById(decoded.userId).select('-password');
      if (!owner) return res.status(401).json({ message: 'Owner account not found' });

      if (!owner.isActive()) {
        return res.status(403).json({ message: 'Subscription expired', code: 'SUBSCRIPTION_EXPIRED' });
      }

      req.user = owner;
      req.isStaff = true;
      req.staffId = decoded.staffId;
      req.staffName = decoded.staffName;
      return next();
    }

    // Regular owner token
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    if (!user.isActive()) {
      return res.status(403).json({ message: 'Subscription expired', code: 'SUBSCRIPTION_EXPIRED' });
    }

    req.user = user;
    req.isStaff = false;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
