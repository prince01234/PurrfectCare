"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Calendar, Camera, Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/context/AuthContext";
import { lostFoundApi } from "@/lib/api/lostFound";
import type { LostFoundPost } from "@/lib/api/lostFound";

const SPECIES_OPTIONS = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "rabbit", label: "Rabbit" },
  { value: "hamster", label: "Hamster" },
  { value: "fish", label: "Fish" },
  { value: "other", label: "Other" },
];

export default function EditLostFoundPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();

  const [post, setPost] = useState<LostFoundPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [species, setSpecies] = useState("");
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [reward, setReward] = useState("");

  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  const isLost = post?.postType === "lost";

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      const res = await lostFoundApi.getPostById(postId);
      if (!res.data) {
        toast.error(res.error || "Post not found");
        router.replace("/lost-and-found");
        return;
      }

      const loadedPost = res.data;
      setPost(loadedPost);

      setSpecies(loadedPost.species || "");
      setPetName(loadedPost.petName || "");
      setBreed(loadedPost.breed || "");
      setColor(loadedPost.color || "");
      setDescription(loadedPost.description || "");
      setLocationAddress(loadedPost.locationAddress || "");
      setEventDate(loadedPost.eventDate?.split("T")[0] || "");
      setReward(
        loadedPost.reward !== null && loadedPost.reward !== undefined
          ? String(loadedPost.reward)
          : "",
      );

      setIsLoading(false);
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, router]);

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(newPhotoPreviews[index]);
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !post) return;

    const remainingSlots = Math.max(
      0,
      5 - post.photos.length - newPhotos.length,
    );
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 photos allowed");
      return;
    }

    const selected = Array.from(files).slice(0, remainingSlots);
    setNewPhotos((prev) => [...prev, ...selected]);
    setNewPhotoPreviews((prev) => [
      ...prev,
      ...selected.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const handleSave = async () => {
    if (!post) return;
    if (!user || user._id !== post.createdBy?._id) {
      toast.error("You are not allowed to edit this post");
      return;
    }

    if (!species || !locationAddress || !eventDate) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("species", species);
      formData.append("locationAddress", locationAddress.trim());
      formData.append("eventDate", eventDate);

      if (petName.trim()) formData.append("petName", petName.trim());
      if (breed.trim()) formData.append("breed", breed.trim());
      if (color.trim()) formData.append("color", color.trim());
      if (description.trim())
        formData.append("description", description.trim());
      if (isLost && reward.trim()) formData.append("reward", reward.trim());

      newPhotos.forEach((photo) => formData.append("photos", photo));

      const res = await lostFoundApi.updatePost(post._id, formData);
      if (!res.data) {
        toast.error(res.error || "Failed to update post");
        return;
      }

      toast.success("Post updated");
      router.replace(`/lost-and-found/${post._id}`);
    } catch {
      toast.error("Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </div>
      </MobileLayout>
    );
  }

  if (!post) return null;

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-slate-50 pb-28">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="px-5 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Edit Post</h1>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Species
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SPECIES_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSpecies(option.value)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition ${
                    species === option.value
                      ? "bg-teal-50 border-teal-300 text-teal-700"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Breed
              </label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-300 bg-white"
                placeholder="e.g. Persian"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-300 bg-white"
                placeholder="e.g. Black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Pet Name
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-300 bg-white"
              placeholder="Pet name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-300 bg-white"
                placeholder="Location"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-300 bg-white"
              />
            </div>
          </div>

          {isLost && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Reward
              </label>
              <input
                type="number"
                min="0"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-300 bg-white"
                placeholder="Optional amount"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-300 bg-white resize-none"
              placeholder="Add helpful details"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Photos
            </label>

            {post.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {post.photos.map((photo, index) => (
                  <div
                    key={`${photo}-${index}`}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-100"
                  >
                    <Image
                      src={photo}
                      alt={`Existing photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {newPhotoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {newPhotoPreviews.map((preview, index) => (
                  <div
                    key={preview}
                    className="relative aspect-square rounded-xl overflow-hidden border border-teal-200"
                  >
                    <Image
                      src={preview}
                      alt={`New photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-teal-300 bg-teal-50 text-teal-700 text-sm font-medium cursor-pointer">
              <Camera className="w-4 h-4" />
              Add more photos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewPhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100 px-5 py-4 max-w-md mx-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
