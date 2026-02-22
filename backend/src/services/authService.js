import User from "../models/User.js";
import ResetPassword from "../models/ResetPassword.js";
import AccountVerification from "../models/AccountVerification.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../utils/email.js";
import config from "../config/config.js";

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const createVerificationRecord = async (userId) => {
  const verificationToken = crypto.randomUUID();
  const otp = generateOtp();
  const otpHash = bcrypt.hashSync(otp, 10);

  await AccountVerification.create({
    userId,
    token: verificationToken,
    otpHash,
  });

  return { verificationToken, otp };
};

const createResetRecord = async (userId) => {
  const token = crypto.randomUUID();
  const otp = generateOtp();
  const otpHash = bcrypt.hashSync(otp, 10);

  await ResetPassword.create({
    userId,
    token,
    otpHash,
  });

  return { token, otp };
};

const login = async (data) => {
  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = bcrypt.compareSync(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error("Email or password is incorrect");
  }

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

  const { verificationToken, otp } = await createVerificationRecord(
    registeredUser._id,
  );

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
        <p>Please verify your account using the OTP below or click the link:</p>
        <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
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

  const { token, otp } = await createResetRecord(user._id);

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
            <p>We received a request to reset your password for your PurrfectCare account. Use the OTP below or click the button to reset your password:</p>
            <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
            <a href="${config.appUrl}/reset-password?userId=${user._id}&token=${token}" class="button">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>This link will expire in a hour for security reasons.</p>
          </div>
          <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
            <p>${config.appUrl}/reset-password?userId=${user._id}&token=${token}</p>
            <p>&copy; 2026 PurrfectCare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return { message: "Reset password link send successfully" };
};

const resetPassword = async ({ userId, token, email, otp, newPassword }) => {
  let resolvedUserId = userId;

  if (!resolvedUserId && email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    resolvedUserId = user._id;
  }

  if (!resolvedUserId) {
    throw new Error("User ID or email is required.");
  }

  const data = await ResetPassword.findOne({
    userId: resolvedUserId,
    expiresAt: { $gt: Date.now() },
  }).sort({ expiresAt: -1 });

  if (!data) {
    throw new Error("Invalid or expired reset request.");
  }

  if (data.isUsed) {
    throw new Error("This reset request has already been used.");
  }

  if (token) {
    if (data.token !== token) {
      throw new Error("Invalid or expired link.");
    }
  } else if (otp) {
    const otpValue = String(otp);
    const isOtpValid = bcrypt.compareSync(otpValue, data.otpHash || "");
    if (!isOtpValid) {
      throw new Error("Invalid or expired reset code.");
    }
  } else {
    throw new Error("Reset token or code is required.");
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  await User.findByIdAndUpdate(resolvedUserId, { password: hashedPassword });
  await ResetPassword.findByIdAndUpdate(data._id, { isUsed: true });

  return { message: "Password reset successfully." };
};

const verifyResetOtp = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const data = await ResetPassword.findOne({
    userId: user._id,
    expiresAt: { $gt: Date.now() },
  }).sort({ expiresAt: -1 });

  if (!data) {
    throw new Error("Invalid or expired reset request.");
  }

  if (data.isUsed) {
    throw new Error("This reset request has already been used.");
  }

  const otpValue = String(otp);
  const isOtpValid = bcrypt.compareSync(otpValue, data.otpHash || "");
  if (!isOtpValid) {
    throw new Error("Invalid or expired reset code.");
  }

  return {
    userId: user._id,
    token: data.token,
  };
};

const verifyAccount = async ({ userId, token, email, otp }) => {
  let resolvedUserId = userId;

  if (!resolvedUserId && email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    resolvedUserId = user._id;
  }

  if (!resolvedUserId) {
    throw new Error("User ID or email is required.");
  }

  const data = await AccountVerification.findOne({
    userId: resolvedUserId,
    expiresAt: { $gt: Date.now() },
  }).sort({ expiresAt: -1 });

  if (!data) {
    throw new Error("Invalid or expired verification request.");
  }

  if (data.isUsed) {
    throw new Error("This verification request has already been used.");
  }

  if (token) {
    if (data.token !== token) {
      throw new Error("Invalid or expired verification link.");
    }
  } else if (otp) {
    const otpValue = String(otp);
    const isOtpValid = bcrypt.compareSync(otpValue, data.otpHash || "");
    if (!isOtpValid) {
      throw new Error("Invalid or expired verification code.");
    }
  } else {
    throw new Error("Verification token or code is required.");
  }

  const user = await User.findById(resolvedUserId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("Account already verified");
  }

  await User.findByIdAndUpdate(resolvedUserId, { isVerified: true });
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

  const { verificationToken, otp } = await createVerificationRecord(user._id);

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
        <p>Please verify your account using the OTP below or click the link:</p>
        <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
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
  verifyResetOtp,
  verifyAccount,
  resendVerification,
};
