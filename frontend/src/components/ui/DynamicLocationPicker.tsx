"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-55 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
    </div>
  ),
});

export default LocationPicker;
