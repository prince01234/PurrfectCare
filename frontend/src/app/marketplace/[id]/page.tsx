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

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const res = await productApi.getProductById(productId);
      if (res.data) {
        setProduct(res.data);
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

    setIsAdding(true);
    const success = await addItem(product._id, quantity);
    if (success) {
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error("Failed to add item");
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

  return (
    <MobileLayout showBottomNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => router.push("/marketplace/cart")}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Product image */}
      <div className="relative aspect-square bg-gray-50 mx-5 rounded-2xl overflow-hidden">
        {product.images.length > 0 ? (
          <Image
            src={product.images[activeImageIndex] || product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package className="w-16 h-16" />
          </div>
        )}
      </div>

      {/* Image thumbnails */}
      {product.images.length > 1 && (
        <div className="flex gap-2 px-5 mt-3 overflow-x-auto hide-scrollbar">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImageIndex(i)}
              className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                i === activeImageIndex
                  ? "border-teal-500"
                  : "border-transparent"
              }`}
            >
              <Image
                src={img}
                alt={`${product.name} ${i + 1}`}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Product info */}
      <div className="px-5 mt-5 pb-32">
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm text-gray-500">
            {(4 + Math.random()).toFixed(1)}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-sm text-gray-400 capitalize mt-0.5">
          {product.category}
          {product.brand && ` · ${product.brand}`}
        </p>

        <p className="text-2xl font-bold text-orange-500 mt-3">
          NPR {product.price.toFixed(2)}
        </p>

        {product.stockQty !== null && (
          <p
            className={`text-xs mt-1 ${
              product.stockQty > 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {product.stockQty > 0
              ? `${product.stockQty} in stock`
              : "Out of stock"}
          </p>
        )}

        {product.description && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {/* Quantity selector */}
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-900 w-6 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={
              isAdding || (product.stockQty !== null && product.stockQty <= 0)
            }
            className="flex-1 bg-teal-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-5 h-5" />
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
