"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface LostFoundPost {
  id: string;
  type: "lost" | "found";
  petName: string;
  description: string;
  location: string;
  date: string;
  image: string;
}

interface LostAndFoundProps {
  posts: LostFoundPost[];
}

export default function LostAndFound({ posts }: LostAndFoundProps) {
  return (
    <div className="px-5 mt-7 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-gray-900 font-bold text-lg">Lost & Found</h2>
        </div>
        <Link
          href="/lost-and-found"
          className="text-teal-600 text-sm font-medium hover:text-teal-700"
        >
          View
        </Link>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/lost-and-found/${post.id}`}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className={`rounded-2xl border p-4 flex gap-3 ${
                post.type === "lost"
                  ? "border-red-200 bg-red-50/50"
                  : "border-green-200 bg-green-50/50"
              }`}
            >
              {/* Pet image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                <Image
                  src={post.image}
                  alt={post.petName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`font-bold text-sm ${
                      post.type === "lost" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {post.type === "lost" ? "LOST" : "FOUND"}:{" "}
                    {post.petName.toUpperCase()}
                  </p>
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {post.date}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500 text-xs">{post.location}</span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
