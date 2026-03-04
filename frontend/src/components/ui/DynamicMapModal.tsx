"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./MapModal";

// Dynamically import MapModal with SSR disabled (Leaflet needs window/document)
const MapModal = dynamic(() => import("./MapModal"), {
  ssr: false,
  loading: () => null,
});

export default MapModal;
export type { MapMarker };
