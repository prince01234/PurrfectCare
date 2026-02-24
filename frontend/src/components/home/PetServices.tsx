"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Stethoscope, Scissors, GraduationCap, Home } from "lucide-react";

const services = [
  {
    name: "Veterinary",
    icon: Stethoscope,
    color: "bg-indigo-50",
    iconColor: "text-indigo-500",
    href: "/services/veterinary",
  },
  {
    name: "Grooming",
    icon: Scissors,
    color: "bg-pink-50",
    iconColor: "text-pink-500",
    href: "/services/grooming",
  },
  {
    name: "Training",
    icon: GraduationCap,
    color: "bg-purple-50",
    iconColor: "text-purple-500",
    href: "/services/training",
  },
  {
    name: "Pet Sitting",
    icon: Home,
    color: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/services/pet-sitting",
  },
];

export default function PetServices() {
  return (
    <div className="px-5 mt-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 font-bold text-lg">Pet Services</h2>
        <Link
          href="/services"
          className="text-teal-600 text-sm font-medium hover:text-teal-700"
        >
          View all
        </Link>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-4 gap-3">
        {services.map((service) => (
          <Link key={service.name} href={service.href}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center`}
              >
                <service.icon className={`w-6 h-6 ${service.iconColor}`} />
              </div>
              <span className="text-gray-700 text-xs font-medium text-center leading-tight">
                {service.name}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
