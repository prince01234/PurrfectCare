"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

import MobileLayout from "@/components/layout/MobileLayout";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    items,
    totalPrice,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemove(productId);
      return;
    }
    setUpdatingId(productId);
    const success = await updateQuantity(productId, newQty);
    if (!success) toast.error("Failed to update quantity");
    setUpdatingId(null);
  };

  const handleRemove = async (productId: string) => {
    setUpdatingId(productId);
    const success = await removeItem(productId);
    if (success) {
      toast.success("Item removed");
    } else {
      toast.error("Failed to remove item");
    }
    setUpdatingId(null);
  };

  const handleClearCart = async () => {
    const success = await clearCart();
    if (success) toast.success("Cart cleared");
  };

  if (authLoading || !user) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Cart</h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-500 font-medium hover:text-red-600"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-gray-400 text-base font-medium">
            Your cart is empty
          </p>
          <p className="text-gray-300 text-sm mt-1 mb-6">
            Browse products and add items to your cart
          </p>
          <button
            onClick={() => router.push("/marketplace")}
            className="bg-teal-500 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-teal-600 transition-colors"
          >
            Browse Marketplace
          </button>
        </div>
      ) : (
        <>
          <div className="px-5 py-4 space-y-3 pb-44">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 shadow-sm"
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {item.imageSnapshot ? (
                    <Image
                      src={item.imageSnapshot}
                      alt={item.nameSnapshot}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {item.nameSnapshot}
                  </h3>
                  <p className="text-base font-bold text-orange-500 mt-1">
                    NPR {item.priceSnapshot.toFixed(2)}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity control */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId,
                            item.quantity - 1,
                          )
                        }
                        disabled={updatingId === item.productId}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <span className="text-sm font-medium text-gray-900 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.productId,
                            item.quantity + 1,
                          )
                        }
                        disabled={updatingId === item.productId}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={updatingId === item.productId}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom checkout bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 z-40">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-sm">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  NPR {totalPrice.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => router.push("/marketplace/checkout")}
                className="w-full bg-teal-500 text-white font-semibold py-3.5 rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </MobileLayout>
  );
}
