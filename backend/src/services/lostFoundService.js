import LostFoundPost, { isValidObjectId } from "../models/LostFoundPost.js";
import { uploadFile } from "../utils/file.js";
import { POST_STATUS } from "../constants/lostFound.js";

const createPost = async (userId, data, files) => {
  // Upload photos if provided
  let photoUrls = [];
  if (files && files.length > 0) {
    photoUrls = await uploadFile(files);
  }

  const post = await LostFoundPost.create({
    ...data,
    createdBy: userId,
    photos: photoUrls,
  });

  return post;
};

const getPosts = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 20,
    search,
    postType,
    species,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
    latitude,
    longitude,
  } = queryParams;

  // Build filter
  const filter = {};

  // Search by title, description, petName, breed, or locationAddress
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { petName: { $regex: search, $options: "i" } },
      { breed: { $regex: search, $options: "i" } },
      { locationAddress: { $regex: search, $options: "i" } },
    ];
  }

  if (postType) filter.postType = postType.toLowerCase();
  if (species) filter.species = species.toLowerCase();
  if (status) {
    filter.status = status.toLowerCase();
  } else {
    // Default: show active posts first (but include all)
    filter.status = { $in: [POST_STATUS.ACTIVE, POST_STATUS.RESOLVED] };
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort = {};
  // Active posts first, then by date
  if (sortBy === "createdAt") {
    sort.status = 1; // "active" < "resolved" alphabetically
    sort.createdAt = sortOrder === "asc" ? 1 : -1;
  } else {
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
  }

  const [posts, total] = await Promise.all([
    LostFoundPost.find(filter)
      .populate("createdBy", "name email profileImage")
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    LostFoundPost.countDocuments(filter),
  ]);

  // If lat/lng provided, compute distance for each post
  let postsWithDistance = posts.map((p) => p.toObject());
  if (latitude && longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    postsWithDistance = postsWithDistance.map((post) => {
      const distance = getDistanceKm(lat, lng, post.latitude, post.longitude);
      return { ...post, distance };
    });

    // Sort by nearest if requested
    if (sortBy === "distance") {
      postsWithDistance.sort((a, b) => a.distance - b.distance);
    }
  }

  return {
    posts: postsWithDistance,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

const getPostById = async (postId) => {
  if (!isValidObjectId(postId)) {
    throw { statusCode: 400, message: "Invalid post ID" };
  }

  const post = await LostFoundPost.findById(postId).populate(
    "createdBy",
    "name email profileImage phoneNumber",
  );

  if (!post) {
    throw { statusCode: 404, message: "Post not found" };
  }

  return post;
};

const updatePost = async (postId, userId, data, files) => {
  if (!isValidObjectId(postId)) {
    throw { statusCode: 400, message: "Invalid post ID" };
  }

  const post = await LostFoundPost.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: "Post not found" };
  }

  if (post.createdBy.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "You are not authorized to update this post",
    };
  }

  if (post.status === POST_STATUS.RESOLVED) {
    throw {
      statusCode: 400,
      message: "Cannot edit a resolved post",
    };
  }

  // Upload new photos if provided
  if (files && files.length > 0) {
    const newPhotoUrls = await uploadFile(files);
    data.photos = [...(post.photos || []), ...newPhotoUrls];
  }

  // Don't allow changing the creator
  delete data.createdBy;

  const updatedPost = await LostFoundPost.findByIdAndUpdate(
    postId,
    { $set: data },
    { new: true, runValidators: true },
  ).populate("createdBy", "name email profileImage");

  return updatedPost;
};

const updatePostStatus = async (postId, userId, newStatus) => {
  if (!isValidObjectId(postId)) {
    throw { statusCode: 400, message: "Invalid post ID" };
  }

  const post = await LostFoundPost.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: "Post not found" };
  }

  if (post.createdBy.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "Only the post creator can change the status",
    };
  }

  post.status = newStatus;
  await post.save();

  return post;
};

const deletePost = async (postId, userId) => {
  if (!isValidObjectId(postId)) {
    throw { statusCode: 400, message: "Invalid post ID" };
  }

  const post = await LostFoundPost.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: "Post not found" };
  }

  if (post.createdBy.toString() !== userId) {
    throw {
      statusCode: 403,
      message: "You are not authorized to delete this post",
    };
  }

  await LostFoundPost.findByIdAndDelete(postId);

  return { message: "Post deleted successfully" };
};

const getMyPosts = async (userId, queryParams = {}) => {
  const { page = 1, limit = 20, postType, status } = queryParams;

  const filter = { createdBy: userId };
  if (postType) filter.postType = postType.toLowerCase();
  if (status) filter.status = status.toLowerCase();

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [posts, total] = await Promise.all([
    LostFoundPost.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    LostFoundPost.countDocuments(filter),
  ]);

  return {
    posts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get posts with location data for map view
const getPostLocations = async (queryParams = {}) => {
  const { postType, species } = queryParams;

  const filter = { status: POST_STATUS.ACTIVE };
  if (postType) filter.postType = postType.toLowerCase();
  if (species) filter.species = species.toLowerCase();

  const posts = await LostFoundPost.find(filter)
    .select(
      "postType title species breed petName latitude longitude locationAddress photos status eventDate createdBy",
    )
    .populate("createdBy", "name profileImage");

  return posts;
};

// Haversine formula
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
