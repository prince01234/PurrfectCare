import { SUPER_ADMIN, ADMIN, USER, PET_OWNER } from "../constants/roles.js";
import User from "../models/User.js";
import uploadFile from "../utils/file.js";

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

const updateUser = async (id, body, file) => {
  const user = await User.findById(id);

  if (!user) {
    throw {
      statusCode: 404,
      message: "User not found",
    };
  }

  const updateData = { ...body };

  // Handle profile image upload if file is provided
  if (file) {
    const uploadedFiles = await uploadFile([file], user.profileImage);
    const uploadResult = uploadedFiles[0];

    // Only update if image was actually uploaded (not a duplicate)
    if (!uploadResult.isDuplicate) {
      updateData.profileImage = uploadResult.url;
    }
    // If duplicate, keep existing profileImage - don't update it
  }

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return updatedUser;
};

const deleteUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw {
      statusCode: 404,
      message: "User not found",
    };
  }

  const deletedUser = await User.findByIdAndDelete(id);
  return deletedUser;
};

const completeOnboarding = async (id, userIntent) => {
  const user = await User.findById(id);

  if (!user) {
    throw {
      statusCode: 404,
      message: "User not found",
    };
  }

  const validIntents = ["pet_owner", "looking_to_adopt", "exploring"];
  if (userIntent && !validIntents.includes(userIntent)) {
    throw {
      statusCode: 400,
      message: "Invalid user intent",
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      hasCompletedOnboarding: true,
      userIntent: userIntent || null,
    },
    { new: true },
  );

  return updatedUser;
};

export default {
  createUser,
  getUser,
  getUserById,
  updateUser,
  deleteUser,
  completeOnboarding,
};
