const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Resend free tier uses onboarding@resend.dev as sender
const FROM = 'YallaRent <onboarding@resend.dev>';

const emailStrings = {
  en: {
    subject: 'Your YallaRent Verification Code',
    tagline: 'Rent a car. Anytime. Anywhere.',
    greeting: (name) => `Hello ${name},`,
    body: 'We received a request to verify your account. Please use the code below to complete your verification.',
    codeLabel: 'Verification Code',
    warningTitle: 'Do not share this code',
    warningBody: 'YallaRent will never ask for your code via phone, SMS, or email. If you didn\'t request this, please ignore this message.',
    expires: 'This code expires in <strong>10 minutes</strong>.',
    footer: 'This is an automated message from YallaRent. Please do not reply to this email.',
    dir: 'ltr',
  },
  ar: {
    subject: 'رمز التحقق من YallaRent',
    tagline: 'استأجر سيارة. في أي وقت. في أي مكان.',
    greeting: (name) => `مرحباً ${name}،`,
    body: 'لقد تلقينا طلباً للتحقق من حسابك. يرجى استخدام الرمز أدناه لإكمال التحقق.',
    codeLabel: 'رمز التحقق',
    warningTitle: 'لا تشارك هذا الرمز',
    warningBody: 'لن تطلب YallaRent رمزك عبر الهاتف أو الرسائل القصيرة أو البريد الإلكتروني. إذا لم تطلب هذا، يرجى تجاهل هذه الرسالة.',
    expires: 'ينتهي هذا الرمز خلال <strong>١٠ دقائق</strong>.',
    footer: 'هذه رسالة تلقائية من YallaRent. يرجى عدم الرد على هذا البريد الإلكتروني.',
    dir: 'rtl',
  },
  ku: {
    subject: 'کۆدی پشتڕاستکردنەوەی YallaRent',
    tagline: 'ئۆتۆمبێل بکرێ. هەر کاتێک. هەر شوێنێک.',
    greeting: (name) => `سڵاو ${name}،`,
    body: 'داواکاریەکی پشتڕاستکردنەوەی هەژمارەکەتمان وەرگرت. تکایە کۆدی خوارەوە بەکاربهێنە بۆ تەواوکردنی پشتڕاستکردنەوە.',
    codeLabel: 'کۆدی پشتڕاستکردنەوە',
    warningTitle: 'ئەم کۆدە لەگەڵ کەس بەشی مەکە',
    warningBody: 'YallaRent هەرگیز کۆدەکەت لێ ناپرسیت لە ڕێگەی تەلەفۆن، مەسیج، یان ئیمەیل. ئەگەر تۆ داوات نەکردووە، تکایە ئەم نامەیە پشتگوێ بخە.',
    expires: 'ئەم کۆدە لە <strong>١٠ خولەک</strong>دا بەسەردەچێت.',
    footer: 'ئەم نامەیە بە ئۆتۆماتیکی نێردراوە لە YallaRent. تکایە وەڵامی ئەم ئیمەیلە مەدەرەوە.',
    dir: 'rtl',
  },
};

function isConfigured() {
  return !!resend;
}

async function sendOtp(to, otp, options = {}) {
  const { name = '', language = 'en' } = options;
  const s = emailStrings[language] || emailStrings.en;
  const displayName = name || to;

  if (!resend) {
    console.log(`[Email] Not configured — OTP for ${to}: ${otp}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: s.subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;" dir="${s.dir}">
        <!-- Header -->
        <div style="background: #0891B2; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">YallaRent</h1>
          <p style="color: #B2EBF2; margin: 8px 0 0; font-size: 14px;">${s.tagline}</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; border: 1px solid #E5E7EB; border-top: none;">
          <p style="color: #111827; font-size: 16px; margin: 0 0 8px;">${s.greeting(displayName)}</p>
          <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${s.body}</p>

          <!-- OTP Box -->
          <div style="background: #E0F7FA; border: 2px solid #0891B2; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
            <p style="color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">${s.codeLabel}</p>
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #0891B2;" dir="ltr">${otp}</span>
          </div>

          <!-- Warning -->
          <div style="background: #FEF3C7; border-${s.dir === 'rtl' ? 'right' : 'left'}: 4px solid #F59E0B; border-radius: ${s.dir === 'rtl' ? '8px 0 0 8px' : '0 8px 8px 0'}; padding: 14px 16px; margin-bottom: 24px;">
            <p style="color: #92400E; font-size: 13px; font-weight: 600; margin: 0 0 4px;">${s.warningTitle}</p>
            <p style="color: #92400E; font-size: 13px; margin: 0;">${s.warningBody}</p>
          </div>

          <p style="color: #6B7280; font-size: 14px; margin: 0;">${s.expires}</p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 24px; text-align: center; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px; background: #F9FAFB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">${s.footer}</p>
          <p style="color: #9CA3AF; font-size: 11px; margin: 8px 0 0;">&copy; ${new Date().getFullYear()} YallaRent.</p>
        </div>
      </div>
    `,
  });
}

async function sendBookingReceipt(to, booking) {
  if (!resend) {
    console.log(`[Email] Not configured — receipt for ${to}, booking ${booking.id}`);
    return;
  }

  const startDate = new Date(booking.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const endDate = new Date(booking.end_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Booking Confirmed — ${booking.car_name}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: #0891B2; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">YallaRent</h1>
          <p style="color: #B2EBF2; margin: 8px 0 0; font-size: 14px;">Booking Confirmation</p>
        </div>

        <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none;">
          <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px; color: #111827;">${booking.car_name}</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Company</td>
                <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${booking.company_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Pickup</td>
                <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Dropoff</td>
                <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${endDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Pickup Time</td>
                <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${booking.pickup_time || '09:00'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Dropoff Time</td>
                <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${booking.dropoff_time || '09:00'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Pickup Location</td>
                <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${booking.pickup_location || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Dropoff Location</td>
                <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${booking.dropoff_location || '—'}</td>
              </tr>
            </table>
            <div style="border-top: 2px solid #E5E7EB; margin-top: 12px; padding-top: 12px;">
              <span style="font-size: 16px; font-weight: bold; color: #111827;">Total</span>
              <span style="font-size: 18px; font-weight: bold; color: #0891B2; float: right;">${Number(booking.total_price).toLocaleString()} IQD</span>
            </div>
          </div>

          <p style="color: #6B7280; font-size: 13px; margin: 0;">Booking ID: <code style="background: #F3F4F6; padding: 2px 6px; border-radius: 4px;">${booking.id}</code></p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 24px; text-align: center; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px; background: #F9FAFB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">Thank you for choosing YallaRent!</p>
          <p style="color: #9CA3AF; font-size: 11px; margin: 8px 0 0;">&copy; ${new Date().getFullYear()} YallaRent.</p>
        </div>
      </div>
    `,
  });
}

module.exports = { isConfigured, sendOtp, sendBookingReceipt };
