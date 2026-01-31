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
    if (!query.token || !query.userId) {
      return res.status(400).send("Token and user ID are required.");
    }

    if (!input.password) {
      return res.status(400).send("Password is required.");
    }

    if (!input.confirmPassword) {
      return res.status(400).send("Confirm password is required.");
    }

    if (input.password !== input.confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const data = await authService.resetPassword(
      query.userId,
      query.token,
      input.password,
    );

    res.status(201).json(data);
  } catch (error) {
    res.status(error.statusCode || 500).send(error.message);
  }
};

const verifyAccount = async (req, res) => {
  const { userId, token } = req.query;

  try {
    if (!userId || !token) {
      return res
        .status(400)
        .send("User ID and verification token are required.");
    }

    const data = await authService.verifyAccount(userId, token);

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
  verifyAccount,
  resendVerification,
  logout,
};
