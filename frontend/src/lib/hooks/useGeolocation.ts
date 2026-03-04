"use client";

import { useState, useEffect } from "react";

export interface GeoCoords {
  lat: number;
  lng: number;
}

/**
 * Haversine formula – returns distance in km between two lat/lon points.
 */
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Custom hook that returns the user's current geolocation coordinates.
 * Respects the Permissions API – won't prompt if previously denied.
 */
export function useGeolocation(): GeoCoords | null {
  const [coords, setCoords] = useState<GeoCoords | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    function requestLocation() {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          /* permission denied or error – leave null */
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
      );
    }

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "denied") return;
        requestLocation();
      })
      .catch(() => requestLocation());
  }, []);

  return coords;
}
