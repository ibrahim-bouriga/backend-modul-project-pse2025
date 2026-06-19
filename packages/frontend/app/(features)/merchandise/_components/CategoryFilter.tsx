"use client";

import React from "react";
import { ProductCategory } from "./types";

interface CategoryFilterProps {
  selectedCategory: ProductCategory | "all";
  onCategoryChange: (category: ProductCategory | "all") => void;
}

const categories: Array<{ value: ProductCategory | "all"; label: string }> = [
  { value: "all", label: "All Products" },
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "collectibles", label: "Collectibles" },
];

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedCategory === category.value
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="text-sm font-medium text-center">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
