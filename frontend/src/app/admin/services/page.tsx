"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, Plus, Save, Tag, X } from "lucide-react";
import toast from "react-hot-toast";

import AdminLayout from "@/components/layout/AdminLayout";
import { serviceProviderApi } from "@/lib/api/service";
import type { ServiceOption, ServiceProvider } from "@/lib/api/service";

const VETERINARY_CATEGORIES = [
  "consultation",
  "vaccination",
  "diagnostic",
  "surgery",
  "dental",
  "deworming",
  "other",
];

const normalizeText = (value?: string | null) => value?.trim() || null;

export default function AdminServicesPage() {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isVeterinary = provider?.serviceType === "veterinary";

  useEffect(() => {
    const fetchProvider = async () => {
      setIsLoading(true);
      const res = await serviceProviderApi.getMyProvider();

      if (res.data) {
        setProvider(res.data);
        setServiceOptions(
          res.data.serviceOptions.map((option) => ({
            ...option,
            description: option.description || "",
            serviceCategory: option.serviceCategory || "",
            vaccineType: option.vaccineType || "",
            veterinarian: option.veterinarian || "",
          })),
        );
      }

      setIsLoading(false);
    };

    fetchProvider();
  }, []);

  const addServiceOption = () => {
    setServiceOptions((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        price: null,
        duration: null,
        serviceCategory: isVeterinary ? "consultation" : "",
        vaccineType: "",
        veterinarian: "",
      },
    ]);
  };

  const updateServiceOption = (
    index: number,
    field: keyof ServiceOption,
    value: string | number | null,
  ) => {
    setServiceOptions((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, [field]: value } : option,
      ),
    );
  };

  const removeServiceOption = (index: number) => {
    setServiceOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const normalizeServiceOptions = (options: ServiceOption[]) =>
    options.map((option) => ({
      ...(option._id ? { _id: option._id } : {}),
      name: option.name.trim(),
      description: normalizeText(option.description),
      price: option.price ?? null,
      duration: option.duration ?? null,
      serviceCategory: normalizeText(option.serviceCategory),
      vaccineType: normalizeText(option.vaccineType),
      veterinarian: normalizeText(option.veterinarian),
    }));

  const handleSave = async () => {
    if (!provider) {
      toast.error("Complete profile setup first");
      return;
    }

    const hasEmptyNames = serviceOptions.some((option) => !option.name.trim());
    if (hasEmptyNames) {
      toast.error("Each service option needs a name");
      return;
    }

    setIsSaving(true);
    const payload = {
      serviceOptions: normalizeServiceOptions(serviceOptions),
    };

    const res = await serviceProviderApi.updateProvider(payload);
    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      toast.success("Service options updated");
      setProvider(res.data);
      setServiceOptions(
        res.data.serviceOptions.map((option) => ({
          ...option,
          description: option.description || "",
          serviceCategory: option.serviceCategory || "",
          vaccineType: option.vaccineType || "",
          veterinarian: option.veterinarian || "",
        })),
      );
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
          <div className="rounded-2xl bg-white border border-gray-100 p-5 space-y-3 animate-pulse">
            <div className="h-10 rounded-xl bg-gray-100" />
            <div className="h-10 rounded-xl bg-gray-100" />
            <div className="h-10 rounded-xl bg-gray-100" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900">Service Options</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add and maintain service packages visible to customers
          </p>
        </motion.div>

        {!provider ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Profile setup required
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Set up your service profile before adding packages.
                </p>
              </div>
            </div>
            <Link
              href="/admin/profile"
              className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
            >
              Go to Profile Setup
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-teal-500" />
                  Service Options / Packages
                </h3>
                <button
                  type="button"
                  onClick={addServiceOption}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {serviceOptions.length === 0 && (
                <p className="py-2 text-center text-sm text-gray-400">
                  No service options yet. Add one to describe what you offer.
                </p>
              )}

              <AnimatePresence mode="popLayout">
                {serviceOptions.map((option, index) => (
                  <motion.div
                    key={option._id || index}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="rounded-xl border border-gray-200 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-gray-400">
                        Service #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeServiceOption(index)}
                        className="rounded-lg p-1 text-red-400 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) =>
                          updateServiceOption(index, "name", e.target.value)
                        }
                        placeholder="e.g. General Checkup"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Description
                      </label>
                      <input
                        type="text"
                        value={option.description || ""}
                        onChange={(e) =>
                          updateServiceOption(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Brief description"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Price (Rs.)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={option.price ?? ""}
                          onChange={(e) =>
                            updateServiceOption(
                              index,
                              "price",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          placeholder="500"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          min={5}
                          value={option.duration ?? ""}
                          onChange={(e) =>
                            updateServiceOption(
                              index,
                              "duration",
                              e.target.value
                                ? parseInt(e.target.value, 10)
                                : null,
                            )
                          }
                          placeholder="30"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {isVeterinary && (
                      <div className="space-y-3 rounded-lg border border-teal-100 bg-teal-50/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                          Veterinary Listing Details
                        </p>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">
                            Category
                          </label>
                          <select
                            value={option.serviceCategory || "consultation"}
                            onChange={(e) =>
                              updateServiceOption(
                                index,
                                "serviceCategory",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
                          >
                            {VETERINARY_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category.charAt(0).toUpperCase() +
                                  category.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {(option.serviceCategory || "") === "vaccination" && (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Vaccine Type
                            </label>
                            <input
                              type="text"
                              value={option.vaccineType || ""}
                              onChange={(e) =>
                                updateServiceOption(
                                  index,
                                  "vaccineType",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g. Rabies, DHPP, FVRCP"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
                            />
                          </div>
                        )}

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">
                            Veterinarian / Doctor
                          </label>
                          <input
                            type="text"
                            value={option.veterinarian || ""}
                            onChange={(e) =>
                              updateServiceOption(
                                index,
                                "veterinarian",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Dr. Shrestha"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 py-3.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <Save className="w-4.5 h-4.5" />
                )}
                {isSaving ? "Saving..." : "Save Service Options"}
              </button>
            </motion.div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
