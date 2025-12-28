import User from "../models/User.js";
import bcrypt from "bcryptjs";

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
  return {
    _id: registeredUser._id,
    name: registeredUser.name,
    email: registeredUser.email,
  };
};

export default { registerUser, login };
