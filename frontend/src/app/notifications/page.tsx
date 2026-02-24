"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultSettings: NotificationSetting[] = [
  {
    id: "reminders",
    label: "Pet Reminders",
    description: "Notifications for pet health reminders",
    enabled: true,
  },
  {
    id: "orders",
    label: "Order Updates",
    description: "Updates about your orders and deliveries",
    enabled: true,
  },
  {
    id: "messages",
    label: "Messages",
    description: "Messages from service providers",
    enabled: true,
  },
  {
    id: "promotions",
    label: "Promotions",
    description: "Special offers and promotions",
    enabled: false,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [settings, setSettings] =
    useState<NotificationSetting[]>(defaultSettings);

  const toggleSetting = (id: string) => {
    setSettings(
      settings.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting,
      ),
    );
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Notifications</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{setting.label}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {setting.description}
                </p>
              </div>
              <button
                onClick={() => toggleSetting(setting.id)}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                  setting.enabled ? "bg-teal-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    setting.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
