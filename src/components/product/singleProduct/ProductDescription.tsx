import { useState } from "react";
import { Product } from "../../../utils/types";

const ProductDescription = ({ product }: { product: Product }) => {
  const [expanded, setExpanded] = useState(false);

  const description = product?.description || "";
  const safeDescription = typeof description === "string" ? description : "";
  const visibleDescription = expanded
    ? safeDescription
    : safeDescription.slice(0, 251);

  const shouldShowButton = safeDescription.length > 251;

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-xs sm:text-sm leading-relaxed">{visibleDescription}</p>

      {shouldShowButton && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};

export default ProductDescription;
