import { useState, useEffect, useMemo, useCallback } from "react";
import { MdCheck } from "react-icons/md";
import { Product, ProductVariant } from "../../../utils/types";

interface PropertyOption {
  id: string;
  name: string;
  value: string;
  hex?: string;
  isAvailable: boolean;
}

interface VariantProperties {
  [key: string]: PropertyOption[];
}

interface ProductPropertiesProps {
  product: Product;
  onVariantSelect?: (variant: ProductVariant) => void;
  selectedVariant?: ProductVariant;
}

const getColorHex = (color: string): string => {
  const colorMap: Record<string, string> = {
    red: "#ff343f",
    blue: "#3e66fb",
    yellow: "#ffb800",
    green: "#4caf50",
    purple: "#9c27b0",
    black: "#000000",
    white: "#ffffff",
    brown: "#795548",
    pink: "#e91e63",
    orange: "#ff9800",
    tan: "#d2b48c",
    gray: "#9e9e9e",
    silver: "#c0c0c0",
    gold: "#ffd700",
    terracotta: "#e2725b",
    natural: "#e6d2b5",
    "rose gold": "#b76e79",
    mixed: "#7986cb",
    cherry: "#8b4513",
    oak: "#deb887",
    walnut: "#5c4033",
    light: "#f5f5f5",
    dark: "#333333",
  };

  return colorMap[color.toLowerCase()] || "#cccccc";
};

