import express from "express";
import mapController from "../controllers/mapController.js";

const router = express.Router();

// Public: GET /api/map/providers - Get provider locations for map
router.get("/providers", mapController.getProviderLocations);

// Public: GET /api/map/adoptions - Get adoption listing locations for map
router.get("/adoptions", mapController.getAdoptionLocations);

// Public: GET /api/map/lost-found - Get lost/found post locations for map
router.get("/lost-found", mapController.getLostFoundLocations);

export default router;
