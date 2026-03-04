"use client";

import React, { useEffect, useRef } from "react";
import { X, Navigation, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Types ──
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  description?: string;
  type?: string;
  icon?: string;
  photo?: string;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  markers: MapMarker[];
  title?: string;
  /** Center of the map. Defaults to Kathmandu, Nepal */
  center?: [number, number];
  zoom?: number;
  /** If provided, highlight and center on this specific marker */
  focusMarkerId?: string;
  /** If provided, show user's location on the map */
  userLocation?: { lat: number; lng: number } | null;
}

// Service-type → emoji mapping for marker icons
const SERVICE_EMOJIS: Record<string, string> = {
  veterinary: "🩺",
  grooming: "✂️",
  training: "🎓",
  pet_sitting: "🏠",
  pet_adoption: "🐾",
  other: "📦",
  adoption_listing: "🐶",
};

// Service type → friendly label
const SERVICE_LABELS: Record<string, string> = {
  veterinary: "Veterinary",
  grooming: "Grooming",
  training: "Training",
  pet_sitting: "Pet Sitting",
  pet_adoption: "Pet Adoption",
  other: "Other Service",
  adoption_listing: "Adoption",
};

// Create a custom Leaflet divIcon with emoji
const createEmojiIcon = (emoji: string, isHighlighted = false) => {
  return L.divIcon({
    html: `<div style="
      font-size: ${isHighlighted ? "28px" : "22px"};
      width: ${isHighlighted ? "44px" : "36px"};
      height: ${isHighlighted ? "44px" : "36px"};
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${isHighlighted ? "#0d9488" : "white"};
      border: 2px solid ${isHighlighted ? "#0d9488" : "#d1d5db"};
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      ${isHighlighted ? "z-index: 1000;" : ""}
    ">${emoji}</div>`,
    className: "custom-emoji-marker",
    iconSize: [isHighlighted ? 44 : 36, isHighlighted ? 44 : 36],
    iconAnchor: [isHighlighted ? 22 : 18, isHighlighted ? 44 : 36],
    popupAnchor: [0, isHighlighted ? -46 : -38],
  });
};

export default function MapModal({
  isOpen,
  onClose,
  markers,
  title = "Map View",
  center = [27.7172, 85.324], // Kathmandu, Nepal
  zoom = 13,
  focusMarkerId,
  userLocation,
}: MapModalProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Small delay to ensure the DOM container is rendered
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      // Add tile layer (OpenStreetMap - free, no API key)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control to bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Add markers
      const leafletMarkers: L.Marker[] = [];

      markers.forEach((marker) => {
        const isHighlighted = focusMarkerId === marker.id;
        const emoji = SERVICE_EMOJIS[marker.type || "other"] || "📍";
        const icon = createEmojiIcon(emoji, isHighlighted);
        const label = SERVICE_LABELS[marker.type || "other"] || marker.type;

        const popupContent = `
          <div style="min-width: 180px; max-width: 240px; font-family: system-ui, sans-serif;">
            ${
              marker.photo
                ? `<img src="${marker.photo}" alt="${marker.title}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />`
                : ""
            }
            <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 2px;">
              ${marker.title}
            </div>
            ${
              marker.subtitle
                ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${marker.subtitle}</div>`
                : ""
            }
            <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 8px; background: #f0fdfa; color: #0d9488; border-radius: 999px; font-weight: 500;">
              ${emoji} ${label}
            </div>
            ${
              marker.description
                ? `<div style="font-size: 12px; color: #6b7280; margin-top: 6px;">${marker.description}</div>`
                : ""
            }
          </div>
        `;

        const leafletMarker = L.marker([marker.latitude, marker.longitude], {
          icon,
        })
          .addTo(map)
          .bindPopup(popupContent, {
            closeButton: true,
            maxWidth: 260,
            className: "custom-popup",
          });

        if (isHighlighted) {
          leafletMarker.openPopup();
        }

        leafletMarkers.push(leafletMarker);
      });

      // Add user location marker if available
      if (userLocation) {
        const userIcon = L.divIcon({
          html: `<div style="
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 2px #3b82f6, 0 2px 6px rgba(59,130,246,0.4);
          "></div>`,
          className: "user-location-marker",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup(
            `<div style="font-family: system-ui, sans-serif; text-align: center; padding: 2px 4px;">
              <div style="font-size: 13px; font-weight: 600; color: #3b82f6;">📍 Your Location</div>
            </div>`,
            { closeButton: false, maxWidth: 160 },
          );

        leafletMarkers.push(userMarker);
      }

      // Fit bounds if multiple markers and no specific focus
      if (markers.length > 1 && !focusMarkerId) {
        const group = L.featureGroup(leafletMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
      } else if (focusMarkerId) {
        const focused = markers.find((m) => m.id === focusMarkerId);
        if (focused) {
          map.setView([focused.latitude, focused.longitude], 15);
        }
      }

      mapRef.current = map;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, markers, center, zoom, focusMarkerId, userLocation]);

  // Locate user
  const handleLocateUser = () => {
    if (!mapRef.current) return;
    mapRef.current.locate({ setView: true, maxZoom: 15 });
    mapRef.current.on("locationfound", (e: L.LocationEvent) => {
      L.circleMarker(e.latlng, {
        radius: 8,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(mapRef.current!);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "80vh", maxHeight: "700px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-500" />
                <h2 className="text-base font-bold text-gray-800">{title}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {markers.length} location{markers.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Map */}
            <div className="relative flex-1">
              <div
                ref={mapContainerRef}
                className="w-full h-full"
                style={{ minHeight: "300px" }}
              />

              {/* Locate me button */}
              <button
                onClick={handleLocateUser}
                className="absolute top-3 left-3 z-1000 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-200"
                title="My Location"
              >
                <Navigation className="w-4 h-4 text-blue-500" />
              </button>

              {/* Legend */}
              {markers.length > 0 && (
                <div className="absolute bottom-3 left-3 z-1000 bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 border border-gray-100">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {Array.from(
                      new Set(markers.map((m) => m.type || "other")),
                    ).map((type) => (
                      <div
                        key={type}
                        className="flex items-center gap-1 text-[11px] text-gray-600"
                      >
                        <span>{SERVICE_EMOJIS[type] || "📍"}</span>
                        <span>{SERVICE_LABELS[type] || type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
