"use client";
import { useState } from "react";
import { products, categories, type Product } from "../data/products";

export default function PuzzleCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Все");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = selectedCategory === "Все"
    ? products
    : products.filter(p => p.category === selectedCategory);

  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <button
          onClick={() => setSelectedProduct(null)}
          className="mb-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          ← Вернуться в каталог
        </button>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {selectedProduct.name}
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Категория: {selectedProduct.category}
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Количество элементов: {selectedProduct.pieces}
              </p>
              <p className="text-4xl font-bold text-purple-600 mb-6">
                {selectedProduct.price} ₽
              </p>
              <button className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
                Добавить в корзину
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          🧩 Магазин пазлов
        </h1>

        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => setSelectedCategory("Все")}
            className={`px-6 py-2 rounded-full transition ${
              selectedCategory === "Все"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-purple-100"
            }`}
          >
            Все
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full transition ${
                selectedCategory === category
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 hover:bg-purple-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {product.category} • {product.pieces} элементов
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {product.price} ₽
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}