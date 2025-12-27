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

export default { createUser, getUser, getUserById };
