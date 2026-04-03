import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

const FROM = `EZOrder <${process.env.GMAIL_USER}>`;

const baseStyle = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0f1117; margin:0; padding:0; }
    .wrap { max-width:520px; margin:32px auto; background:#1a1f2e; border-radius:16px; overflow:hidden; border:1px solid #2a2f40; }
    .header { background:linear-gradient(135deg,#f59e0b,#d97706); padding:28px 32px; }
    .header h1 { margin:0; color:#000; font-size:24px; font-weight:800; letter-spacing:-0.5px; }
    .header p { margin:4px 0 0; color:#000000aa; font-size:13px; }
    .body { padding:28px 32px; color:#cbd5e1; font-size:15px; line-height:1.6; }
    .body h2 { color:#f1f5f9; margin:0 0 12px; font-size:18px; }
    .btn { display:inline-block; background:#f59e0b; color:#000 !important; padding:13px 28px; border-radius:10px; text-decoration:none; font-weight:700; font-size:15px; margin:20px 0; }
    .footer { padding:18px 32px; border-top:1px solid #2a2f40; font-size:12px; color:#475569; }
    .badge { display:inline-block; background:#f59e0b22; color:#f59e0b; border:1px solid #f59e0b44; border-radius:6px; padding:3px 10px; font-size:12px; font-weight:700; }
    .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #2a2f40; }
    .info-row:last-child { border-bottom:none; }
  </style>
`;

/**
 * Send welcome email after registration
 */
export async function sendWelcomeEmail({ to, businessName, trialExpiry }) {
  const expiry = new Date(trialExpiry).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `Selamat datang ke EZOrder, ${businessName}! 🎉`,
    html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
      <div class="wrap">
        <div class="header">
          <h1>EZOrder</h1>
          <p>Smart Order Management System</p>
        </div>
        <div class="body">
          <h2>Selamat datang, ${businessName}! 👋</h2>
          <p>Akaun anda berjaya didaftarkan. Trial percuma anda bermula sekarang!</p>
          <div style="background:#0f1117;border-radius:10px;padding:16px;margin:16px 0">
            <div class="info-row">
              <span>Plan</span><span class="badge">Trial 14 Hari</span>
            </div>
            <div class="info-row">
              <span>Trial tamat</span><span style="color:#f1f5f9;font-weight:600">${expiry}</span>
            </div>
          </div>
          <p>Apa yang boleh anda buat dengan EZOrder:</p>
          <ul style="color:#94a3b8;padding-left:20px;line-height:2">
            <li>Urus order pelanggan dengan cepat</li>
            <li>Jejak stok produk secara automatik</li>
            <li>Print resit thermal terus dari browser</li>
            <li>Laporan jualan harian, mingguan &amp; bulanan</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Buka Dashboard →</a>
          <p style="font-size:13px;color:#64748b">Soalan? Hubungi kami di ${process.env.GMAIL_USER}</p>
        </div>
        <div class="footer">EZOrder · Sistem Pengurusan Order Profesional · Trial anda tamat ${expiry}</div>
      </div>
    </body></html>`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, businessName, resetUrl }) {
  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: 'Reset Password EZOrder',
    html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
      <div class="wrap">
        <div class="header">
          <h1>EZOrder</h1>
          <p>Permintaan Reset Password</p>
        </div>
        <div class="body">
          <h2>Hi ${businessName},</h2>
          <p>Kami terima permintaan reset password untuk akaun anda.</p>
          <a href="${resetUrl}" class="btn">Reset Password →</a>
          <p style="font-size:13px;color:#64748b">Link ini akan tamat dalam <strong style="color:#f1f5f9">1 jam</strong>. Jika anda tidak buat permintaan ini, abaikan email ini.</p>
        </div>
        <div class="footer">EZOrder · Link reset password adalah satu kali guna sahaja.</div>
      </div>
    </body></html>`,
  });
}

/**
 * Send subscription expiry reminder
 * @param {number} daysLeft - 7, 3, or 0
 */
export async function sendExpiryReminderEmail({ to, businessName, daysLeft, renewUrl }) {
  const urgency = daysLeft === 0
    ? { subject: `⚠️ Akaun EZOrder anda telah TAMAT`, color: '#ef4444', badge: 'EXPIRED', msg: 'Akaun anda telah tamat tempoh. Langgan semula untuk terus guna EZOrder.' }
    : daysLeft <= 3
    ? { subject: `⚠️ EZOrder — Subscription tamat dalam ${daysLeft} hari`, color: '#f59e0b', badge: `${daysLeft} HARI LAGI`, msg: `Subscription anda akan tamat dalam <strong>${daysLeft} hari</strong>. Langgan sekarang untuk elak gangguan perkhidmatan.` }
    : { subject: `EZOrder — Subscription tamat dalam ${daysLeft} hari`, color: '#3b82f6', badge: `${daysLeft} HARI LAGI`, msg: `Subscription anda akan tamat dalam <strong>${daysLeft} hari</strong>. Langgan awal untuk kesinambungan perkhidmatan.` };

  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: urgency.subject,
    html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
      <div class="wrap">
        <div class="header" style="background:linear-gradient(135deg,${urgency.color},${urgency.color}cc)">
          <h1>EZOrder</h1>
          <p>Notis Subscription</p>
        </div>
        <div class="body">
          <h2>Hi ${businessName},</h2>
          <div style="background:#0f1117;border-radius:10px;padding:16px;margin:16px 0;text-align:center">
            <span style="font-size:28px;font-weight:900;color:${urgency.color}">${urgency.badge}</span>
          </div>
          <p>${urgency.msg}</p>
          <a href="${renewUrl}" class="btn" style="background:${urgency.color};color:#fff">Langgan Sekarang →</a>
          <p style="font-size:13px;color:#64748b">Soalan? Hubungi kami di ${process.env.GMAIL_USER}</p>
        </div>
        <div class="footer">EZOrder · Anda menerima email ini kerana ${to} didaftarkan di EZOrder.</div>
      </div>
    </body></html>`,
  });
}
