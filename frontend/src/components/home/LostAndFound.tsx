"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, MapPin, PawPrint } from "lucide-react";
import { motion } from "framer-motion";
import { lostFoundApi } from "@/lib/api/lostFound";
import type { LostFoundPost } from "@/lib/api/lostFound";

export default function LostAndFound() {
  const [posts, setPosts] = useState<LostFoundPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await lostFoundApi.getPosts({ limit: 4 });
        if (res.data) {
          setPosts(res.data.posts.slice(0, 4));
        }
      } catch {
        // silently fail on dashboard
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="px-5 mt-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-teal-600" />
          <h2 className="text-gray-900 font-bold text-lg">Lost & Found</h2>
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 p-2.5 flex min-h-16 items-center gap-3 bg-white animate-pulse"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 mt-8 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-teal-600" />
          <h2 className="text-gray-900 font-bold text-lg">Lost & Found</h2>
        </div>
        <Link
          href="/lost-and-found"
          className="text-teal-600 text-sm font-medium hover:text-teal-700"
        >
          View all
        </Link>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <Link
          href="/lost-and-found/create"
          className="block rounded-2xl border border-dashed border-slate-200 p-6 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
        >
          <PawPrint className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No active alerts</p>
          <p className="text-xs text-teal-600 font-medium mt-1">
            Report a lost or found pet
          </p>
        </Link>
      ) : (
        <div>
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/lost-and-found/${post._id}`}
              className="block mb-2 last:mb-0"
            >
              <motion.div
                whileTap={{ scale: 0.98 }}
                className={`rounded-2xl border p-2.5 flex min-h-16 items-center gap-3 shadow-sm hover:shadow-md transition-shadow ${
                  post.postType === "lost"
                    ? "border-orange-200 bg-orange-50/40"
                    : "border-teal-200 bg-teal-50/40"
                }`}
              >
                {/* Pet image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  {post.photos[0] ? (
                    <Image
                      src={post.photos[0]}
                      alt={post.petName || post.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PawPrint className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm text-gray-900 truncate pr-2">
                      {post.postType === "lost" ? "LOST" : "FOUND"}:{" "}
                      {(
                        post.petName || `Unknown ${post.species}`
                      ).toUpperCase()}
                    </p>
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(post.eventDate)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs mt-1 line-clamp-1">
                    {post.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-teal-600" />
                    <span className="text-gray-500 text-xs line-clamp-1">
                      {post.locationAddress || "Location unavailable"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
