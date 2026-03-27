"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Shield,
  Smile,
  AlertTriangle,
  Send,
  Loader2,
  X,
  Phone,
  Mail,
  Home,
  PawPrint,
  Baby,
  FileText,
  Share2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/context/AuthContext";
import { adoptionListingApi, adoptionApplicationApi } from "@/lib/api/adoption";
import { userApi } from "@/lib/api/user";
import type { AdoptionListing } from "@/lib/api/adoption";
import StartChatButton from "@/components/chat/StartChatButton";
import DynamicMapModal from "@/components/ui/DynamicMapModal";
import { useGeolocation, getDistanceKm } from "@/lib/hooks/useGeolocation";

const LIVING_OPTIONS = [
  { value: "house_with_yard", label: "House with yard" },
  { value: "house_without_yard", label: "House without yard" },
  { value: "apartment", label: "Apartment" },
  { value: "farm", label: "Farm" },
  { value: "other", label: "Other" },
];

// Simple markdown-like text renderer
function RichText({ content, className = "" }: { content: string; className?: string }) {
  // Convert markdown-like syntax to HTML
  const renderContent = () => {
    if (!content) return null;
    
    // Split by paragraphs (double newlines)
    const paragraphs = content.split(/\n\n+/);
    
    return paragraphs.map((paragraph, pIdx) => {
      // Process each line in the paragraph
      const lines = paragraph.split('\n');
      
      return (
        <div key={pIdx} className={pIdx > 0 ? "mt-3" : ""}>
          {lines.map((line, lIdx) => {
            // Check for headers
            if (line.startsWith('### ')) {
              return <h4 key={lIdx} className="font-semibold text-gray-800 mt-2">{line.slice(4)}</h4>;
            }
            if (line.startsWith('## ')) {
              return <h3 key={lIdx} className="font-bold text-gray-900 mt-2">{line.slice(3)}</h3>;
            }
            if (line.startsWith('# ')) {
              return <h2 key={lIdx} className="text-lg font-bold text-gray-900 mt-2">{line.slice(2)}</h2>;
            }
            
            // Check for bullet points
            if (line.match(/^[-*•]\s/)) {
              return (
                <div key={lIdx} className="flex gap-2 ml-2">
                  <span className="text-teal-500">•</span>
                  <span>{processInlineStyles(line.slice(2))}</span>
                </div>
              );
            }
            
            // Check for numbered lists
            const numberedMatch = line.match(/^(\d+)\.\s/);
            if (numberedMatch) {
              return (
                <div key={lIdx} className="flex gap-2 ml-2">
                  <span className="text-teal-500 font-medium">{numberedMatch[1]}.</span>
                  <span>{processInlineStyles(line.slice(numberedMatch[0].length))}</span>
                </div>
              );
            }
            
            // Regular text
            if (line.trim()) {
              return <p key={lIdx}>{processInlineStyles(line)}</p>;
            }
            return null;
          })}
        </div>
      );
    });
  };

  // Process bold, italic, and other inline styles
  const processInlineStyles = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Italic *text* or _text_
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);
      
      if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
        if (boldMatch.index! > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
      } else if (italicMatch) {
        if (italicMatch.index! > 0) {
          parts.push(remaining.slice(0, italicMatch.index));
        }
        parts.push(<em key={key++} className="italic">{italicMatch[1] || italicMatch[2]}</em>);
        remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }
    
    return parts.length > 0 ? parts : text;
  };

  return <div className={`space-y-1 ${className}`}>{renderContent()}</div>;
}

// Local storage favorites helper
const FAVORITES_KEY = "purrfectcare_adoption_favorites";

