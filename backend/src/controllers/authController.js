import authService from "../services/authService.js";
import { createJWT } from "../utils/jwt.js";

const loginUser = async (req, res) => {
  const data = req.body;

  try {
    if (!data) {
      return res.status(400).json({ message: "Required data is missing." });
    }

    if (!data.email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!data.password) {
      return res.status(400).json({ message: "Password is required." });
    }
    const user = await authService.login(data);

    const authToken = createJWT(user);

    res.cookie("authToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ ...user, authToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const registerUser = async (req, res) => {
  const userData = req.body;
  try {
    if (!userData.password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (!userData.confirmPassword) {
      return res.status(400).json({ message: "Confirm Password is required" });
    }

    if (userData.password !== userData.confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!userData.email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const response = await authService.registerUser(userData);

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const input = req.body;

  try {
    if (!input.email) {
      return res.status(400).send("Email address is required.");
    }

    const data = await authService.forgotPassword(input.email);

    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message);
  }
};

const resetPassword = async (req, res) => {
  const input = req.body;
  const query = req.query;

  try {
    if (!input.password) {
      return res.status(400).send("Password is required.");
    }

    if (!input.confirmPassword) {
      return res.status(400).send("Confirm password is required.");
    }

    if (input.password !== input.confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const hasLinkParams = query.token && query.userId;
    const hasOtpParams = input.email && input.otp;

    if (!hasLinkParams && !hasOtpParams) {
      return res
        .status(400)
        .send("Reset token or code with email is required.");
    }

    const data = await authService.resetPassword({
      userId: query.userId,
      token: query.token,
      email: input.email,
      otp: input.otp,
      newPassword: input.password,
    });

    res.status(201).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message);
  }
};

const verifyResetOtp = async (req, res) => {
  const input = req.body;

  try {
    if (!input.email) {
      return res.status(400).send("Email address is required.");
    }

    if (!input.otp) {
      return res.status(400).send("Reset code is required.");
    }

    const data = await authService.verifyResetOtp(input.email, input.otp);

    res.status(200).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message);
  }
};

const verifyAccount = async (req, res) => {
  const { userId, token } = req.query;
  const { email, otp } = req.body;

  try {
    if (!userId && !email) {
      return res
        .status(400)
        .send("User ID or email is required for verification.");
    }

    if (!token && !otp) {
      return res.status(400).send("Verification token or code is required.");
    }

    const data = await authService.verifyAccount({
      userId,
      token,
      email,
      otp,
    });

    res.status(201).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message);
  }
};

const resendVerification = async (req, res) => {
  const input = req.body;

  try {
    if (!input.email) {
      return res.status(400).send("Email address is required.");
    }

    const data = await authService.resendVerification(input.email);

    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message);
  }
};

const logout = async (req, res) => {
  res.clearCookie("authToken");

  res.json({ message: "Logout successful" });
};

export default {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  verifyAccount,
  resendVerification,
  logout,
};
