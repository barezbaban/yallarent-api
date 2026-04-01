const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Resend free tier uses onboarding@resend.dev as sender
const FROM = 'YallaRent <onboarding@resend.dev>';

function isConfigured() {
  return !!resend;
}

async function sendOtp(to, otp) {
  if (!resend) {
    console.log(`[Email] Not configured — OTP for ${to}: ${otp}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your YallaRent Verification Code',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #0D9488; margin: 0 0 8px;">YallaRent</h2>
        <p style="color: #6B7280; margin: 0 0 24px;">Your verification code</p>
        <div style="background: #F0FDFA; border: 2px solid #0D9488; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0D9488;">${otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 14px; margin: 0;">This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
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
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #0D9488; margin: 0 0 4px;">YallaRent</h2>
        <p style="color: #6B7280; margin: 0 0 24px;">Booking Confirmation</p>

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
            <span style="font-size: 18px; font-weight: bold; color: #0D9488; float: right;">${Number(booking.total_price).toLocaleString()} IQD</span>
          </div>
        </div>

        <p style="color: #6B7280; font-size: 13px; margin: 0;">Booking ID: <code style="background: #F3F4F6; padding: 2px 6px; border-radius: 4px;">${booking.id}</code></p>
        <p style="color: #9CA3AF; font-size: 12px; margin: 16px 0 0;">Thank you for choosing YallaRent!</p>
      </div>
    `,
  });
}

module.exports = { isConfigured, sendOtp, sendBookingReceipt };
