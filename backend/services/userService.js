import { SUPER_ADMIN, ADMIN, USER, PET_OWNER } from "../constants/roles.js";
import User from "../models/User.js";

const createUser = async (data) => await User.create(data);

const getUser = async () => {
  const users = await User.find();

  return users;
};

export default { createUser, getUser };
