import ServiceProvider from "../models/ServiceProvider.js";
import User from "../models/User.js";
import { ADMIN, SUPER_ADMIN } from "../constants/roles.js";
import { BOOKABLE_SERVICE_TYPES } from "../constants/booking.js";

// Create service provider profile
const createProvider = async (userId, data) => {
  // Verify user exists and has the correct role/serviceType
  const user = await User.findById(userId);
  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  if (user.roles !== ADMIN && user.roles !== SUPER_ADMIN) {
    throw {
      statusCode: 403,
      message: "Only approved service providers can create a provider profile",
    };
  }

  if (!BOOKABLE_SERVICE_TYPES.includes(user.serviceType)) {
    throw {
      statusCode: 400,
      message: `Your service type "${user.serviceType}" is not eligible for bookings`,
    };
  }

  // Check if user already has a provider profile
  const existing = await ServiceProvider.findOne({ userId });
  if (existing) {
    throw {
      statusCode: 400,
      message: "You already have a service provider profile",
    };
  }

  const provider = await ServiceProvider.create({
    userId,
    serviceType: user.serviceType,
    name: data.name || user.organizationName || user.name,
    description: data.description || null,
    address: data.address || user.contactAddress || null,
    latitude: data.latitude || user.latitude || null,
    longitude: data.longitude || user.longitude || null,
    phone: data.phone || user.contactPhone || null,
    email: data.email || user.email || null,
    image: data.image || null,
    coverImage: data.coverImage || null,
    amenities: data.amenities || [],
    availability: data.availability || [],
    serviceOptions: data.serviceOptions || [],
    slotDuration: data.slotDuration || 30,
  });

  return provider;
};

// Get provider profile by userId (for the provider themselves)
const getMyProvider = async (userId) => {
  const provider = await ServiceProvider.findOne({ userId }).populate(
    "userId",
    "name email profileImage roles serviceType organizationName",
  );

  if (!provider) {
    throw { statusCode: 404, message: "Service provider profile not found" };
  }

  return provider;
};

// Get all active providers with optional filters
const getProviders = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 20,
    serviceType,
    search,
    sort = "createdAt",
    order = "desc",
  } = queryParams;

  const filter = { isActive: true };

  if (serviceType) {
    filter.serviceType = serviceType;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const sortObj = {};
  sortObj[sort] = order === "asc" ? 1 : -1;

  const [providers, total] = await Promise.all([
    ServiceProvider.find(filter)
      .populate(
        "userId",
        "name email profileImage roles serviceType organizationName",
      )
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    ServiceProvider.countDocuments(filter),
  ]);

  return {
    providers,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get single provider by ID (public)
const getProviderById = async (providerId) => {
  const provider = await ServiceProvider.findById(providerId).populate(
    "userId",
    "name email profileImage roles serviceType organizationName",
  );

  if (!provider) {
    throw { statusCode: 404, message: "Service provider not found" };
  }

  if (!provider.isActive) {
    throw {
      statusCode: 404,
      message: "This service provider is not available",
    };
  }

  return provider;
};

// Update provider profile
const updateProvider = async (userId, data) => {
  const provider = await ServiceProvider.findOne({ userId });

  if (!provider) {
    throw { statusCode: 404, message: "Service provider profile not found" };
  }

  // Fields that can be updated
  const allowedFields = [
    "name",
    "description",
    "address",
    "latitude",
    "longitude",
    "phone",
    "email",
    "image",
    "coverImage",
    "amenities",
    "availability",
    "serviceOptions",
    "slotDuration",
    "isActive",
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  const updated = await ServiceProvider.findByIdAndUpdate(
    provider._id,
    updateData,
    { new: true, runValidators: true },
  ).populate(
    "userId",
    "name email profileImage roles serviceType organizationName",
  );

  return updated;
};

// Delete provider profile (soft delete)
const deleteProvider = async (userId) => {
  const provider = await ServiceProvider.findOne({ userId });

  if (!provider) {
    throw { statusCode: 404, message: "Service provider profile not found" };
  }

  const deleted = await ServiceProvider.findByIdAndUpdate(
    provider._id,
    { isActive: false },
    { new: true },
  );

  return deleted;
};

export default {
  createProvider,
  getMyProvider,
  getProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
};
