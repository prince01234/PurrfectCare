import authService from "../services/authService.js";
import { createJWT } from "../utils/jwt.js";

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

    const registeredUser = await authService.registerUser(userData);

    const authToken = createJWT(registeredUser);

    res.cookie("authToken", authToken);


    res.status(201).json({...registeredUser, authToken});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export default { registerUser };
