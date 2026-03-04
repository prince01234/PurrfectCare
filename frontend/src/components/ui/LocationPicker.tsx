"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  error?: string;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  error,
}: LocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] =
      latitude && longitude ? [latitude, longitude] : [27.7172, 85.324]; // Kathmandu default

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Add marker if we already have coordinates
    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude], {
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });

      markerRef.current = marker;
    }

    // Click to place/move marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChange(pos.lat, pos.lng);
        });
        markerRef.current = marker;
      }

      onLocationChange(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker if lat/lng change externally
  useEffect(() => {
    if (!mapRef.current) return;
    if (latitude && longitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        const marker = L.marker([latitude, longitude], {
          draggable: true,
        }).addTo(mapRef.current);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChange(pos.lat, pos.lng);
        });
        markerRef.current = marker;
      }
      mapRef.current.setView([latitude, longitude], 15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const handleLocateMe = () => {
    if (!mapRef.current) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        onLocationChange(lat, lng);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Unable to get your location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <MapPin className="w-4 h-4 inline mr-1 text-teal-500" />
        Pin Your Location on Map
      </label>

      <p className="text-xs text-gray-400 mb-2">
        Click on the map to set your location, or use &quot;Locate Me&quot;
      </p>

      {/* Map container */}
      <div
        className={`relative rounded-2xl overflow-hidden border-2 ${
          error ? "border-red-300" : "border-gray-200"
        }`}
        style={{ height: "220px" }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Locate me button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="absolute top-2 right-2 z-1000 flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl shadow-md text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50"
        >
          <Crosshair
            className={`w-3.5 h-3.5 text-blue-500 ${isLocating ? "animate-spin" : ""}`}
          />
          {isLocating ? "Locating..." : "Locate Me"}
        </button>
      </div>

      {/* Coordinate display */}
      {latitude && longitude && (
        <div className="flex items-center gap-2 text-xs text-teal-600 bg-teal-50 px-3 py-2 rounded-xl">
          <MapPin className="w-3.5 h-3.5" />
          <span>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>
      )}

      {error && <p className="text-red-500 text-sm ml-1">{error}</p>}
    </div>
  );
}
