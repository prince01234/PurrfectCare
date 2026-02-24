"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Plus, Star, Search } from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = ["All", "Food", "Toys", "Accessories", "Health"];

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { itemCount, addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const hasFilters = activeCategory !== "All" || Boolean(searchQuery.trim());

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const params: Record<string, string | number> = { limit: 20 };
    if (activeCategory !== "All") {
      params.category = activeCategory.toLowerCase();
    }
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    const res = await productApi.getProducts(params);
    if (res.data) {
      setProducts(res.data.products);
    }
    setIsLoading(false);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    setAddingProductId(product._id);
    const success = await addItem(product._id);
    if (success) {
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error("Failed to add item");
    }
    setAddingProductId(null);
  };

  const handleResetFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
  };

  return (
    <MobileLayout>
      {/* Teal accent bar at top */}
      <div className="h-1 bg-linear-to-r from-teal-500 to-teal-400" />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <Link
              href="/marketplace/cart"
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="View cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-3"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </motion.div>
        )}

        {/* Category tabs */}
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results summary */}
        <div className="px-5 pb-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {products.length} item{products.length === 1 ? "" : "s"}
          </span>
          {hasFilters && (
            <button
              onClick={handleResetFilters}
              className="text-teal-600 font-medium hover:text-teal-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Products grid */}
      <div className="px-5 pb-8 mt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-12" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 px-6">
            <p className="text-gray-400 text-sm">No products found</p>
            {hasFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-3 text-teal-600 text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Link key={product._id} href={`/marketplace/${product._id}`}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-50">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingCart className="w-10 h-10" />
                      </div>
                    )}

                    {/* Add to cart button */}
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={addingProductId === product._id}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-gray-500">
                        {(4 + Math.random()).toFixed(1)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {product.category}
                    </p>
                    <p className="text-base font-bold text-orange-500 mt-1">
                      NPR {product.price.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
