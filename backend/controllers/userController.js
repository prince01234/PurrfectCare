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

export default { createUser, getUser };
