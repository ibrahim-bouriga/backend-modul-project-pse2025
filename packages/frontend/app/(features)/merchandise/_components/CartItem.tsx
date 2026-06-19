"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CartItem as CartItemType } from "./types";
import { useCart } from "./CartContext";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > item.product.stock) return;
    
    setIsUpdating(true);
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeItem(item.id);
    } catch (error) {
      console.error("Failed to remove item:", error);
      setIsRemoving(false);
    }
  };

  const formatPrice = (price: string) => {
    return `€${parseFloat(price).toFixed(2)}`;
  };

  const itemTotal = (parseFloat(item.product.price) * item.quantity).toFixed(2);

  return (
    <div
      className={`flex gap-4 py-4 border-b border-gray-200 last:border-b-0 ${
        isRemoving ? "opacity-50" : ""
      }`}
    >
      {/* Product Image */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
        <Image
          src={item.product.imageUrl}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Product Info */}
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">
          {item.product.name}
        </h4>
        <p className="text-sm text-gray-600 mt-1">
          {formatPrice(item.product.price)} each
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating || item.quantity >= item.product.stock}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
          >
            Remove
          </button>
        </div>

        {/* Stock Warning */}
        {item.quantity >= item.product.stock && (
          <p className="text-xs text-amber-600 mt-1">
            Maximum stock reached
          </p>
        )}
      </div>

      {/* Item Total */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-gray-900">
          {formatPrice(itemTotal)}
        </p>
      </div>
    </div>
  );
}