const getFavorites = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const toggleFavorite = (listingId: string): boolean => {
  const favorites = getFavorites();
  const index = favorites.indexOf(listingId);
  if (index > -1) {
    favorites.splice(index, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return false;
  } else {
    favorites.push(listingId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  }
};

export default function AdoptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { user } = useAuth();

  const [listing, setListing] = useState<AdoptionListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const userCoords = useGeolocation();
  
  // Touch handling for swipe
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Check if listing is favorited on mount
  useEffect(() => {
    setIsFavorited(getFavorites().includes(listingId));
  }, [listingId]);

  const [formData, setFormData] = useState({
    message: "",
    contactPhone: "",
    contactEmail: "",
    livingSituation: "",
    hasOtherPets: false,
    otherPetsDetails: "",
    hasChildren: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form with user details
  useEffect(() => {
    if (!user?._id) return;
    const loadUserDetails = async () => {
      try {
        const res = await userApi.getUserById(user._id);
        const u = res.data as Record<string, unknown> | undefined;
        if (u) {
          setFormData((prev) => ({
            ...prev,
            contactEmail: prev.contactEmail || (u.email as string) || "",
            contactPhone: prev.contactPhone || (u.phoneNumber as string) || "",
          }));
        }
      } catch {
        // fallback to context email
        setFormData((prev) => ({
          ...prev,
          contactEmail: prev.contactEmail || user.email || "",
        }));
      }
    };
    loadUserDetails();
  }, [user?._id, user?.email]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await adoptionListingApi.getListingById(listingId);
        if (res.data) {
          setListing(res.data);
        } else {
          toast.error("Listing not found");
          router.push("/adopt");
        }
      } catch {
        toast.error("Failed to load listing");
      } finally {
        setIsLoading(false);
      }
    };
    fetchListing();
  }, [listingId, router]);

  // Check if user already applied
  useEffect(() => {
    if (!user) return;
    const checkApplication = async () => {
      const res = await adoptionApplicationApi.getMyApplications();
      if (res.data?.applications) {
        const existing = res.data.applications.find(
          (a) =>
            (typeof a.listingId === "string"
              ? a.listingId
              : a.listingId._id) === listingId,
        );
        if (existing) setHasApplied(true);
      }
    };
    checkApplication();
  }, [user, listingId]);

  const formatAge = (months: number) => {
    if (months < 1) return "Less than a month";
    if (months < 12) return `${months} month${months > 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (rem === 0) return `${years} year${years > 1 ? "s" : ""}`;
    return `${years} yr${years > 1 ? "s" : ""} ${rem} mo`;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.message.trim() || formData.message.trim().length < 20)
      e.message = "Message must be at least 20 characters";
    if (!formData.contactPhone.trim())
      e.contactPhone = "Phone number is required";
    if (!formData.contactEmail.trim()) e.contactEmail = "Email is required";
    if (!formData.livingSituation)
      e.livingSituation = "Living situation is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApply = async () => {
    if (!user) {
      toast.error("Please login to apply");
      router.push("/login");
      return;
    }
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const res = await adoptionApplicationApi.createApplication(listingId, {
        message: formData.message,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        livingSituation: formData.livingSituation,
        hasOtherPets: formData.hasOtherPets,
        otherPetsDetails: formData.hasOtherPets
          ? formData.otherPetsDetails
          : undefined,
        hasChildren: formData.hasChildren,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Application submitted successfully!");
      setShowApplyForm(false);
      setHasApplied(true);
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const nextPhoto = useCallback(() => {
    if (listing?.photos) setActivePhoto((p) => (p + 1) % listing.photos.length);
  }, [listing?.photos]);
  
  const prevPhoto = useCallback(() => {
    if (listing?.photos)
      setActivePhoto(
        (p) => (p - 1 + listing.photos.length) % listing.photos.length,
      );
  }, [listing?.photos]);

  // Handle swipe gesture for photos
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!listing?.photos || listing.photos.length <= 1) return;
      
      const threshold = 50;
      const velocity = info.velocity.x;
      const offset = info.offset.x;
      
      if (offset < -threshold || velocity < -500) {
        nextPhoto();
      } else if (offset > threshold || velocity > 500) {
        prevPhoto();
      }
      setIsDragging(false);
    },
    [listing?.photos, nextPhoto, prevPhoto]
  );

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    const newState = toggleFavorite(listingId);
    setIsFavorited(newState);
    toast.success(newState ? "Added to favorites" : "Removed from favorites", {
      icon: newState ? "❤️" : "💔",
      duration: 2000,
    });
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: `Adopt ${listing?.name}`,
      text: `Check out ${listing?.name} available for adoption!`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setJustCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setJustCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        // User didn't cancel, try clipboard fallback
        try {
          await navigator.clipboard.writeText(window.location.href);
          setJustCopied(true);
          toast.success("Link copied to clipboard!");
          setTimeout(() => setJustCopied(false), 2000);
        } catch {
          toast.error("Failed to share");
        }
      }
    }
  };

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      </MobileLayout>
    );
  }

  if (!listing) return null;

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gray-50 pb-28">
        {/* Photo Gallery — swipeable for mobile */}
        <div className="relative h-[55vh] min-h-85 bg-gray-200 overflow-hidden" ref={containerRef}>
          {listing.photos?.length > 0 ? (
            <motion.div
              className="relative w-full h-full cursor-grab active:cursor-grabbing"
              drag={listing.photos.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activePhoto}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={listing.photos[activePhoto]}
                    alt={listing.name}
                    fill
                    className="object-cover pointer-events-none select-none"
                    sizes="(max-width: 32rem) 100vw, 32rem"
                    priority
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-teal-50 to-teal-100">
              <span className="text-7xl">🐾</span>
            </div>
          )}

          {/* Top gradient overlay for readability */}
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/30 to-transparent pointer-events-none" />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Right action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              {justCopied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Share2 className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={handleFavoriteToggle}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorited ? "fill-pink-500 text-pink-500" : "text-gray-400"
                }`}
              />
            </button>
          </div>

          {/* Photo indicators - progress bar style */}
          {listing.photos?.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 px-6 z-10">
              <div className="flex justify-center gap-1.5">
                {listing.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className="flex-1 max-w-12 h-1 rounded-full overflow-hidden bg-white/30 backdrop-blur-sm"
                  >
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={false}
                      animate={{
                        width: i === activePhoto ? "100%" : "0%",
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pet Info Card — overlaps the photo like the reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 -mt-8 mx-4"
        >
          <div className="bg-white rounded-3xl shadow-lg shadow-black/5 p-5">
            {/* Name + Fee row */}
            <div className="flex items-start justify-between mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {listing.name}
              </h1>
              {listing.adoptionFee != null && listing.adoptionFee > 0 && (
                <div className="text-right">
                  <p className="text-xl font-bold text-teal-600">
                    ${listing.adoptionFee}
                  </p>
                  <p className="text-[10px] text-gray-400">Adoption Fee</p>
                </div>
              )}
            </div>
            {/* Location — clickable to open map */}
            {listing.postedBy?.organizationName && (
              <button
                type="button"
                onClick={() => {
                  if (
                    listing.postedBy?.latitude != null &&
                    listing.postedBy?.longitude != null
                  )
                    setShowMap(true);
                }}
                className={`flex items-center gap-1 text-xs mb-4 ${
                  listing.postedBy?.latitude != null &&
                  listing.postedBy?.longitude != null
                    ? "text-teal-600 hover:text-teal-700 cursor-pointer"
                    : "text-gray-400 cursor-default"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {userCoords &&
                    listing.postedBy?.latitude != null &&
                    listing.postedBy?.longitude != null && (
                      <>
                        {getDistanceKm(
                          userCoords.lat,
                          userCoords.lng,
                          listing.postedBy.latitude,
                          listing.postedBy.longitude,
                        ).toFixed(1)}{" "}
                        km &bull;{" "}
                      </>
                    )}
                  {listing.postedBy.organizationName}
                </span>
              </button>
            )}

            {/* Info boxes */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  Sex
                </p>
                <p
                  className={`text-sm font-semibold ${
                    listing.gender === "female"
                      ? "text-pink-500"
                      : "text-blue-500"
                  }`}
                >
                  {listing.gender.charAt(0).toUpperCase() +
                    listing.gender.slice(1)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  Age
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatAge(listing.age)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  Breed
                </p>
                <p className="text-sm font-semibold text-gray-700 truncate">
                  {listing.breed.charAt(0).toUpperCase() +
                    listing.breed.slice(1)}
                </p>
              </div>
            </div>

            {/* Platform badge */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm">
                  <PawPrint className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {listing.postedBy?.organizationName ||
                      listing.postedBy?.name ||
                      "PurrfectCare"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Trusted Adoption Platform
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 text-amber-500 text-xs font-medium">
                <span>★</span>
                <span>4.9</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* About section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mt-4"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              About {listing.name}
            </h2>
            <RichText 
              content={listing.description} 
              className="text-sm text-gray-600 leading-relaxed"
            />

            {/* Health info */}
            {listing.healthInfo && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Health Information
                  </h3>
                </div>
                <div className="pl-9">
                  <RichText 
                    content={listing.healthInfo} 
                    className="text-sm text-gray-600"
                  />
                </div>
              </div>
            )}

            {/* Temperament */}
            {listing.temperament && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
                    <Smile className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Temperament
                  </h3>
                </div>
                <div className="pl-9">
                  <RichText 
                    content={listing.temperament} 
                    className="text-sm text-gray-600"
                  />
                </div>
              </div>
            )}

            {/* Special Needs */}
            {listing.specialNeeds && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Special Needs
                  </h3>
                </div>
                <div className="pl-9">
                  <RichText 
                    content={listing.specialNeeds} 
                    className="text-sm text-gray-600"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Apply overlay form */}
        <AnimatePresence>
          {showApplyForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
              onClick={() => setShowApplyForm(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] flex flex-col"
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Form Header */}
                <div className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Adoption Application
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Apply to adopt{" "}
                      <span className="text-teal-500 font-medium">
                        {listing.name}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowApplyForm(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="w-full h-px bg-gray-100" />

                {/* Scrollable form content */}
                <div
                  className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
                  style={{ scrollbarWidth: "none" }}
                >
                  {/* Message */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Why do you want to adopt? *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Tell us about your experience with pets and why you'd be a great match..."
                      className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-800 placeholder:text-gray-400 outline-none resize-none text-sm transition-all focus:bg-white ${
                        errors.message
                          ? "border-red-300 bg-red-50/50"
                          : "border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                      }`}
                    />
                    {errors.message && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Phone + Email row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="98XXXXXXXX"
                        className={`w-full px-3 py-3 rounded-xl border bg-gray-50 text-gray-800 placeholder:text-gray-400 outline-none text-sm transition-all focus:bg-white ${
                          errors.contactPhone
                            ? "border-red-300 bg-red-50/50"
                            : "border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                        }`}
                      />
                      {errors.contactPhone && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.contactPhone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Email *
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={`w-full px-3 py-3 rounded-xl border bg-gray-50 text-gray-800 placeholder:text-gray-400 outline-none text-sm transition-all focus:bg-white ${
                          errors.contactEmail
                            ? "border-red-300 bg-red-50/50"
                            : "border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                        }`}
                      />
                      {errors.contactEmail && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.contactEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Living Situation */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <Home className="w-3.5 h-3.5" />
                      Living Situation *
                    </label>
                    <select
                      name="livingSituation"
                      value={formData.livingSituation}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-800 outline-none text-sm transition-all focus:bg-white appearance-none ${
                        errors.livingSituation
                          ? "border-red-300 bg-red-50/50"
                          : "border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                      }`}
                    >
                      <option value="">Select your living situation</option>
                      {LIVING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.livingSituation && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.livingSituation}
                      </p>
                    )}
                  </div>

                  {/* Toggle row: Other Pets + Children */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <PawPrint className="w-4 h-4 text-teal-500" />
                        Do you have other pets?
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.hasOtherPets}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              hasOtherPets: !prev.hasOtherPets,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-gray-300 peer-checked:bg-teal-500 rounded-full transition-colors" />
                        <div className="absolute left-0.75 top-0.75 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4.5" />
                      </label>
                    </div>

                    {formData.hasOtherPets && (
                      <textarea
                        name="otherPetsDetails"
                        value={formData.otherPetsDetails}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Tell us about your other pets..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 outline-none resize-none text-sm focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-400/20 transition-all"
                      />
                    )}

                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <Baby className="w-4 h-4 text-violet-500" />
                        Do you have children?
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.hasChildren}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              hasChildren: !prev.hasChildren,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-gray-300 peer-checked:bg-teal-500 rounded-full transition-colors" />
                        <div className="absolute left-0.75 top-0.75 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4.5" />
                      </label>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleApply}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm bg-linear-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Application
                      </>
                    )}
                  </button>

                  {/* Bottom safe area */}
                  <div className="h-2" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100 px-5 py-4 z-40 max-w-lg mx-auto">
          {listing.status === "adopted" ? (
            <div className="text-center py-2">
              <p className="text-sm font-semibold text-gray-400">
                This pet has been adopted
              </p>
            </div>
          ) : hasApplied ? (
            <div className="space-y-2">
              <div className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm bg-teal-50 text-teal-600 text-center border-2 border-teal-200">
                ✓ Application Submitted
              </div>
              {listing.postedBy?._id && (
                <StartChatButton
                  recipientId={listing.postedBy._id}
                  context="adoption"
                  contextRef={listing._id}
                  label="Contact Shelter"
                  variant="secondary"
                  className="w-full justify-center py-3"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {listing.postedBy?._id && (
                <StartChatButton
                  recipientId={listing.postedBy._id}
                  context="adoption"
                  contextRef={listing._id}
                  label=""
                  variant="icon"
                  className="w-12 h-12 bg-gray-100 text-gray-700 hover:bg-gray-200"
                />
              )}
              <button
                onClick={() => {
                  if (!user) {
                    toast.error("Please login to apply");
                    router.push("/login");
                    return;
                  }
                  setShowApplyForm(true);
                }}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-base bg-gray-900 text-white shadow-lg shadow-gray-900/25 hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Apply to Adopt
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Modal */}
      {listing.postedBy?.latitude != null &&
        listing.postedBy?.longitude != null && (
          <DynamicMapModal
            isOpen={showMap}
            onClose={() => setShowMap(false)}
            title={`${listing.postedBy.organizationName || listing.postedBy.name}`}
            center={[listing.postedBy.latitude, listing.postedBy.longitude]}
            zoom={15}
            focusMarkerId={listing._id}
            userLocation={userCoords}
            markers={[
              {
                id: listing._id,
                latitude: listing.postedBy.latitude,
                longitude: listing.postedBy.longitude,
                title: listing.name,
                subtitle:
                  listing.postedBy.organizationName || listing.postedBy.name,
                description: listing.location || undefined,
                type: "adoption_listing",
                photo: listing.photos?.[0],
              },
            ]}
          />
        )}
    </MobileLayout>
  );
}
