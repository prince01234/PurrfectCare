import User from "../models/User.js";
import ResetPassword from "../models/ResetPassword.js";
import AccountVerification from "../models/AccountVerification.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../utils/email.js";
import config from "../config/config.js";

const login = async (data) => {
  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = bcrypt.compareSync(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error("Email or password is incorrect");
  }

  // Allow unverified users to login - they can browse but not perform actions
  // The requireVerified middleware will block protected actions

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    userIntent: user.userIntent,
  };
};

const registerUser = async (userData) => {
  const user = await User.findOne({ email: userData.email });
  if (user) {
    throw new Error("User already exists");
  }

  const hashedPassword = bcrypt.hashSync(userData.password, 10);

  const registeredUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
  });

  const verificationToken = crypto.randomUUID();

  await AccountVerification.create({
    userId: registeredUser._id,
    token: verificationToken,
  });

  await sendEmail(registeredUser.email, {
    subject: "Verify your account",
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
      </head>
      <body>
        <p>Hello ${registeredUser.name},</p>
        <p>Please verify your account by clicking the link below:</p>
        <p>
          <a href="${config.appUrl}/verify-email?userId=${registeredUser._id}&token=${verificationToken}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Account
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </body>
      </html>
    `,
  });

  return {
    message: "Registration successful. Please verify your email.",
  };
};

const forgotPassword = async (email) => {
  // Implementation for forgot password functionality
  const user = await User.findOne({ email });

  if (!user) return;

  const token = crypto.randomUUID();

  await ResetPassword.create({
    userId: user._id,
    token,
  });

  await sendEmail(email, {
    subject: "Reset your password",
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #4CAF50;
            margin: 0;
          }
          .content {
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            background-color: #4CAF50;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password for your PurrfectCare account. If you made this request, please click the button below to reset your password:</p>
            <a href="${config.appUrl}/reset-password?userId=${user._id}&token=${token}" class="button">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>This link will expire in a hour for security reasons.</p>
          </div>
          <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
            <p>http://localhost:3000/reset-password?userId=${user._id}&token=${token}</p>
            <p>&copy; 2026 PurrfectCare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return { message: "Reset password link send successfully" };
};

const resetPassword = async (userId, token, newPassword) => {
  const data = await ResetPassword.findOne({
    userId,
    expiresAt: { $gt: Date.now() },
  }).sort({ expiresAt: -1 });

  if (!data || data.token !== token) {
    throw new Error("Invalid or expired link.");
  }

  if (data.isUsed) {
    throw new Error("This link has already been used.");
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  await User.findByIdAndUpdate(userId, { password: hashedPassword });

  await ResetPassword.findByIdAndUpdate(data._id, { isUsed: true });

  return { message: "Password reset successfully." };
};

const verifyAccount = async (userId, token) => {
  const data = await AccountVerification.findOne({
    userId,
    expiresAt: { $gt: Date.now() },
  }).sort({ expiresAt: -1 });

  if (!data || data.token !== token) {
    throw new Error("Invalid or expired verification link.");
  }

  if (data.isUsed) {
    throw new Error("This verification link has already been used.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("Account already verified");
  }

  await User.findByIdAndUpdate(userId, { isVerified: true });
  await AccountVerification.findByIdAndUpdate(data._id, { isUsed: true });

  return { message: "Account verified successfully." };
};

const resendVerification = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("Account already verified");
  }

  const verificationToken = crypto.randomUUID();

  await AccountVerification.create({
    userId: user._id,
    token: verificationToken,
  });

  await sendEmail(user.email, {
    subject: "Verify your account",
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
      </head>
      <body>
        <p>Hello ${user.name},</p>
        <p>Please verify your account by clicking the link below:</p>
        <p>
          <a href="${config.appUrl}/verify-email?userId=${user._id}&token=${verificationToken}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Account
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </body>
      </html>
    `,
  });

  return { message: "Verification email sent." };
};

export default {
  registerUser,
  login,
  forgotPassword,
  resetPassword,
  verifyAccount,
  resendVerification,
};
