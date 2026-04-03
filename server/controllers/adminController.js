import User from '../models/userModel.js';

// GET /api/admin/stats
export async function getStats(req, res) {
  try {
    const [total, trial, active, expired, cancelled] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ plan: 'trial' }),
      User.countDocuments({ plan: 'active' }),
      User.countDocuments({ plan: 'expired' }),
      User.countDocuments({ plan: 'cancelled' }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await User.countDocuments({ createdAt: { $gte: today } });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({ total, trial, active, expired, cancelled, newToday, newThisWeek });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load stats' });
  }
}

// GET /api/admin/users
export async function getUsers(req, res) {
  try {
    const { search, plan, page } = req.query;
    const filter = {};

    if (search) {
      // Escape regex special chars to prevent ReDoS
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { email: { $regex: escaped, $options: 'i' } },
        { businessName: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (plan) filter.plan = plan;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limit = 50;
    const skip = (pageNum - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -resetToken -resetTokenExpiry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: pageNum, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load users' });
  }
}

// PATCH /api/admin/users/:id/plan
export async function updateUserPlan(req, res) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    switch (action) {
      case 'activate':
        user.plan = 'active';
        user.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'extend_trial':
        user.plan = 'trial';
        user.trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'suspend':
        user.plan = 'cancelled';
        break;
      case 'expire':
        user.plan = 'expired';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await user.save();
    res.json({ message: 'Updated', user: { _id: user._id, plan: user.plan, trialExpiry: user.trialExpiry, subscriptionExpiry: user.subscriptionExpiry } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
}
