"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
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
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">My Cart</h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-red-600 font-medium hover:text-red-700"
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
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm mb-1 font-medium">Empty Cart</p>
          <p className="text-gray-400 text-xs mb-4">Add items to get started</p>
          <button
            onClick={() => router.push("/marketplace")}
            className="bg-teal-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-teal-600"
          >
            Shop Now
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 py-4 pb-52 space-y-2">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200"
              >
                {/* Product Row */}
                <div className="flex gap-3 mb-2">
                  {/* Image */}
                  <div className="w-18 h-18 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {item.imageSnapshot ? (
                      <Image
                        src={item.imageSnapshot}
                        alt={item.nameSnapshot}
                        width={72}
                        height={72}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 mb-0.5">
                      {item.nameSnapshot}
                    </h3>
                    <p className="text-sm font-bold text-teal-600 mb-1">
                      NPR {item.priceSnapshot.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Subtotal: NPR{" "}
                      {(item.priceSnapshot * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={updatingId === item.productId}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 disabled:opacity-50 shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Quantity Control */}
                <div className="bg-gray-50 rounded-lg p-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Qty</span>
                  <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.productId, item.quantity - 1)
                      }
                      disabled={updatingId === item.productId}
                      className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="text-xs font-bold text-gray-900 w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={updatingId === item.productId}
                      className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
            <div className="max-w-lg mx-auto space-y-2">
              <div className="space-y-1 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    NPR {totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-1 mt-1">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-gray-500 text-xs">
                    At checkout
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 text-sm">
                  Total
                </span>
                <span className="text-lg font-bold text-teal-600">
                  NPR {totalPrice.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => router.push("/marketplace/checkout")}
                className="w-full bg-teal-500 text-white font-bold py-2.5 rounded-lg hover:bg-teal-600 mb-2"
              >
                Checkout
              </button>

              <button
                onClick={() => router.push("/marketplace")}
                className="w-full bg-gray-100 text-gray-900 font-semibold py-2 rounded-lg hover:bg-gray-200"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </>
      )}
    </MobileLayout>
  );
}
