const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (email, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to LMS Platform',
    html: `
      <h1>Welcome, ${firstName}!</h1>
      <p>Thank you for registering with our LMS platform.</p>
      <p>You can now browse and enroll in courses.</p>
      <p>Happy learning!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error - email failure shouldn't break registration
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>Hi ${firstName},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

const sendVerificationEmail = async (email, firstName, verificationToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email',
    html: `
      <h1>Welcome, ${firstName}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

const sendOtpEmail = async (email, firstName, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Account Re-verification OTP',
    html: `
      <h1>Account Re-verification</h1>
      <p>Hi ${firstName},</p>
      <p>Your account has been inactive for 60+ days. Enter this OTP to continue:</p>
      <h2 style="letter-spacing: 8px; font-size: 36px;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendOtpEmail
};