const ProductProperties = ({
  product,
  onVariantSelect,
  selectedVariant,
}: ProductPropertiesProps) => {
  const [internalUpdate, setInternalUpdate] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const normalizeKey = useCallback((key: string): string => {
    const keyMap: Record<string, string> = {
      colour: "color",
    };
    return keyMap[key.toLowerCase()] || key;
  }, []);

  const denormalizeKey = useCallback(
    (normalizedKey: string, variant: ProductVariant): string => {
      if (normalizedKey === "color" && variant.hasOwnProperty("colour")) {
        return "colour";
      }
      return normalizedKey;
    },
    []
  );

  // Extract variant properties
  const variantProperties = useMemo<VariantProperties>(() => {
    if (
      !product?.type ||
      !Array.isArray(product.type) ||
      product.type.length === 0
    ) {
      return {};
    }

    const properties: VariantProperties = {};
    const propertyKeys = Array.from(
      new Set(
        product.type.flatMap((variant) =>
          Object.keys(variant).filter((key) => key !== "quantity")
        )
      )
    );

    propertyKeys.forEach((key) => {
      const normalizedKey = normalizeKey(key);

      // Get unique values for this property
      const values = Array.from(
        new Set(
          product.type
            .filter((variant) => variant[key] !== undefined)
            .map((variant) => String(variant[key]))
        )
      );

      properties[normalizedKey] = values.map((value) => {
        const isAvailable = product.type.some(
          (variant) => String(variant[key]) === value && variant.quantity > 0
        );

        const isColorProperty =
          normalizedKey.toLowerCase() === "color" ||
          key.toLowerCase() === "colour" ||
          normalizedKey.toLowerCase().includes("material") ||
          normalizedKey.toLowerCase() === "wood" ||
          normalizedKey.toLowerCase() === "wash";

        return {
          id: value,
          name: value,
          value: value,
          isAvailable,
          hex: isColorProperty ? getColorHex(value) : undefined,
        };
      });
    });

    return properties;
  }, [product?.type, normalizeKey]);

  const findMatchingVariant = useCallback((): ProductVariant | undefined => {
    if (!product?.type || Object.keys(selectedOptions).length === 0)
      return undefined;

    return product.type.find((variant) => {
      return Object.entries(selectedOptions).every(([key, value]) => {
        const variantKey = denormalizeKey(key, variant);
        return String(variant[variantKey]) === value;
      });
    });
  }, [product?.type, selectedOptions, denormalizeKey]);

  // Get available options for a property based on current selections
  const getAvailableOptionsForProperty = useCallback(
    (propertyId: string): Set<string> => {
      if (!product?.type) return new Set();

      // For each property, we need to consider only variants that match all other selected options
      const availableOptions = new Set<string>();

      product.type.forEach((variant) => {
        // Check if this variant matches all other selected options
        const matchesOtherSelections = Object.entries(selectedOptions).every(
          ([key, value]) => {
            if (key === propertyId) return true; // Skip the current property
            const variantKey = denormalizeKey(key, variant);
            return String(variant[variantKey]) === value;
          }
        );

        if (matchesOtherSelections && variant.quantity > 0) {
          const variantKey = denormalizeKey(propertyId, variant);
          if (variant[variantKey] !== undefined) {
            availableOptions.add(String(variant[variantKey]));
          }
        }
      });

      return availableOptions;
    },
    [product?.type, selectedOptions, denormalizeKey]
  );

  // Initialize with first available variant
  useEffect(() => {
    if (Object.keys(variantProperties).length === 0) return;

    // Don't initialize if we already have selections
    if (Object.keys(selectedOptions).length > 0) return;

    const initialOptions: Record<string, string> = {};

    // Try to find first available variant
    const availableVariant = product?.type?.find(
      (variant) => variant.quantity > 0
    );

    if (availableVariant) {
      // Use the available variant's properties
      Object.entries(availableVariant).forEach(([key, value]) => {
        if (key !== "quantity") {
          const normalizedKey = normalizeKey(key);
          initialOptions[normalizedKey] = String(value);
        }
      });
      setSelectedOptions(initialOptions);
    } else if (product?.type && product.type.length > 0) {
      // Fallback to first variant regardless of availability
      Object.entries(product.type[0]).forEach(([key, value]) => {
        if (key !== "quantity") {
          const normalizedKey = normalizeKey(key);
          initialOptions[normalizedKey] = String(value);
        }
      });
      setSelectedOptions(initialOptions);
    }
  }, [variantProperties, product?.type, normalizeKey, selectedOptions]);

  // Update selected options when variant changes externally
  useEffect(() => {
    if (!selectedVariant || internalUpdate) {
      setInternalUpdate(false);
      return;
    }

    const newSelection: Record<string, string> = {};
    Object.entries(selectedVariant).forEach(([key, value]) => {
      if (key !== "quantity") {
        const normalizedKey = normalizeKey(key);
        newSelection[normalizedKey] = String(value);
      }
    });

    // Only update if different from current selection
    const isDifferent = Object.entries(newSelection).some(
      ([key, value]) => selectedOptions[key] !== value
    );

    if (isDifferent) {
      setSelectedOptions(newSelection);
    }
  }, [selectedVariant, normalizeKey, internalUpdate, selectedOptions]);

  // Notify parent when selection changes
  useEffect(() => {
    if (!onVariantSelect || Object.keys(selectedOptions).length === 0) return;

    const matchingVariant = findMatchingVariant();
    if (matchingVariant) {
      setInternalUpdate(true);
      console.log("matchingVariant", matchingVariant);
      onVariantSelect(matchingVariant);
    }
  }, [selectedOptions, onVariantSelect, findMatchingVariant]);

  const handleOptionSelect = useCallback(
    (propertyId: string, optionId: string) => {
      setSelectedOptions((prev) => {
        // Don't update if already selected
        if (prev[propertyId] === optionId) return prev;

        const newSelection = { ...prev, [propertyId]: optionId };

        // Check if this creates an invalid selection
        // If so, we need to reset other properties to create a valid combination
        const tempVariant = product?.type?.find((variant) => {
          return Object.entries(newSelection).every(([key, value]) => {
            const variantKey = denormalizeKey(key, variant);
            return key === propertyId
              ? String(variant[variantKey]) === value
              : String(variant[variantKey]) === value;
          });
        });

        if (!tempVariant) {
          // Find a variant that at least matches the current property selection
          const matchingVariant =
            product?.type?.find((variant) => {
              const variantKey = denormalizeKey(propertyId, variant);
              return (
                String(variant[variantKey]) === optionId && variant.quantity > 0
              );
            }) ||
            product?.type?.find((variant) => {
              const variantKey = denormalizeKey(propertyId, variant);
              return String(variant[variantKey]) === optionId;
            });

          if (matchingVariant) {
            // Create a new selection based on this variant
            const resetSelection: Record<string, string> = {};
            Object.entries(matchingVariant).forEach(([key, value]) => {
              if (key !== "quantity") {
                const normalizedKey = normalizeKey(key);
                resetSelection[normalizedKey] = String(value);
              }
            });
            return resetSelection;
          }
        }

        return newSelection;
      });
    },
    [product?.type, normalizeKey, denormalizeKey]
  );

  // Display loading state if no product variants
  if (
    !product?.type ||
    !Array.isArray(product.type) ||
    product.type.length === 0
  ) {
    return <div className="text-gray-400">No product variants available.</div>;
  }

  // Current selected variant
  const currentVariant = findMatchingVariant();

  return (
    <div className="space-y-5 sm:space-y-6">
      {Object.entries(variantProperties).map(([propertyId, options]) => {
        // Get available options for dynamic UI feedback
        const availableOptions = getAvailableOptionsForProperty(propertyId);

        return (
          <div key={propertyId} className="space-y-2">
            <p className="text-white text-sm sm:text-base mb-2 capitalize">
              {propertyId}
            </p>

            {options[0]?.hex ? (
              // Color/Material selection
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {options.map((option) => {
                  // An option is available if it's in available options or is currently selected
                  const isSelectable =
                    availableOptions.has(option.id) ||
                    selectedOptions[propertyId] === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(propertyId, option.id)}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full relative transition-all
                        ${
                          !isSelectable
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:scale-110"
                        }
                        ${
                          selectedOptions[propertyId] === option.id
                            ? "ring-2 ring-white ring-offset-1 ring-offset-[#212428]"
                            : ""
                        }`}
                      style={{ backgroundColor: option.hex }}
                      aria-label={option.name}
                      disabled={!isSelectable}
                      title={option.name}
                    >
                      {selectedOptions[propertyId] === option.id && (
                        <span className="absolute inset-0 flex items-center justify-center text-white">
                          <MdCheck size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Text-based selection
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {options.map((option) => {
                  const isSelectable =
                    availableOptions.has(option.id) ||
                    selectedOptions[propertyId] === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(propertyId, option.id)}
                      disabled={!isSelectable}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all 
                        ${
                          selectedOptions[propertyId] === option.id
                            ? "bg-Red text-white"
                            : "text-white/70 hover:bg-gray-700/50"
                        } 
                        ${
                          !isSelectable ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                      title={option.name}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {currentVariant && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-sm">
            {currentVariant.quantity > 0 ? (
              currentVariant.quantity < 10 ? (
                <span className="text-yellow-500">
                  Only {currentVariant.quantity} left for this variant
                </span>
              ) : (
                <span className="text-green-500">
                  In stock ({currentVariant.quantity} available)
                </span>
              )
            ) : (
              <span className="text-red-500">Out of stock</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductProperties;
