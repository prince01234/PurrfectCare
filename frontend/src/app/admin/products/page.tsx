"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Filter,
  Package,
  Edit2,
  Trash2,
  X,
  Camera,
  Tag,
  Box,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import AdminLayout from "@/components/layout/AdminLayout";
import { productApi } from "@/lib/api/product";
import type { Product, CreateProductData } from "@/lib/api/product";

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "treats", label: "Treats" },
  { value: "grooming", label: "Grooming" },
  { value: "toys", label: "Toys" },
  { value: "accessories", label: "Accessories" },
  { value: "hygiene", label: "Hygiene" },
  { value: "medicine", label: "Medicine" },
  { value: "other", label: "Other" },
];

const PET_TYPES = [
  { value: "all", label: "All Pets" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "rabbit", label: "Rabbit" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [petTypeFilter, setPetTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreateProductData>({
    name: "",
    description: "",
    price: 0,
    category: "food",
    petType: "all",
    brand: "",
    stockQty: 0,
    isActive: true,
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const fetchProducts = async () => {
    setIsLoading(true);
    const res = await productApi.getAdminProducts({
      limit: 100,
      includeInactive: true,
    });
    if (res.data) {
      setProducts(res.data.products);
    } else if (res.error) {
      toast.error(res.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchProducts();
    })();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5 MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const previews = validFiles.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...previews]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (form.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    setIsSaving(true);
    const res = await productApi.createProduct(form, images);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Product created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchProducts();
    }
    setIsSaving(false);
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    setIsSaving(true);
    const res = await productApi.updateProduct(
      selectedProduct._id,
      form,
      images,
    );
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Product updated successfully");
      setShowEditModal(false);
      resetForm();
      fetchProducts();
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setIsSaving(true);
    const res = await productApi.deleteProduct(selectedProduct._id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Product deleted successfully");
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      fetchProducts();
    }
    setIsSaving(false);
  };

  const handleToggleActive = async (product: Product) => {
    const res = await productApi.updateProduct(product._id, {
      isActive: !product.isActive,
    });
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(
        `Product ${product.isActive ? "deactivated" : "activated"}`,
      );
      fetchProducts();
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: 0,
      category: "food",
      petType: "all",
      brand: "",
      stockQty: 0,
      isActive: true,
    });
    setImages([]);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setSelectedProduct(null);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category,
      petType: product.petType,
      brand: product.brand || "",
      stockQty: product.stockQty || 0,
      isActive: product.isActive,
    });
    setImages([]);
    setImagePreviews([]);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const filteredProducts = products.filter((p) => {
    if (
      searchQuery &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (categoryFilter && p.category !== categoryFilter) {
      return false;
    }
    if (petTypeFilter && p.petType !== petTypeFilter) {
      return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-colors ${
                showFilters
                  ? "bg-teal-50 border-teal-200 text-teal-600"
                  : "border-gray-200 text-gray-400 hover:text-gray-600"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Pet Type
                    </label>
                    <select
                      value={petTypeFilter}
                      onChange={(e) => setPetTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">All Types</option>
                      {PET_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredProducts.map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {!product.isActive && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          INACTIVE
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-teal-600">
                        Rs. {product.price}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 capitalize">
                        {product.petType === "all"
                          ? "All Pets"
                          : product.petType}
                      </span>
                      {product.stockQty !== null && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <Box className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Stock: {product.stockQty}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`p-2 rounded-lg transition-colors ${
                        product.isActive
                          ? "bg-teal-50 text-teal-600 hover:bg-teal-100"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      title={product.isActive ? "Deactivate" : "Activate"}
                    >
                      {product.isActive ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(product)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add Product</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Images */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                    Product Images (Max 5)
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {imagePreviews.map((preview, i) => (
                      <div
                        key={i}
                        className="relative w-20 h-20 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={preview}
                          alt={`Preview ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < 5 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-[10px] mt-1">Add</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g., Premium Dog Food"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
                    placeholder="Product description..."
                  />
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stockQty}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          stockQty: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Category & Pet Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Pet Type *
                    </label>
                    <select
                      value={form.petType}
                      onChange={(e) =>
                        setForm({ ...form, petType: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                    >
                      {PET_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g., Pedigree"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Active Status
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Make product visible to customers
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setForm({ ...form, isActive: !form.isActive })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      form.isActive ? "bg-teal-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white font-medium disabled:opacity-50"
                >
                  {isSaving ? "Creating..." : "Create Product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {showEditModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowEditModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Product
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Existing Images */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                    Current Images
                  </label>
                  <div className="flex gap-3 flex-wrap mb-3">
                    {selectedProduct.images.map((img, i) => (
                      <div
                        key={i}
                        className="relative w-20 h-20 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={img}
                          alt={`Image ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Images */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                    Add New Images
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {imagePreviews.map((preview, i) => (
                      <div
                        key={i}
                        className="relative w-20 h-20 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={preview}
                          alt={`Preview ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < 5 && (
                      <button
                        onClick={() => editFileInputRef.current?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-[10px] mt-1">Add</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Same form fields as create modal */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stockQty}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          stockQty: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                      Pet Type *
                    </label>
                    <select
                      value={form.petType}
                      onChange={(e) =>
                        setForm({ ...form, petType: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                    >
                      {PET_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Active Status
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Make product visible to customers
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setForm({ ...form, isActive: !form.isActive })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      form.isActive ? "bg-teal-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white font-medium disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setSelectedProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete Product?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete{" "}
                <strong>{selectedProduct.name}</strong>? This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium disabled:opacity-50"
                >
                  {isSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
