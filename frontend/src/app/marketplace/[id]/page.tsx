"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import StartChatButton from "@/components/chat/StartChatButton";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { user } = useAuth();
  const { addItem, itemCount } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviews, setReviews] = useState<
    Array<{
      score: number;
      comment: string | null;
      buyerName: string;
      ratedAt: string | null;
    }>
  >([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);

  const formatPrice = (amount: number) => {
    return `NPR ${amount.toLocaleString("en-NP", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const res = await productApi.getProductById(productId);
      if (res.data) {
        setProduct(res.data);
        setQuantity(1);
        setActiveImageIndex(0);
        setShowFullDescription(false);

        // Fetch reviews
        const reviewRes = await productApi.getProductReviews(productId, 5);
        if (reviewRes.data) {
          setReviews(reviewRes.data.reviews);
          setReviewsTotal(reviewRes.data.total);
        }
      } else {
        toast.error("Product not found");
        router.back();
      }
      setIsLoading(false);
    };
    if (productId) fetchProduct();
  }, [productId, router]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }
    if (!product) return;

    if (product.stockQty !== null && product.stockQty <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    setIsAdding(true);
    const success = await addItem(product._id, quantity);
    if (success) {
      toast.success(`${product.name} added to cart`, { duration: 2000 });
    } else {
      toast.error("Failed to add item", { duration: 2000 });
    }
    setIsAdding(false);
  };

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      </MobileLayout>
    );
  }

  if (!product) return null;

  const isOutOfStock = product.stockQty !== null && product.stockQty <= 0;
  const canIncreaseQuantity =
    product.stockQty === null || quantity < product.stockQty;
  const description = product.description?.trim() || "";
  const isLongDescription = description.length > 260;
  const visibleDescription =
    isLongDescription && !showFullDescription
      ? `${description.slice(0, 260).trimEnd()}...`
      : description;

  return (
    <MobileLayout showBottomNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => router.push("/marketplace/cart")}
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Product image */}
      <div className="relative aspect-square bg-gray-50 mx-4 mt-3 rounded-2xl overflow-hidden">
        {product.images.length > 0 ? (
          <Image
            src={product.images[activeImageIndex] || product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package className="w-16 h-16" />
          </div>
        )}

        {product.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] font-medium px-2 py-1 rounded-full">
            {activeImageIndex + 1}/{product.images.length}
          </div>
        )}
      </div>

      {/* Image thumbnails */}
      {product.images.length > 1 && (
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto hide-scrollbar">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImageIndex(i)}
              className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                i === activeImageIndex
                  ? "border-teal-500"
                  : "border-transparent"
              }`}
            >
              <Image
                src={img}
                alt={`${product.name} ${i + 1}`}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Product info */}
      <div className="px-4 mt-4 pb-36 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <Star
              className={`w-4 h-4 shrink-0 ${(product.ratingCount || 0) > 0 ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
            />
            {(product.ratingCount || 0) > 0 ? (
              <span className="text-sm text-gray-600 truncate">
                {(product.ratingAverage || 0).toFixed(1)} ·{" "}
                {product.ratingCount} rating
                {(product.ratingCount || 0) > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-sm text-gray-400">No ratings yet</span>
            )}
          </div>

          {product.stockQty !== null && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                isOutOfStock
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isOutOfStock ? "Out of stock" : `${product.stockQty} in stock`}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
          {product.name}
        </h1>

        <p className="text-sm text-gray-500 capitalize">
          {product.category} · {product.petType}
          {product.brand && ` · ${product.brand}`}
        </p>

        <div className="pt-1">
          <p className="text-[34px] font-black text-orange-500 leading-none">
            {formatPrice(product.price)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Price per item</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Description
          </h3>
          {description ? (
            <>
              <p className="text-sm text-gray-600 leading-7 whitespace-pre-line">
                {visibleDescription}
              </p>
              {isLongDescription && (
                <button
                  onClick={() => setShowFullDescription((prev) => !prev)}
                  className="mt-2.5 text-sm font-semibold text-teal-600"
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No description available.</p>
          )}
        </div>

        {/* Customer Reviews */}
        {reviewsTotal > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Customer Reviews
              </h3>
              <span className="text-xs text-gray-500">
                {reviewsTotal} review{reviewsTotal > 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3">
              {reviews.map((review, idx) => (
                <div
                  key={idx}
                  className="pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.score
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {review.buyerName}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-4 z-40">
        <div className="max-w-lg mx-auto space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Subtotal ({quantity})</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(product.price * quantity)}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quantity selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1.5">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 disabled:opacity-40"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-900 w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((prev) => (canIncreaseQuantity ? prev + 1 : prev))
                }
                disabled={!canIncreaseQuantity || isOutOfStock}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 disabled:opacity-40"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Message Seller */}
            {product.createdBy && (
              <StartChatButton
                recipientId={product.createdBy}
                context="marketplace"
                contextRef={product._id}
                label=""
                variant="icon"
                className="w-11 h-11 bg-gray-100 text-gray-600 hover:bg-gray-200"
              />
            )}

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
              className="flex-1 bg-teal-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {isOutOfStock
                ? "Out of Stock"
                : isAdding
                  ? "Adding..."
                  : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
