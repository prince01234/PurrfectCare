"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Search,
  X,
  SlidersHorizontal,
  Star,
} from "lucide-react";

import MobileLayout from "@/components/layout/MobileLayout";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";

const CATEGORIES = ["All", "Food", "Toys", "Accessories", "Health"];
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to high" },
  { value: "price-high", label: "Price: High to low" },
  { value: "newest", label: "Newest" },
] as const;

const PRICE_PRESETS = [
  { id: "under-500", label: "Under 500", min: 0, max: 500 },
  { id: "500-1500", label: "500 - 1500", min: 500, max: 1500 },
  { id: "1500-3000", label: "1500 - 3000", min: 1500, max: 3000 },
  { id: "3000-plus", label: "3000+", min: 3000, max: null },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const formatPrice = (amount: number) => {
  return `NPR ${amount.toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function MarketplacePage() {
  const router = useRouter();
  const { itemCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [activePricePreset, setActivePricePreset] = useState<string | null>(
    null,
  );
  const [refreshSeed, setRefreshSeed] = useState(0);

  const minPriceValue =
    minPrice.trim() && !Number.isNaN(Number(minPrice))
      ? Number(minPrice)
      : null;
  const maxPriceValue =
    maxPrice.trim() && !Number.isNaN(Number(maxPrice))
      ? Number(maxPrice)
      : null;
  const hasAdvancedFilters =
    sortBy !== "featured" || minPriceValue !== null || maxPriceValue !== null;
  const hasFilters =
    activeCategory !== "All" ||
    Boolean(searchQuery.trim()) ||
    hasAdvancedFilters;

  useEffect(() => {
    let isCancelled = false;
    const params: Record<string, string | number> = { limit: 20 };

    if (activeCategory !== "All") {
      params.category = activeCategory.toLowerCase();
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    productApi
      .getProducts(params)
      .then((res) => {
        if (isCancelled) {
          return;
        }

        if (res.error) {
          setLoadError(res.error);
          setProducts([]);
          return;
        }

        setLoadError(null);
        setProducts(res.data?.products ?? []);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeCategory, searchQuery, refreshSeed]);

  const displayedProducts = useMemo(() => {
    let filtered = [...products];

    if (minPriceValue !== null) {
      filtered = filtered.filter((product) => product.price >= minPriceValue);
    }

    if (maxPriceValue !== null) {
      filtered = filtered.filter((product) => product.price <= maxPriceValue);
    }

    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return filtered;
  }, [products, minPriceValue, maxPriceValue, sortBy]);

  const handleCategoryChange = (category: string) => {
    if (category === activeCategory) {
      return;
    }

    setLoadError(null);
    setIsLoading(true);
    setActiveCategory(category);
  };

  const handleSearchChange = (value: string) => {
    setLoadError(null);
    setIsLoading(true);
    setSearchQuery(value);
  };

  const handleMinPriceChange = (value: string) => {
    setActivePricePreset(null);
    setMinPrice(value.replace(/[^\d]/g, ""));
  };

  const handleMaxPriceChange = (value: string) => {
    setActivePricePreset(null);
    setMaxPrice(value.replace(/[^\d]/g, ""));
  };

  const applyPricePreset = (preset: (typeof PRICE_PRESETS)[number]) => {
    setActivePricePreset(preset.id);
    setMinPrice(String(preset.min));
    setMaxPrice(preset.max === null ? "" : String(preset.max));
  };

  const handleRetry = () => {
    setLoadError(null);
    setIsLoading(true);
    setRefreshSeed((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setLoadError(null);
    setIsLoading(true);
    setActiveCategory("All");
    setSearchQuery("");
    setSortBy("featured");
    setMinPrice("");
    setMaxPrice("");
    setActivePricePreset(null);
  };

  return (
    <MobileLayout>
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
                <p className="text-xs text-gray-500">
                  Simple shopping for pets
                </p>
              </div>
            </div>

            <Link
              href="/marketplace/cart"
              className="relative flex h-10 min-w-10 items-center justify-center rounded-xl bg-gray-100 px-3 text-gray-700 transition-colors hover:bg-gray-200"
              aria-label="View cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>

          <div className="mt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, brands, or pet type"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-500 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-500/15"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200/60 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 overflow-x-auto px-4 pb-2 hide-scrollbar">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-1.5 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-500/15 whitespace-nowrap"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors shrink-0 ${
                showAdvancedFilters
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2">
            <div className="space-y-2">
              <div>
                <p className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Quick price ranges
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {PRICE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPricePreset(preset)}
                      className={`rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                        activePricePreset === preset.id
                          ? "bg-teal-600 text-white"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-gray-600">
                    Min
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-500/15"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-xs font-semibold text-gray-600">
                    Max
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-500/15"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
          <span>
            Showing {displayedProducts.length} item
            {displayedProducts.length === 1 ? "" : "s"}
          </span>
          {hasFilters && (
            <button
              onClick={handleResetFilters}
              className="font-semibold text-teal-600 hover:text-teal-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-8 pt-3">
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-8 w-24 rounded-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-12 text-center">
            <p className="text-sm font-medium text-red-700">
              We could not load marketplace products.
            </p>
            <p className="mt-1 text-xs text-red-600/90">{loadError}</p>
            <button
              onClick={handleRetry}
              className="mt-4 inline-flex h-10 items-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-base font-semibold text-gray-800">
              No products matched your search
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try changing search, category, sort, or price range.
            </p>
            {hasFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-4 inline-flex h-10 items-center rounded-full bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-base font-semibold text-gray-800">
              No products in this price range
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try widening your min or max price filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex h-10 items-center rounded-full bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayedProducts.map((product, index) => {
              const outOfStock =
                product.stockQty !== null && product.stockQty <= 0;

              return (
                <Link key={product._id} href={`/marketplace/${product._id}`}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 200px"
                          loading={index < 2 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <ShoppingCart className="h-10 w-10" />
                        </div>
                      )}

                      {outOfStock && (
                        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-red-600">
                          Out of stock
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400 line-clamp-1">
                        {product.category || "Product"}
                      </p>
                      <h3 className="min-h-10 text-sm font-semibold leading-5 text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-1.5">
                        <Star
                          className={`h-3.5 w-3.5 ${
                            (product.ratingCount || 0) > 0
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                        {(product.ratingCount || 0) > 0 ? (
                          <p className="text-xs text-gray-500">
                            {(product.ratingAverage || 0).toFixed(1)} (
                            {product.ratingCount})
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">
                            No ratings yet
                          </p>
                        )}
                      </div>

                      <div className="pt-0.5">
                        <p className="text-lg font-bold tracking-tight text-orange-500">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-3">
            {products.map((product) => (
              <Link key={product._id} href={`/marketplace/${product._id}`} className="block">
                <motion.div
                  whileTap={{ scale: 0.99 }}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="relative w-28 h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-medium text-gray-600">
                            {(4 + Math.random()).toFixed(1)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 capitalize">
                          {product.category}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-lg font-bold text-orange-500">
                          NPR {product.price.toFixed(2)}
                        </p>
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={addingProductId === product._id}
                          className="w-10 h-10 bg-teal-500 text-white rounded-xl shadow-md flex items-center justify-center hover:bg-teal-600 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
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
