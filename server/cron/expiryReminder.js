import cron from 'node-cron';
import User from '../models/userModel.js';
import { sendExpiryReminderEmail } from '../services/emailService.js';

const RENEW_URL = `${process.env.FRONTEND_URL}/subscribe`;

/**
 * Runs every day at 9:00 AM.
 * Sends reminder emails to users whose trial/subscription expires in 7 days, 3 days, or today.
 */
export function startExpiryReminderCron() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[cron] Running expiry reminder check...');
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const in7  = new Date(now); in7.setDate(now.getDate() + 7);
      const in3  = new Date(now); in3.setDate(now.getDate() + 3);
      const in1  = new Date(now); in1.setDate(now.getDate() + 1); // end of "today"

      // Find users whose expiry falls in one of our reminder windows
      const users = await User.find({
        plan: { $in: ['trial', 'active'] },
        $or: [
          // 7-day window: trial
          { plan: 'trial', trialExpiry: { $gte: in7, $lt: new Date(in7.getTime() + 86400000) } },
          // 3-day window: trial
          { plan: 'trial', trialExpiry: { $gte: in3, $lt: new Date(in3.getTime() + 86400000) } },
          // Expires today: trial
          { plan: 'trial', trialExpiry: { $gte: now, $lt: in1 } },
          // 7-day window: active subscription
          { plan: 'active', subscriptionExpiry: { $gte: in7, $lt: new Date(in7.getTime() + 86400000) } },
          // 3-day window: active subscription
          { plan: 'active', subscriptionExpiry: { $gte: in3, $lt: new Date(in3.getTime() + 86400000) } },
          // Expires today: active subscription
          { plan: 'active', subscriptionExpiry: { $gte: now, $lt: in1 } },
        ],
      }).select('email businessName plan trialExpiry subscriptionExpiry');

      let sent = 0;
      for (const user of users) {
        const expiry = user.plan === 'trial' ? user.trialExpiry : user.subscriptionExpiry;
        const msLeft = new Date(expiry) - now;
        const daysLeft = Math.round(msLeft / 86400000);

        await sendExpiryReminderEmail({
          to: user.email,
          businessName: user.businessName,
          daysLeft,
          renewUrl: RENEW_URL,
        }).catch(console.error);
        sent++;
      }

      console.log(`[cron] Expiry reminders sent: ${sent}`);
    } catch (err) {
      console.error('[cron] Expiry reminder error:', err.message);
    }
  });

  console.log('[cron] Expiry reminder cron scheduled (daily 9:00 AM)');
}
