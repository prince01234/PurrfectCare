"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Star,
  Search,
  Grid,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = ["All", "Food", "Toys", "Accessories", "Health"];
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price low-high", value: "price-asc" },
  { label: "Price high-low", value: "price-desc" },
] as const;

const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 100;
const SEARCH_DEBOUNCE_MS = 320;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const getDisplayRating = (productId: string) => {
  let hash = 0;
  for (let i = 0; i < productId.length; i += 1) {
    hash = (hash * 31 + productId.charCodeAt(i)) % 1000;
  }
  return Number((3.5 + (hash / 1000) * 1.5).toFixed(1));
};

const formatPrice = (value: number) => `NPR ${value.toLocaleString()}`;

const formatProductName = (name: string) => name.replace(/\s+/g, " ").trim();

export default function MarketplacePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { itemCount, addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState(PRICE_MIN);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const hasFilters =
    activeCategory !== "All" ||
    Boolean(searchQuery.trim()) ||
    priceMin !== PRICE_MIN ||
    priceMax !== PRICE_MAX ||
    sortOption !== "newest";

  const activeFilterCount =
    (activeCategory !== "All" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (priceMin !== PRICE_MIN || priceMax !== PRICE_MAX ? 1 : 0) +
    (sortOption !== "newest" ? 1 : 0);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const params: Record<string, string | number> = { limit: 20 };

    if (activeCategory !== "All") {
      params.category = activeCategory.toLowerCase();
    }

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    if (priceMin > PRICE_MIN) {
      params.minPrice = priceMin;
    }
    if (priceMax < PRICE_MAX) {
      params.maxPrice = priceMax;
    }

    if (sortOption === "price-asc") {
      params.sort = "price";
      params.order = "asc";
    } else if (sortOption === "price-desc") {
      params.sort = "price";
      params.order = "desc";
    } else {
      params.sort = "createdAt";
      params.order = "desc";
    }

    const res = await productApi.getProducts(params);

    if (res.error) {
      toast.error(res.error);
      setProducts([]);
    }

    if (res.data?.products) {
      setProducts(res.data.products);
    }

    setIsLoading(false);
  }, [activeCategory, debouncedSearchQuery, priceMax, priceMin, sortOption]);

  useEffect(() => {
    const nextQuery = new URLSearchParams();

    if (activeCategory !== "All") {
      nextQuery.set("category", activeCategory.toLowerCase());
    }
    if (debouncedSearchQuery.trim()) {
      nextQuery.set("search", debouncedSearchQuery.trim());
    }
    if (priceMin > PRICE_MIN) {
      nextQuery.set("minPrice", String(priceMin));
    }
    if (priceMax < PRICE_MAX) {
      nextQuery.set("maxPrice", String(priceMax));
    }
    if (sortOption !== "newest") {
      nextQuery.set("sort", sortOption);
    }
    if (viewMode !== "grid") {
      nextQuery.set("view", viewMode);
    }

    const nextQueryString = nextQuery.toString();
    const currentQueryString = searchParams.toString();

    if (nextQueryString !== currentQueryString) {
      const nextUrl = nextQueryString
        ? `${pathname}?${nextQueryString}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    activeCategory,
    debouncedSearchQuery,
    pathname,
    priceMax,
    priceMin,
    router,
    searchParams,
    sortOption,
    viewMode,
  ]);

  useEffect(() => {
    // Data fetching intentionally runs from this effect when filter inputs change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProducts();
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
    setDebouncedSearchQuery("");
    setPriceMin(PRICE_MIN);
    setPriceMax(PRICE_MAX);
    setSortOption("newest");
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
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                showFilters
                  ? "bg-teal-50 text-teal-600"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
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
        <AnimatePresence initial={false}>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2.5 pr-10 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter options */}
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-3 space-y-2"
            >
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
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

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Sort By
                </p>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortOption(option.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        sortOption === option.value
                          ? "bg-slate-800 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold text-gray-500">View</p>
                <div className="inline-flex items-center rounded-full bg-white p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-6 px-2 rounded-full flex items-center gap-1 transition-colors ${
                      viewMode === "grid"
                        ? "bg-gray-100 text-gray-800"
                        : "text-gray-500"
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid className="w-3 h-3" />
                    <span className="text-[11px]">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-6 px-2 rounded-full flex items-center gap-1 transition-colors ${
                      viewMode === "list"
                        ? "bg-gray-100 text-gray-800"
                        : "text-gray-500"
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-3 h-3" />
                    <span className="text-[11px]">List</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">
                    Custom Price Range
                  </span>
                  <span className="text-[11px] font-medium text-gray-600">
                    {formatPrice(priceMin)} - {formatPrice(priceMax)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">
                      Minimum
                    </label>
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={PRICE_STEP}
                      value={priceMin}
                      onChange={(e) => {
                        const nextValue = Number(e.target.value);
                        setPriceMin(Math.min(nextValue, priceMax));
                      }}
                      className="w-full h-1.5 rounded-lg accent-teal-500"
                      aria-label="Minimum price"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">
                      Maximum
                    </label>
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={PRICE_STEP}
                      value={priceMax}
                      onChange={(e) => {
                        const nextValue = Number(e.target.value);
                        setPriceMax(Math.max(nextValue, priceMin));
                      }}
                      className="w-full h-1.5 rounded-lg accent-teal-500"
                      aria-label="Maximum price"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results summary */}
        <div className="px-5 pb-4 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2 ml-auto">
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
      </div>

      {/* Products grid/list */}
      <div className="px-5 pb-8 mt-2">
        {isLoading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 gap-3 auto-rows-fr"
                : "space-y-3"
            }
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl overflow-hidden animate-pulse h-full flex flex-col"
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-12" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                      <div className="h-4 bg-gray-200 rounded w-14" />
                    </div>
                  </>
                ) : (
                  <div className="flex gap-3 p-3">
                    <div className="w-24 h-24 bg-gray-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-12" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                      <div className="h-4 bg-gray-200 rounded w-14" />
                    </div>
                  </div>
                )}
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
        ) : viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-2 gap-4 auto-rows-fr">
            {products.map((product) => {
              const displayRating = getDisplayRating(product._id);
              const productName = formatProductName(product.name);

              return (
                <Link
                  key={product._id}
                  href={`/marketplace/${product._id}`}
                  className="block h-full"
                >
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col"
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
                        className="absolute bottom-2 right-2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Plus className="w-4.5 h-4.5 text-gray-700" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-3.5 flex flex-1 flex-col">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium text-gray-600">
                          {displayRating.toFixed(1)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.8rem] mb-1 wrap-anywhere">
                        {productName}
                      </h3>
                      <p className="text-xs text-gray-400 capitalize h-4 mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        {product.category}
                      </p>
                      <p className="text-base font-bold text-orange-500 mt-auto">
                        NPR {product.price.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-3">
            {products.map((product) => {
              const displayRating = getDisplayRating(product._id);
              const productName = formatProductName(product.name);

              return (
                <Link
                  key={product._id}
                  href={`/marketplace/${product._id}`}
                  className="block"
                >
                  <motion.div
                    whileTap={{ scale: 0.99 }}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Image */}
                      <div className="relative w-28 h-28 bg-gray-50 rounded-xl overflow-hidden shrink-0">
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
                              {displayRating.toFixed(1)}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-1 wrap-break-word">
                            {productName}
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
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
