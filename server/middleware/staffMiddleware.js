// Blocks staff tokens from accessing owner-only routes.
// Apply after authMiddleware on protected routes.
export function staffRestrict(req, res, next) {
  if (req.isStaff) {
    return res.status(403).json({ message: 'Akses tidak dibenarkan untuk staff' });
  }
  next();
}
