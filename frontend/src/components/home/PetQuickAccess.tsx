"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface Pet {
  id: string;
  name: string;
  image: string;
  nextVetDate?: string;
}

interface PetQuickAccessProps {
  pets: Pet[];
}

export default function PetQuickAccess({ pets }: PetQuickAccessProps) {
  if (pets.length === 0) {
    return (
      <div className="px-5 mt-5">
        <Link href="/pets/add">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 flex items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
              <span className="text-teal-500 text-xl font-bold">+</span>
            </div>
            <div>
              <p className="text-gray-700 font-medium text-sm">
                Add your first pet
              </p>
              <p className="text-gray-400 text-xs">
                Track health, vet visits & more
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </motion.div>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 mt-5 space-y-3">
      {pets.map((pet) => (
        <Link key={pet.id} href={`/pets/${pet.id}`}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 shrink-0">
              <Image
                src={pet.image}
                alt={pet.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-semibold text-base">
                {pet.name}
              </p>
              {pet.nextVetDate && (
                <p className="text-gray-500 text-sm">
                  Next Vet:{" "}
                  <span className="text-teal-600 font-medium">
                    {pet.nextVetDate}
                  </span>
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
