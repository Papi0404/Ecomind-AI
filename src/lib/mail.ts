import nodemailer from 'nodemailer';
import crypto from 'crypto';

// 1. Generate 6-Digit OTP using a Cryptographically Secure PRNG
export function generateOTP(): string {
  // crypto.randomInt is CSPRNG-backed, unlike Math.random()
  return crypto.randomInt(100000, 1000000).toString();
}

// 2. Hash OTP using sha256
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// 3. Send Verification Email
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Only log OTP in development — never expose it in production server logs
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n===========================================`);
    console.log(`[EcoMind AI Mailer Sandbox — DEV ONLY]`);
    console.log(`OTP VERIFICATION CODE FOR ${email}: ${otp}`);
    console.log(`===========================================\n`);
  }

  if (!host || !user || !pass) {
    // Return true to allow development without working SMTP
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const mailOptions = {
      from: `"EcoMind AI" <${user}>`,
      to: email,
      subject: 'EcoMind AI — Verifikasi Akun Anda',
      html: `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 20px; background-color: #FFF8E7; border: 1px solid #A8E6A3;">
          <h2 style="color: #2D5A27; text-align: center; margin-bottom: 24px; font-size: 24px;">Verifikasi Akun EcoMind AI 🌿</h2>
          <p style="color: #4A5568; font-size: 16px; line-height: 1.6; text-align: center;">
            Terima kasih telah bergabung dengan EcoMind AI. Gunakan kode OTP 6-digit di bawah ini untuk mengaktifkan akun Anda:
          </p>
          <div style="background-color: #FFFFFF; border-radius: 12px; border: 2px dashed #7ED957; padding: 20px; text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2D5A27;">${otp}</span>
          </div>
          <p style="color: #E53E3E; font-size: 14px; text-align: center; font-weight: 500;">
            *Kode verifikasi ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.
          </p>
          <hr style="border: 0; border-top: 1px solid #A8E6A3; margin: 30px 0;" />
          <p style="color: #718096; font-size: 12px; text-align: center;">
            © 2025 EcoMind AI. Dibuat dengan 🌿 untuk bumi yang lebih baik.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send SMTP email:', error);
    return false;
  }
}
