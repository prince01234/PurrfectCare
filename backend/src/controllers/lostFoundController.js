import lostFoundService from "../services/lostFoundService.js";

const createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const post = await lostFoundService.createPost(userId, req.body, req.files);

    res.status(201).send(post);
  } catch (error) {
    console.error("Error creating lost/found post:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create post";
    res.status(statusCode).send({ error: message });
  }
};

const getPosts = async (req, res) => {
  try {
    const result = await lostFoundService.getPosts(req.query);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching lost/found posts:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch posts";
    res.status(statusCode).send({ error: message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await lostFoundService.getPostById(req.params.id);
    res.status(200).send(post);
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch post";
    res.status(statusCode).send({ error: message });
  }
};

const updatePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const updatedPost = await lostFoundService.updatePost(
      req.params.id,
      userId,
      req.body,
      req.files,
    );
    res.status(200).send(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update post";
    res.status(statusCode).send({ error: message });
  }
};

const updatePostStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).send({ error: "Status is required" });
    }

    const post = await lostFoundService.updatePostStatus(
      req.params.id,
      userId,
      status,
    );
    res.status(200).send(post);
  } catch (error) {
    console.error("Error updating post status:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update post status";
    res.status(statusCode).send({ error: message });
  }
};

const deletePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await lostFoundService.deletePost(req.params.id, userId);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error deleting post:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete post";
    res.status(statusCode).send({ error: message });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await lostFoundService.getMyPosts(userId, req.query);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching my posts:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch your posts";
    res.status(statusCode).send({ error: message });
  }
};

const getPostLocations = async (req, res) => {
  try {
    const posts = await lostFoundService.getPostLocations(req.query);
    res.status(200).send({ posts });
  } catch (error) {
    console.error("Error fetching post locations:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch post locations";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  updatePostStatus,
  deletePost,
  getMyPosts,
  getPostLocations,
};
