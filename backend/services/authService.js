import User from "../models/User.js";
import bcrypt from "bcryptjs";

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

export default { registerUser };
