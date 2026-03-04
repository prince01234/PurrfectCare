import { apiRequest } from "./client";
import type { ApiResponse } from "./client";

// ── Types ──
export interface ProviderLocation {
  _id: string;
  name: string;
  profileImage?: string;
  serviceType: string;
  organizationName?: string;
  contactPhone?: string;
  contactAddress?: string;
  latitude: number;
  longitude: number;
}

export interface AdoptionLocation {
  _id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: number;
  location: string;
  latitude: number;
  longitude: number;
  photos: string[];
  postedBy?: {
    _id: string;
    name: string;
    organizationName?: string;
    profileImage?: string;
  };
}

export interface ProviderLocationsResponse {
  providers: ProviderLocation[];
}

export interface AdoptionLocationsResponse {
  listings: AdoptionLocation[];
}

// ── API ──
export const mapApi = {
  /** Fetch service provider locations (optionally filtered by serviceType) */
  getProviderLocations: (
    serviceType?: string,
  ): Promise<ApiResponse<ProviderLocationsResponse>> => {
    const params = new URLSearchParams();
    if (serviceType) params.set("serviceType", serviceType);
    const query = params.toString();
    return apiRequest(`/api/map/providers${query ? `?${query}` : ""}`);
  },

  /** Fetch adoption listing locations */
  getAdoptionLocations: (): Promise<ApiResponse<AdoptionLocationsResponse>> => {
    return apiRequest("/api/map/adoptions");
  },
};
