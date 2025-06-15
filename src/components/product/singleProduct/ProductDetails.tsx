import { useState, useEffect, useCallback } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { Product, ProductVariant } from "../../../utils/types";
import ProductAbout from "./ProductAbout";
import ProductProperties from "./ProductProperties";
import ProductDescription from "./ProductDescription";

type SectionType = "About this product" | "Properties" | "Description";

interface ProductDetailsProps {
  product?: Product;
  onVariantSelect?: (variant: ProductVariant) => void;
}

const ProductDetails = ({ product, onVariantSelect }: ProductDetailsProps) => {
  const [openSection, setOpenSection] =
    useState<SectionType>("About this product");
  const [animating, setAnimating] = useState<SectionType | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => setAnimating(null), 300);
      return () => clearTimeout(timer);
    }
  }, [animating]);

  // Initialize with first available variant
  useEffect(() => {
    if (
      product?.type &&
      Array.isArray(product.type) &&
      product.type.length > 0
    ) {
      const firstAvailableVariant =
        product.type.find((variant: ProductVariant) => variant.quantity > 0) ||
        product.type[0];

      setSelectedVariant(firstAvailableVariant);
      if (onVariantSelect) {
        onVariantSelect(firstAvailableVariant);
      }
    } else {
      setSelectedVariant(null);
    }
  }, [product?.type, onVariantSelect]);

  const handleVariantChange = useCallback(
    (variant: ProductVariant) => {
      if (!variant || typeof variant.quantity !== "number") {
        console.warn("Invalid variant selected");
        return;
      }

      setSelectedVariant(variant);
      if (onVariantSelect) {
        onVariantSelect(variant);
      }
    },
    [onVariantSelect]
  );

  const toggleSection = useCallback(
    (section: SectionType) => {
      if (animating) return;

      setAnimating(section);
      setOpenSection((currentSection) =>
        currentSection === section ? "About this product" : section
      );
    },
    [animating]
  );

  const renderSection = (
    title: SectionType,
    Component: React.ComponentType<any>,
    props: any = {}
  ) => (
    <div className="rounded-lg overflow-hidden">
      <button
        className="bg-[#292B30] flex justify-between w-full text-left text-base sm:text-lg border-b-[0.1px] border-gray-700 px-3 sm:px-6 md:px-12 lg:px-20 py-2 hover:bg-[#31333a] transition-colors focus:outline-none focus:ring-2 focus:ring-Red/30"
        onClick={() => toggleSection(title)}
        aria-expanded={openSection === title}
      >
        <span className="py-3 sm:py-4 flex items-center justify-between w-full">
          {title}
          <span
            className={`text-gray-400 transition-transform duration-300 ${
              openSection === title ? "rotate-180" : "rotate-0"
            }`}
          >
            <IoIosArrowDown />
          </span>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          openSection === title
            ? "max-h-[1000px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-gray-400 text-sm bg-[#212428] px-3 sm:px-6 md:px-12 lg:px-20 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-10">
          <Component product={product} {...props} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-px">
      {renderSection("About this product", ProductAbout)}
      {renderSection("Properties", ProductProperties, {
        onVariantSelect: handleVariantChange,
        selectedVariant,
      })}
      {renderSection("Description", ProductDescription)}
    </div>
  );
};

export default ProductDetails;
