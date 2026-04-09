"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  reverseGeocode: (lat: number, lng: number) => Promise<string>;
}

interface MapClickEvent {
  latlng: {
    lat: number;
    lng: number;
  };
}

export default function MapClickHandler({
  onLocationSelect,
  reverseGeocode,
}: MapClickHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: MapClickEvent) => {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, address);
      map.setView([lat, lng], 17);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onLocationSelect, reverseGeocode]);

  return null;
}
