"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair, Search, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        onLocationChange(newLat, newLng);

        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          const marker = L.marker([newLat, newLng], {
            draggable: true,
          }).addTo(mapRef.current);
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onLocationChange(pos.lat, pos.lng);
          });
          markerRef.current = marker;
        }

        mapRef.current.setView([newLat, newLng], 15);
      } else {
        alert("Location not found. Try a different search term.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching for location.");
    } finally {
      setIsSearching(false);
    }
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

      {/* Location Search Bar */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(e);
          }}
          placeholder="Search for a place (e.g., Thamel)"
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="px-3 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>

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
