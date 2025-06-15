// src/components/ProductForm.tsx
import React, { useState, useRef } from "react";
import { useProductData } from "../../utils/hooks/useProduct";
import { Product } from "../../utils/types";

interface ProductFormProps {
  existingProduct?: Product;
  onSuccess?: (product: Product) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  existingProduct,
  onSuccess,
}) => {
  const { createProduct, updateProduct } = useProductData();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(existingProduct?.name || "");
  const [description, setDescription] = useState(
    existingProduct?.description || ""
  );
  const [category, setCategory] = useState(existingProduct?.category || "");
  const [price, setPrice] = useState(
    existingProduct?.price ? (existingProduct.price / 100).toString() : ""
  );
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("price", (parseFloat(price) * 100).toString());

      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("images", selectedFiles[i]);
        }
      }

      let result;
      if (existingProduct) {
        result = await updateProduct(existingProduct._id, formData);
      } else {
        result = await createProduct(formData);
      }

      if (result && onSuccess) {
        onSuccess(result);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Product Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0.01"
            step="0.01"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Product Images
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setSelectedFiles(e.target.files)}
          multiple
          accept="image/*"
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {existingProduct?.images && existingProduct.images.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Current images:</p>
            <div className="flex space-x-2 mt-1">
              {existingProduct.images.map((img, index) => (
                <img
                  key={index}
                  src={`${import.meta.env.VITE_API_URL}/images/${img}`}
                  alt={`Product ${index + 1}`}
                  className="h-16 w-16 object-cover rounded"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : existingProduct
            ? "Update Product"
            : "Create Product"}
        </button>
      </div>
    </form>
  );
};
