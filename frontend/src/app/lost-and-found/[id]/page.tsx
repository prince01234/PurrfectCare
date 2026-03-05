"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  PawPrint,
  Palette,
  Tag,
  ChevronLeft,
  ChevronRight,
  Share2,
  Loader2,
  Trash2,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import StartChatButton from "@/components/chat/StartChatButton";
import DynamicMapModal from "@/components/ui/DynamicMapModal";
import type { MapMarker } from "@/components/ui/DynamicMapModal";
import { useAuth } from "@/context/AuthContext";
import { lostFoundApi } from "@/lib/api/lostFound";
import type { LostFoundPost } from "@/lib/api/lostFound";

export default function LostFoundDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();

  const [post, setPost] = useState<LostFoundPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?._id === post?.createdBy?._id;
  const isLost = post?.postType === "lost";
  const accentColor = isLost ? "red" : "emerald";

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await lostFoundApi.getPostById(postId);
        if (res.data) {
          setPost(res.data);
        } else {
          toast.error(res.error || "Post not found");
          router.replace("/lost-and-found");
        }
      } catch {
        toast.error("Failed to load post");
        router.replace("/lost-and-found");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [postId, router]);

  const handleStatusUpdate = async () => {
    if (!post) return;
    setIsUpdatingStatus(true);
    try {
      const res = await lostFoundApi.updatePostStatus(post._id, "resolved");
      if (res.data) {
        setPost(res.data);
        toast.success(
          isLost
            ? "Glad your pet is back! Post marked as resolved."
            : "Great news! Post marked as resolved.",
        );
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    setIsDeleting(true);
    try {
      const res = await lostFoundApi.deletePost(post._id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Post deleted");
        router.replace("/lost-and-found");
      }
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const mapMarkers: MapMarker[] =
    post?.latitude && post?.longitude
      ? [
          {
            id: post._id,
            latitude: post.latitude,
            longitude: post.longitude,
            title: post.petName || post.title,
            subtitle: post.locationAddress,
            description: `${isLost ? "🔴 Lost" : "🟢 Found"} • ${post.species}`,
            type: isLost ? "lost_pet" : "found_pet",
            photo: post.photos[0],
          },
        ]
      : [];

  // --- Loading skeleton ---
  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="min-h-screen bg-gray-50 animate-pulse">
          <div className="w-full aspect-square bg-gray-200" />
          <div className="px-5 py-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!post) return null;

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gray-50 pb-28">
        {/* ── Hero Photo Section ── */}
        <div className="relative w-full aspect-square bg-gray-100">
          {post.photos.length > 0 ? (
            <>
              <Image
                src={post.photos[activePhoto]}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />

              {/* Photo navigation */}
              {post.photos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActivePhoto((prev) =>
                        prev === 0 ? post.photos.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActivePhoto((prev) =>
                        prev === post.photos.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {post.photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === activePhoto ? "bg-white w-4" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PawPrint className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Overlay header buttons */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }}
              className="w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Status badge */}
          <div className="absolute bottom-3 left-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow ${
                isLost ? "bg-red-500" : "bg-emerald-500"
              }`}
            >
              {isLost ? "LOST" : "FOUND"}
            </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-5 py-5 space-y-5">
          {/* Title + location */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {post.petName ? `${post.petName}` : `Unknown ${post.species}`}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {post.locationAddress}
              </span>
            </div>
          </div>

          {/* Status + resolve/delete buttons for owner */}
          <div
            className={`rounded-2xl p-4 ${
              post.status === "resolved"
                ? "bg-gray-50 border border-gray-200"
                : isLost
                  ? "bg-red-50 border border-red-100"
                  : "bg-emerald-50 border border-emerald-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    post.status === "resolved"
                      ? "text-gray-600"
                      : isLost
                        ? "text-red-600"
                        : "text-emerald-600"
                  }`}
                >
                  {post.status === "resolved"
                    ? "Resolved"
                    : isLost
                      ? "Still Missing"
                      : "Waiting for Owner"}
                </p>
              </div>

              {isOwner && post.status === "active" && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdatingStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
                    isLost
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  {isLost ? "Mark as Returned" : "Mark as Resolved"}
                </button>
              )}
            </div>

            {post.status === "resolved" && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                This post has been resolved
              </div>
            )}
          </div>

          {/* Map section */}
          {post.latitude && post.longitude && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {isLost ? "Last Seen Location" : "Found Location"}
              </h3>
              <button
                onClick={() => setShowMap(true)}
                className="w-full h-40 rounded-2xl overflow-hidden bg-gray-100 relative border border-gray-200 group"
              >
                {/* Static map thumbnail using a placeholder until map opens */}
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50">
                  <div className="text-center">
                    <MapPin
                      className={`w-8 h-8 mx-auto mb-1 ${
                        isLost ? "text-red-400" : "text-emerald-400"
                      }`}
                    />
                    <p className="text-xs text-gray-500 font-medium">
                      Tap to view map
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-2xl" />
              </button>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon={<Calendar className="w-4 h-4" />}
              label={isLost ? "Date Lost" : "Date Found"}
              value={formatDate(post.eventDate)}
              accent={accentColor}
            />
            <InfoCard
              icon={<PawPrint className="w-4 h-4" />}
              label="Species"
              value={
                post.species.charAt(0).toUpperCase() + post.species.slice(1)
              }
              accent={accentColor}
            />
            {post.breed && (
              <InfoCard
                icon={<Tag className="w-4 h-4" />}
                label="Breed"
                value={post.breed}
                accent={accentColor}
              />
            )}
            {post.color && (
              <InfoCard
                icon={<Palette className="w-4 h-4" />}
                label="Color"
                value={post.color}
                accent={accentColor}
              />
            )}
          </div>

          {/* Reward */}
          {post.reward && isLost && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                  Reward Offered
                </p>
                <p className="text-lg font-bold text-amber-800">
                  ${post.reward}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {post.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {post.description}
              </p>
            </div>
          )}

          {/* Posted by */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Posted by</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                {post.createdBy?.profileImage ? (
                  <Image
                    src={post.createdBy.profileImage}
                    alt={post.createdBy.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                    {post.createdBy?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {post.createdBy?.name || "Unknown"}
                </p>
                <p className="text-xs text-gray-400">
                  Posted {formatDate(post.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/lost-and-found/edit/${post._id}`)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Post
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom CTA ── */}
        {!isOwner && post.status === "active" && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur border-t border-gray-100 px-5 py-4 max-w-md mx-auto">
            <StartChatButton
              recipientId={post.createdBy?._id || ""}
              context="lost_found"
              contextRef={post._id}
              label={isLost ? "Contact Owner" : "Contact Finder"}
              className={`w-full! justify-center! py-3.5! rounded-2xl! text-base! font-semibold! ${
                isLost
                  ? "bg-red-500! hover:bg-red-600! text-white!"
                  : "bg-emerald-500! hover:bg-emerald-600! text-white!"
              }`}
              variant="primary"
            />
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Delete Post</h3>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                Are you sure you want to delete this post? This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDeleting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Map Modal ── */}
        <DynamicMapModal
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          markers={mapMarkers}
          title={isLost ? "Last Seen Location" : "Found Location"}
          focusMarkerId={post._id}
          center={
            post.latitude && post.longitude
              ? [post.latitude, post.longitude]
              : undefined
          }
          zoom={15}
        />
      </div>
    </MobileLayout>
  );
}

// ── Info Card Component ──
function InfoCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  const bgMap: Record<string, string> = {
    red: "bg-red-50",
    emerald: "bg-emerald-50",
  };
  const iconBgMap: Record<string, string> = {
    red: "bg-red-100 text-red-500",
    emerald: "bg-emerald-100 text-emerald-500",
  };

  return (
    <div
      className={`${bgMap[accent] || "bg-gray-50"} rounded-2xl p-3.5 border border-gray-100`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${iconBgMap[accent] || "bg-gray-100 text-gray-500"}`}
        >
          {icon}
        </div>
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800 ml-8">{value}</p>
    </div>
  );
}
