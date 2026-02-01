import userService from "../services/userService.js";

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).send(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).send({ error: "Failed to create user" });
  }
};

const getUser = async (req, res) => {
  try {
    const users = await userService.getUser();
    res.status(200).send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(400).send({ error: "Failed to fetch users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).send(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch user by ID";
    res.status(statusCode).send({ error: message });
  }
};

const updateUser = async (req, res) => {
  const id = req.params.id;

  try {
    // Validate file if provided
    if (req.file) {
      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).send({
          error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
        });
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res.status(400).send({
          error: "File too large. Maximum size is 5MB",
        });
      }
    }

    const updatedUser = await userService.updateUser(id, req.body, req.file);
    res.status(200).send(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update user";
    res.status(statusCode).send({ error: message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await userService.deleteUser(req.params.id);

    res.status(200).json({
      message: `User ${deletedUser.name} with id: ${deletedUser._id} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete user";
    res.status(statusCode).send({ error: message });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const { userIntent } = req.body;
    const updatedUser = await userService.completeOnboarding(
      req.params.id,
      userIntent,
    );

    res.status(200).json({
      message: "Onboarding completed successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
        userIntent: updatedUser.userIntent,
      },
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to complete onboarding";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  createUser,
  getUser,
  getUserById,
  updateUser,
  deleteUser,
  completeOnboarding,
};
