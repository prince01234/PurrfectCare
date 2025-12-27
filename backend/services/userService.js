import { SUPER_ADMIN, ADMIN, USER, PET_OWNER } from "../constants/roles.js";
import User from "../models/User.js";

const createUser = async (data) => await User.create(data);

const getUser = async () => {
  const users = await User.find();

  return users;
};

const getUserById = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw {
      statusCode: 404,
      message: "User not found",
    };
  }

  return user;
};

const updateUser = async (id, body) => {
  const updatedUser = await User.findByIdAndUpdate(id, body, { new: true });

  if (!updatedUser) {
    throw {
      statusCode: 404,
      message: "User not found",
    };
  }
  return updatedUser;
};

export default { createUser, getUser, getUserById, updateUser };
