"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, ChevronRight, PawPrint } from "lucide-react";

import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/context/AuthContext";
import { petApi } from "@/lib/api";
import type { Pet } from "@/lib/api";

function getAge(pet: Pet): string {
  const age = pet.calculatedAge ?? pet.age;
  if (age === null || age === undefined) return "";
  if (age === 0) return "< 1 yr";
  // Handle fractional ages like 2.5
  if (age % 1 !== 0) {
    const years = Math.floor(age);
    const months = Math.round((age % 1) * 12);
    if (years === 0) return `${months} mo`;
    return `${years} yr${years > 1 ? "s" : ""} ${months} mo`;
  }
  if (age === 1) return "1 yr";
  return `${age} yrs`;
}

function getSpeciesEmoji(species: string) {
  switch (species) {
    case "dog":
      return "🐶";
    case "cat":
      return "🐱";
    case "bird":
      return "🐦";
    case "rabbit":
      return "🐰";
    case "hamster":
      return "🐹";
    case "fish":
      return "🐠";
    default:
      return "🐾";
  }
}

export default function PetsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const petsRes = await petApi.getPets({ limit: 50 });
      if (cancelled) return;
      if (petsRes.data) setPets(petsRes.data.pets);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="h-1 bg-linear-to-r from-teal-500 to-teal-400" />

      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Pets</h1>
        <Link
          href="/pets/add"
          className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 hover:bg-teal-100 transition-colors"
          aria-label="Add new pet"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {pets.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex gap-4 overflow-x-auto hide-scrollbar py-1">
            {pets.map((pet) => (
              <Link
                key={pet._id}
                href={`/pets/${pet._id}`}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-teal-500">
                  {pet.photos[0] ? (
                    <Image
                      src={pet.photos[0]}
                      alt={pet.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl">
                      {getSpeciesEmoji(pet.species)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {pet.name}
                </span>
              </Link>
            ))}

            <Link
              href="/pets/add"
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">Add</span>
            </Link>
          </div>
        </div>
      )}

      {pets.length > 0 && (
        <div className="px-5 pb-8 space-y-5">
          {pets.map((pet) => (
            <Link href={`/pets/${pet._id}`} key={pet._id}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {pet.photos[0] ? (
                      <Image
                        src={pet.photos[0]}
                        alt={pet.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {getSpeciesEmoji(pet.species)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900">
                      {pet.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {pet.breed ||
                        pet.species.charAt(0).toUpperCase() +
                          pet.species.slice(1)}
                    </p>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                        {pet.gender}
                      </span>
                      {getAge(pet) && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {getAge(pet)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      {pets.length === 0 && (
        <div className="px-5 pb-6">
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">
              No pets added yet
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Add your first pet to start tracking their health and care
            </p>
            <Link
              href="/pets/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-full text-sm font-semibold hover:bg-teal-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Pet
            </Link>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
