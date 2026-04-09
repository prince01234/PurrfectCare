"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Search, AlertCircle, Compass } from "lucide-react";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface AddressMapProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

// Reverse geocoding
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&limit=1`,
    );
    console.log("Reverse geocoding response:", res.status);
    if (!res.ok) throw new Error("Failed to reverse geocode");

    const data = (await res.json()) as {
      address?: { road?: string; city?: string; town?: string };
      display_name: string;
    };

    const road = data.address?.road || "";
    const city = data.address?.city || data.address?.town || "";
    return road && city ? `${road}, ${city}` : data.display_name;
  } catch {
    console.error("Reverse geocoding error");
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

// Map interaction component
function MapInteraction({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, address);
      map.setView([lat, lng], 17);
      toast.success("Location selected!");
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onLocationSelect]);

  return null;
}

// Locate me component
function LocateMe() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 17);
        toast.success("Location centered!");
        setIsLocating(false);
      },
      () => {
        toast.error("Unable to get your location");
        setIsLocating(false);
      },
    );
  };

  return (
    <button
      onClick={handleLocate}
      disabled={isLocating}
      className="absolute bottom-4 right-4 z-40 w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center disabled:opacity-50 hover:bg-gray-50"
      title="Locate me"
    >
      <Compass
        className={`w-5 h-5 text-gray-600 ${isLocating ? "animate-spin" : ""}`}
      />
    </button>
  );
}

// Search interaction component - moves map to search results
function SearchInteraction({
  selectedLocation,
  searchedCity,
}: {
  selectedLocation: { lat: number; lng: number; address: string } | null;
  searchedCity: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!searchedCity || !selectedLocation || !map) return;

    // Animate map to the searched location
    map.setView([selectedLocation.lat, selectedLocation.lng], 15, {
      animate: true,
    });
  }, [searchedCity, selectedLocation, map]);

  return null;
}

export default function AddressMap({ onLocationSelect }: AddressMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [searchedCity, setSearchedCity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Setup Leaflet icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      const defaultIcon = L.icon({
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
      });

      L.Marker.prototype.options.icon = defaultIcon;
    }
  }, []);

  // Get user's current location
  useEffect(() => {
    let mounted = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mounted) {
            const { latitude, longitude } = position.coords;
            setSelectedLocation({
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            });
            setIsLoading(false);
          }
        },
        () => {
          if (mounted) {
            // Default to Kathmandu, Nepal
            setSelectedLocation({
              lat: 27.7172,
              lng: 85.324,
              address: "Kathmandu, Nepal",
            });
            setIsLoading(false);
          }
        },
      );
    } else {
      if (mounted) {
        setSelectedLocation({
          lat: 27.7172,
          lng: 85.324,
          address: "Kathmandu, Nepal",
        });
        setIsLoading(false);
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a location");
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
      );

      if (!res.ok) throw new Error("Search failed");

      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;

      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const cityName = searchQuery.trim();

        // Update map center and searched city, but don't auto-select
        setSelectedLocation({ lat, lng, address: "" });
        setSearchedCity(cityName);
        toast.success(
          `Centered on ${cityName}. Click on map to select exact location.`,
        );
      } else {
        toast.error("Location not found. Try clicking on the map instead.");
      }
    } catch {
      toast.error("Search failed. Try clicking on the map instead.");
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading || !selectedLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-white">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="p-3 border-b border-gray-200">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Thamel, Kathmandu"
              className="w-full px-3 py-2 pl-9 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 font-medium text-sm"
          >
            {isSearching ? "..." : "GO"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          {searchedCity
            ? `Searching in ${searchedCity}. Click on map to select exact location.`
            : "Click on map to select location"}
        </p>
      </form>

      {/* Map */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={[selectedLocation.lat, selectedLocation.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{selectedLocation.address}</p>
                </div>
              </Popup>
            </Marker>
          )}
          <MapInteraction
            onLocationSelect={(lat, lng, address) => {
              setSelectedLocation({ lat, lng, address });
              setSearchedCity(null);
              onLocationSelect(lat, lng, address);
            }}
          />
          <SearchInteraction
            selectedLocation={selectedLocation}
            searchedCity={searchedCity}
          />
          <LocateMe />
        </MapContainer>
      </div>

      {/* Info footer */}
      <div className="p-2 bg-blue-50 border-t border-blue-200">
        <p className="text-xs text-blue-700 flex gap-2">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            {searchedCity
              ? `Showing ${searchedCity}. Click on map to pinpoint exact location.`
              : "Click on map to select your delivery location"}
          </span>
        </p>
      </div>
    </div>
  );
}
