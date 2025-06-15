import {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiX, FiPlus, FiVideo, FiTag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useProductData } from "../../../../utils/hooks/useProduct";
import Button from "../../../common/Button";
import { useCurrencyConverter } from "../../../../utils/hooks/useCurrencyConverter";
import { LogisticsProvider } from "../../../../utils/types";
import { useSnackbar } from "../../../../context/SnackbarContext";
import { useContract } from "../../../../utils/hooks/useContract";

const LoadingSpinner = lazy(() => import("../../../common/LoadingSpinner"));

interface CreateProductProps {
  onProductCreated?: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  price?: string;
  media?: string;
  stock?: string;
  logistics?: string;
  variants?: string;
  sellerWalletAddress?: string;
  submit?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface ProductVariant {
  id: string;
  properties: {
    name: string;
    value: string;
  }[];
  quantity: number;
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILES = 5;
const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Art Work",
  "Accessories",
  "Other",
];

// const logisticsProviders: LogisticsProvider[] = [];

const NIGERIAN_CITIES = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Kano",
  "Ibadan",
  "Kaduna",
  "Enugu",
  "Benin City",
  "Owerri",
  "Calabar",
  "Warri",
  "Abeokuta",
  "Onitsha",
  "Uyo",
  "Maiduguri",
];

const COMPANY_PREFIXES = [
  "Swift",
  "Express",
  "Global",
  "Royal",
  "Premium",
  "Fast",
  "Reliable",
  "Elite",
  "Prime",
  "Rapid",
];

const COMPANY_SUFFIXES = [
  "Logistics",
  "Delivery",
  "Shipping",
  "Courier",
  "Transport",
  "Express",
  "Cargo",
  "Freight",
  "Distribution",
  "Movers",
];

const fadeInAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.3 },
};

const CreateProduct: React.FC<CreateProductProps> = ({ onProductCreated }) => {
  const navigate = useNavigate();
  const { createProduct, loading } = useProductData();
  const { showSnackbar } = useSnackbar();
  const { convertPrice, userCountry } = useCurrencyConverter();
  const {
    getLogisticsProviders,
    logisticsProviders: apiResponse,
    logisticsProviderLoading,
  } = useContract();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formState, setFormState] = useState({
    name: "",
    description: "",
    category: "",
    stock: "",
    sellerWalletAddress: "",
    priceInUSDT: "",
    priceInFiat: "",
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inputFocus, setInputFocus] = useState<"USDT" | "FIAT" | null>(null);
  const [selectedLogistics, setSelectedLogistics] = useState<
    LogisticsProvider[]
  >([]);
  const [searchLogistics, setSearchLogistics] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: `variant-${Date.now()}`, properties: [], quantity: 0 },
  ]);
  const [currentVariantProperty, setCurrentVariantProperty] = useState({
    variantIndex: 0,
    name: "",
    value: "",
  });

  const updateVariantQuantity = (index: number, quantity: string) => {
    const numericValue = parseInt(quantity, 10);

    setVariants((prev) => {
      const updated = [...prev];
      updated[index].quantity = isNaN(numericValue) ? 0 : numericValue;
      return updated;
    });

    if (errors.variants) {
      setErrors((prev) => ({ ...prev, variants: undefined }));
    }
  };

  const getTotalVariantQuantity = useCallback(() => {
    return variants.reduce((sum, variant) => sum + (variant.quantity || 0), 0);
  }, [variants]);

  const updateFormField = (field: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchLogistics);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchLogistics]);

  // conversion between USDT and local currency
  const handleUSDTChange = useCallback(
    (value: string) => {
      updateFormField("priceInUSDT", value);

      if (value.trim() === "") {
        updateFormField("priceInFiat", "");
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const fiatValue = convertPrice(numValue, "USDT", "FIAT");
        updateFormField("priceInFiat", fiatValue.toFixed(2));
      }
    },
    [convertPrice]
  );

  const handleFiatChange = useCallback(
    (value: string) => {
      updateFormField("priceInFiat", value);

      if (value.trim() === "") {
        updateFormField("priceInUSDT", "");
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const usdtValue = convertPrice(numValue, "FIAT", "USDT");
        updateFormField("priceInUSDT", usdtValue.toFixed(2));
      }
    },
    [convertPrice]
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setSearchLogistics(e.target.value);
    } catch (error) {
      console.error("Error in search:", error);
      setSearchLogistics("");
    }
  };

  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);

    if (mediaFiles.length + newFiles.length > MAX_FILES) {
      setErrors((prev) => ({
        ...prev,
        media: `You can only upload a maximum of ${MAX_FILES} files`,
      }));
      return;
    }

    const result = processMediaFiles(newFiles);

    if (result.errorMessage) {
      setErrors((prev) => ({ ...prev, media: result.errorMessage }));
      if (result.validFiles.length === 0) return;
    } else {
      setErrors((prev) => ({ ...prev, media: undefined }));
    }

    setMediaFiles((prev) =>
      [...prev, ...result.validFiles].slice(0, MAX_FILES)
    );
  };

  const processMediaFiles = (
    files: File[]
  ): {
    validFiles: MediaFile[];
    errorMessage: string;
  } => {
    const validFiles: MediaFile[] = [];
    const oversizedFiles: string[] = [];
    const invalidTypeFiles: string[] = [];

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file.name);
        return;
      }

      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : null;

      if (!fileType) {
        invalidTypeFiles.push(file.name);
        return;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: fileType,
      });
    });

    let errorMessage = "";
    if (oversizedFiles.length > 0) {
      errorMessage += `Files exceeding 5MB: ${oversizedFiles.join(", ")}. `;
    }
    if (invalidTypeFiles.length > 0) {
      errorMessage += `Unsupported file types: ${invalidTypeFiles.join(
        ", "
      )}. `;
    }

    return { validFiles, errorMessage: errorMessage.trim() };
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaFiles[index].preview);
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, media: undefined }));
  };

  useEffect(() => {
    return () => {
      mediaFiles.forEach((media) => URL.revokeObjectURL(media.preview));
    };
  }, []);

  const addVariantProperty = () => {
    if (!currentVariantProperty.name || !currentVariantProperty.value) return;

    const propertyNameLower = currentVariantProperty.name.toLowerCase();

    const isDuplicate = variants[
      currentVariantProperty.variantIndex
    ].properties.some((prop) => prop.name.toLowerCase() === propertyNameLower);

    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        variants: `Property "${currentVariantProperty.name}" already exists for this variant`,
      }));
      return;
    }

    setVariants((prev) => {
      const newVariants = [...prev];
      newVariants[currentVariantProperty.variantIndex].properties.push({
        name: currentVariantProperty.name,
        value: currentVariantProperty.value,
      });
      return newVariants;
    });

    setErrors((prev) => ({ ...prev, variants: undefined }));
    setCurrentVariantProperty({
      ...currentVariantProperty,
      name: "",
      value: "",
    });
  };

  const addNewVariant = () => {
    setVariants((prev) => [
      ...prev,
      { id: `variant-${Date.now()}`, properties: [], quantity: 0 },
    ]);
    // Set active variant to the newly added one
    setCurrentVariantProperty({
      variantIndex: variants.length,
      name: "",
      value: "",
    });
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return; // Keep at least one variant

    setVariants((prev) => prev.filter((_, i) => i !== index));

    setCurrentVariantProperty((prev) => ({
      ...prev,
      variantIndex:
        prev.variantIndex >= index
          ? Math.max(prev.variantIndex - 1, 0)
          : prev.variantIndex,
    }));
  };

  const removeProperty = (variantIndex: number, propertyIndex: number) => {
    setVariants((prev) => {
      const newVariants = [...prev];
      newVariants[variantIndex].properties.splice(propertyIndex, 1);
      return newVariants;
    });
  };

  const formatVariantsForBackend = useCallback((): Array<
    Record<string, string | number>
  > => {
    const validVariants = variants.filter(
      (variant) => variant.properties.length > 0
    );

    if (validVariants.length === 0) return [];

    return validVariants.map((variant) => {
      const variantObject: Record<string, string | number> = {
        quantity: variant.quantity || 0,
      };

      variant.properties.forEach((prop) => {
        // Convert property name to lowercase for backend
        const propNameLower = prop.name.toLowerCase();
        const numValue = Number(prop.value);
        variantObject[propNameLower] =
          !isNaN(numValue) && prop.value.trim() !== "" ? numValue : prop.value;
      });

      return variantObject;
    });
  }, [variants]);

  const handleVariantSelection = (idx: number) => {
    if (currentVariantProperty.variantIndex === idx) return;

    setVariants((prev) => {
      const newVariants = [...prev];
      const [selectedVariant] = newVariants.splice(idx, 1);
      newVariants.unshift(selectedVariant);

      setCurrentVariantProperty({
        ...currentVariantProperty,
        variantIndex: 0,
      });

      return newVariants;
    });
  };

  // Logistics providers management
  const toggleLogisticsProvider = useCallback((provider: LogisticsProvider) => {
    setSelectedLogistics((prev) => {
      const isSelected = prev.some((p) => p.address === provider.address);
      if (isSelected) {
        return prev.filter((p) => p.address !== provider.address);
      } else {
        return [...prev, provider];
      }
    });

    setErrors((prev) => ({ ...prev, logistics: undefined }));
  }, []);

  const generateRandomLogisticsData = useCallback((address: string) => {
    const randomPrefix =
      COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)];
    const randomSuffix =
      COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)];
    const randomCity =
      NIGERIAN_CITIES[Math.floor(Math.random() * NIGERIAN_CITIES.length)];
    const randomCost = Math.floor(Math.random() * 4) + 1;

    return {
      address,
      name: `${randomPrefix} ${randomSuffix}`,
      location: `${randomCity}, Nigeria`,
      cost: randomCost,
    };
  }, []);

  const transformedLogisticsProviders = useMemo(() => {
    if (!apiResponse || !Array.isArray(apiResponse.data)) return [];
    return apiResponse.data.map(generateRandomLogisticsData);
  }, [apiResponse, generateRandomLogisticsData]);

  useEffect(() => {
    getLogisticsProviders();
  }, [getLogisticsProviders]);

  const filteredLogistics = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return transformedLogisticsProviders;
    }

    const searchTerm = debouncedSearchTerm.toLowerCase().trim();
    return transformedLogisticsProviders.filter(
      (provider) =>
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.location.toLowerCase().includes(searchTerm)
    );
  }, [debouncedSearchTerm, transformedLogisticsProviders]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const {
      name,
      description,
      category,
      priceInUSDT,
      stock,
      sellerWalletAddress,
    } = formState;

    // Basic validation
    if (!name.trim()) newErrors.name = "Product name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!category) newErrors.category = "Category is required";

    // Price validation
    if (!priceInUSDT.trim()) {
      newErrors.price = "Price is required";
    } else {
      const price = parseFloat(priceInUSDT);
      if (isNaN(price)) {
        newErrors.price = "Price must be a valid number";
      } else if (price <= 0) {
        newErrors.price = "Price must be greater than zero";
      }
    }

    // Stock validation
    if (!stock.trim()) {
      newErrors.stock = "Stock quantity is required";
    } else {
      const stockNum = Number(stock);
      if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum <= 0) {
        newErrors.stock = "Stock must be a positive whole number";
      }
    }

    // Wallet address validation
    if (!sellerWalletAddress.trim()) {
      newErrors.sellerWalletAddress = "Seller wallet address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(sellerWalletAddress)) {
      newErrors.sellerWalletAddress = "Invalid Ethereum wallet address format";
    }

    // Logistics provider validation
    if (selectedLogistics.length === 0) {
      newErrors.logistics = "Please select at least one logistics provider";
    }

    // Check for variants with no properties
    const nonEmptyVariants = variants.filter((v) => v.properties.length > 0);
    if (variants.length > 1 && nonEmptyVariants.length < variants.length) {
      newErrors.variants = "Please fill all variants or remove empty ones";
    }

    // Check if any variant is missing quantity
    const missingQuantity = nonEmptyVariants.some((v) => !v.quantity);
    if (missingQuantity) {
      newErrors.variants = "Please specify quantity for all variants";
    }

    // Check if total variant quantity is not equal to product stock
    const totalVariantQuantity = getTotalVariantQuantity();
    const stockQuantity = parseInt(formState.stock, 10) || 0;

    if (nonEmptyVariants.length > 0 && totalVariantQuantity !== stockQuantity) {
      newErrors.variants = `Total variant quantity (${totalVariantQuantity}) exceeds available stock (${stockQuantity})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState, selectedLogistics, variants]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrors((prev) => ({
        ...prev,
        submit: "Please fix the highlighted errors before submitting.",
      }));
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      const {
        name,
        description,
        category,
        priceInUSDT,
        stock,
        sellerWalletAddress,
      } = formState;

      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("price", priceInUSDT);
      formData.append("stock", stock);
      formData.append("sellerWalletAddress", sellerWalletAddress);
      formData.append("useUSDT", "true");

      if (selectedLogistics.length > 0) {
        // const addresses = selectedLogistics.map((provider) => provider.address);
        // const costs = selectedLogistics.map(
        //   (provider) => provider.cost
        //   // * Math.pow(10, 18)
        // );
        selectedLogistics.map((provider) =>
          formData.append("logisticsProviders", provider.address)
        );
        selectedLogistics.map((provider) => {
          formData.append("logisticsCosts", provider.cost.toString());
        });
        // formData.append("logisticsProviders", JSON.stringify(addresses));
        // formData.append("logisticsCosts", JSON.stringify(costs));
      }

      // Add variants if available
      const variantsArray = formatVariantsForBackend();
      if (variantsArray.length > 0) {
        formData.append("type", JSON.stringify(variantsArray));
      }

      mediaFiles.forEach((media) => {
        formData.append(`images`, media.file);
      });

      const result = await createProduct(formData);
      console.log(result);
      if (result.data) {
        setSuccessMessage("Product created successfully! Redirecting...");
        showSnackbar("Product created successfully!", "success");

        onProductCreated?.();

        // console.log(result, "kk");
        // setTimeout(() => {
        //   navigate(`/product/${result.data._id}`);
        // }, 1500);
        setTimeout(() => {
          setFormState({
            name: "",
            description: "",
            category: "",
            stock: "",
            sellerWalletAddress: "",
            priceInUSDT: "",
            priceInFiat: "",
          });
          setMediaFiles([]);
          setVariants([
            { id: `variant-${Date.now()}`, properties: [], quantity: 0 },
          ]);
          setSelectedLogistics([]);
          setSuccessMessage(null);
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to create product. Please try again.",
      }));
      showSnackbar("Failed to create product. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // keyboard events for accessibility
  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  return (
    <motion.div
      className="w-full mx-auto py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.form
        ref={formRef}
        onSubmit={handleSubmit}
        className="bg-[#292B30] rounded-lg p-4 md:p-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="space-y-6">
          {/* Product Media Files */}
          <section aria-labelledby="media-section">
            <h3 id="media-section" className="block text-white mb-2">
              Product Media (Images & Videos)
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-2">
              <AnimatePresence mode="popLayout">
                {mediaFiles.map((media, index) => (
                  <motion.div
                    key={`media-${index}-${media.file.name}`}
                    className="relative aspect-square rounded-lg overflow-hidden bg-[#333]"
                    {...fadeInAnimation}
                    whileHover={{ scale: 1.05 }}
                    layout
                  >
                    {media.type === "image" ? (
                      <img
                        src={media.preview}
                        alt={`Product preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5JbWFnZSBFcnJvcjwvdGV4dD48L3N2Zz4=";
                        }}
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={media.preview}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                          playsInline
                          onMouseOver={(e) => {
                            const video = e.target as HTMLVideoElement;
                            if (video.paused) video.play().catch(() => {});
                          }}
                          onMouseOut={(e) => {
                            const video = e.target as HTMLVideoElement;
                            if (!video.paused) {
                              video.pause();
                              video.currentTime = 0;
                            }
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <FiVideo className="text-white text-2xl opacity-80" />
                        </div>
                      </div>
                    )}
                    <motion.button
                      type="button"
                      className="absolute top-2 right-2 bg-Red rounded-full w-6 h-6 flex items-center justify-center text-white"
                      onClick={() => removeMedia(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={`Remove media ${index + 1}`}
                    >
                      <FiX size={16} />
                    </motion.button>
                  </motion.div>
                ))}

                {mediaFiles.length < MAX_FILES && (
                  <motion.button
                    type="button"
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:border-Red hover:text-Red transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Add media"
                    layout
                  >
                    <div className="flex gap-2">
                      <FiImage size={20} aria-hidden="true" />
                      <FiVideo size={20} aria-hidden="true" />
                    </div>
                    <span className="text-xs mt-2">Add Media</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="hidden"
              aria-hidden="true"
            />

            {errors.media && (
              <p className="text-Red text-sm mt-1" role="alert">
                {errors.media}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              Upload up to 5 images or videos (max 5MB each). First file will be
              the main product preview.
            </p>
          </section>

          {/* Product Name */}
          <section aria-labelledby="name-section">
            <label
              id="name-section"
              htmlFor="name"
              className="block text-white mb-2"
            >
              Product Name
            </label>
            <input
              id="name"
              ref={nameInputRef}
              type="text"
              value={formState.name}
              onChange={(e) => updateFormField("name", e.target.value)}
              className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                errors.name ? "border border-Red" : ""
              }`}
              placeholder="Enter product name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-Red text-sm mt-1" role="alert">
                {errors.name}
              </p>
            )}
          </section>

          {/* Description */}
          <section aria-labelledby="description-section">
            <label
              id="description-section"
              htmlFor="description"
              className="block text-white mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formState.description}
              onChange={(e) => updateFormField("description", e.target.value)}
              rows={4}
              className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                errors.description ? "border border-Red" : ""
              }`}
              placeholder="Describe your product"
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
            />
            {errors.description && (
              <p
                id="description-error"
                className="text-Red text-sm mt-1"
                role="alert"
              >
                {errors.description}
              </p>
            )}
          </section>

          {/* Category */}
          <section aria-labelledby="category-section">
            <label
              id="category-section"
              htmlFor="category"
              className="block text-white mb-2"
            >
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={formState.category}
                onChange={(e) => updateFormField("category", e.target.value)}
                className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all appearance-none ${
                  errors.category ? "border border-Red" : ""
                }`}
                aria-invalid={!!errors.category}
                aria-describedby={
                  errors.category ? "category-error" : undefined
                }
              >
                <option value="" disabled>
                  Select a category
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                  />
                </svg>
              </div>
            </div>
            {errors.category && (
              <p
                id="category-error"
                className="text-Red text-sm mt-1"
                role="alert"
              >
                {errors.category}
              </p>
            )}
          </section>

          {/* Product Stock/Quantity */}
          <section aria-labelledby="stock-section">
            <label
              id="stock-section"
              htmlFor="stock"
              className="block text-white mb-2"
            >
              Stock Quantity
            </label>
            <input
              id="stock"
              type="number"
              min="1"
              inputMode="numeric"
              value={formState.stock}
              onChange={(e) => updateFormField("stock", e.target.value)}
              className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                errors.stock ? "border border-Red" : ""
              }`}
              placeholder="Enter available quantity"
              aria-invalid={!!errors.stock}
              aria-describedby={errors.stock ? "stock-error" : undefined}
            />
            {errors.stock && (
              <p
                id="stock-error"
                className="text-Red text-sm mt-1"
                role="alert"
              >
                {errors.stock}
              </p>
            )}
          </section>

          {/* Seller Wallet Address */}
          <section aria-labelledby="wallet-section">
            <label
              id="wallet-section"
              htmlFor="sellerWalletAddress"
              className="block text-white mb-2"
            >
              Wallet Address
            </label>
            <input
              id="sellerWalletAddress"
              type="text"
              value={formState.sellerWalletAddress}
              onChange={(e) =>
                updateFormField("sellerWalletAddress", e.target.value)
              }
              className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                errors.sellerWalletAddress ? "border border-Red" : ""
              }`}
              placeholder="Enter a valid celo/EVM wallet address"
              aria-invalid={!!errors.sellerWalletAddress}
              aria-describedby={
                errors.sellerWalletAddress ? "wallet-error" : undefined
              }
              pattern="^0x[a-fA-F0-9]{40}$"
            />
            {errors.sellerWalletAddress && (
              <p
                id="wallet-error"
                className="text-Red text-sm mt-1"
                role="alert"
              >
                {errors.sellerWalletAddress}
              </p>
            )}
          </section>

          {/* Product Variants/Types */}
          <section aria-labelledby="variants-section">
            <div className="flex justify-between items-center mb-2">
              <h3 id="variants-section" className="block text-white">
                Product Variants
              </h3>
              <Button
                title="Add Variant"
                type="button"
                className="bg-[#333] hover:bg-[#444] border-0 rounded-md px-3 py-1.5 text-white text-sm"
                onClick={addNewVariant}
                icon={<FiPlus size={14} aria-hidden="true" />}
                iconPosition="start"
                aria-label="Add new variant"
              />
            </div>

            {/* Variant guide */}
            {variants.length === 1 && variants[0].properties.length === 0 && (
              <div className="mb-3 bg-[#2A2C31] p-3 rounded-lg border border-[#444] text-sm">
                <p className="text-gray-300">
                  <span className="text-Red font-medium">Tip:</span> Add
                  variants for products with options like:
                </p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
                  <div>• Size: S, M, L, XL</div>
                  <div>• Color: Red, Blue, Black</div>
                  <div>• Material: Cotton, Silk</div>
                  <div>• Style: Classic, Modern</div>
                  <div>
                    • Each variant requires quantity (must total ≤ stock)
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Variant selector tabs */}
              <div className="space-y-3">
                <div className="flex overflow-x-auto pb-2 hide-scrollbar gap-2">
                  {variants.map((variant, idx) => (
                    <button
                      key={variant.id}
                      type="button"
                      className={`px-3 py-1 rounded text-sm transition-colors flex-shrink-0 ${
                        currentVariantProperty.variantIndex === idx
                          ? "bg-Red text-white"
                          : "bg-[#333] text-gray-300 hover:bg-[#444]"
                      }`}
                      onClick={() => handleVariantSelection(idx)}
                      aria-pressed={currentVariantProperty.variantIndex === idx}
                    >
                      Variant {idx + 1}
                      {idx > 0 && (
                        <span
                          className="ml-2 text-xs"
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVariant(idx);
                          }}
                          onKeyDown={(e) =>
                            handleKeyPress(e, () => removeVariant(idx))
                          }
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Property input  */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={currentVariantProperty.name}
                    onChange={(e) =>
                      setCurrentVariantProperty((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="bg-[#333] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all w-full sm:w-1/3"
                    placeholder="Property (e.g. size, color)"
                    aria-label="Variant property name"
                  />
                  <input
                    type="text"
                    value={currentVariantProperty.value}
                    onChange={(e) =>
                      setCurrentVariantProperty((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    className="bg-[#333] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all w-full sm:flex-1"
                    placeholder="Value (e.g. XL, red)"
                    aria-label="Variant property value"
                  />
                  <Button
                    title="Add"
                    type="button"
                    className="bg-[#333] hover:bg-[#444] border-0 rounded-md px-4 py-2 text-white"
                    onClick={addVariantProperty}
                    disabled={
                      !currentVariantProperty.name ||
                      !currentVariantProperty.value
                    }
                    icon={<FiPlus size={16} aria-hidden="true" />}
                  />
                </div>
              </div>

              {/* Display error for duplicate properties or empty variants */}
              {errors.variants && (
                <p className="text-Red text-sm" role="alert">
                  {errors.variants}
                </p>
              )}

              {/* Display variants */}
              <div className="max-h-80 overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {variants.map((variant, variantIndex) => (
                    <motion.div
                      key={variant.id}
                      className={`bg-[#333] rounded-lg p-3 space-y-2 mb-3 ${
                        currentVariantProperty.variantIndex === variantIndex
                          ? "ring-2 ring-Red"
                          : ""
                      }`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      layout
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="text-white text-sm font-medium">
                          Variant {variantIndex + 1}
                        </h4>
                      </div>

                      {/* Variant quantity input */}
                      <div className="flex items-center gap-2 mt-2">
                        <label
                          htmlFor={`variant-${variantIndex}-quantity`}
                          className="text-gray-400 text-sm whitespace-nowrap"
                        >
                          Quantity:
                        </label>
                        <input
                          id={`variant-${variantIndex}-quantity`}
                          type="number"
                          min="0"
                          value={variant.quantity || ""}
                          onChange={(e) =>
                            updateVariantQuantity(variantIndex, e.target.value)
                          }
                          className="bg-[#242529] text-white px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-Red transition-all w-20"
                          aria-label={`Variant ${variantIndex + 1} quantity`}
                        />
                      </div>

                      {variant.properties.length > 0 ? (
                        <div className="space-y-2">
                          {variant.properties.map((prop, propIndex) => (
                            <div
                              key={`${variant.id}-${propIndex}`}
                              className="flex items-center justify-between bg-[#242529] rounded px-3 py-2"
                            >
                              <div className="text-white text-sm">
                                <span className="text-gray-400">
                                  {prop.name}:
                                </span>{" "}
                                {prop.value}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  removeProperty(variantIndex, propIndex)
                                }
                                className="text-gray-400 hover:text-Red transition-colors"
                                aria-label={`Remove ${prop.name} property`}
                              >
                                <FiX size={14} aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm italic">
                          No properties added yet
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {/* Display variant quantity summary if variants exist */}
              {variants.some((v) => v.properties.length > 0) && (
                <div className="mt-2 bg-[#2A2C31] p-3 rounded-lg border border-[#444] text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">
                      Total variant quantity:
                    </span>
                    <span className="text-white font-medium">
                      {getTotalVariantQuantity()}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-300">Product stock:</span>
                    <span className="text-white font-medium">
                      {formState.stock || 0}
                    </span>
                  </div>
                  {getTotalVariantQuantity() >
                    parseInt(formState.stock || "0", 10) && (
                    <p className="text-Red text-sm mt-2">
                      Total variant quantity exceeds available stock
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Price - Dual Currency Input */}
          <section aria-labelledby="price-section">
            <h3 id="price-section" className="block text-white mb-2">
              Price
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* USDT Price */}
              <div className="relative">
                <input
                  id="priceUSDT"
                  type="text"
                  inputMode="decimal"
                  value={formState.priceInUSDT}
                  onChange={(e) => handleUSDTChange(e.target.value)}
                  onFocus={() => setInputFocus("USDT")}
                  onBlur={() => setInputFocus(null)}
                  className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                    errors.price ? "border border-Red" : ""
                  } ${inputFocus === "USDT" ? "ring-2 ring-Red" : ""}`}
                  placeholder="0.00"
                  aria-label="Price in USDT"
                  aria-invalid={!!errors.price}
                  aria-describedby={errors.price ? "price-error" : undefined}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  USDT
                </div>
              </div>

              {/* Local Currency Price */}
              <div className="relative">
                <input
                  id="priceFiat"
                  type="text"
                  inputMode="decimal"
                  value={formState.priceInFiat}
                  onChange={(e) => handleFiatChange(e.target.value)}
                  onFocus={() => setInputFocus("FIAT")}
                  onBlur={() => setInputFocus(null)}
                  className={`w-full bg-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-Red transition-all ${
                    inputFocus === "FIAT" ? "ring-2 ring-Red" : ""
                  }`}
                  placeholder="0.00"
                  aria-label={`Price in ${userCountry}`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {userCountry}
                </div>
              </div>
            </div>

            {errors.price && (
              <p
                id="price-error"
                className="text-Red text-sm mt-1"
                role="alert"
              >
                {errors.price}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-2">
              Enter the price in either USDT or your local currency. The
              conversion will happen automatically.
            </p>
          </section>

          {/* Logistics Providers */}
          <section aria-labelledby="logistics-section">
            <h3 id="logistics-section" className="block text-white mb-2">
              Logistics Providers <span className="text-Red">*</span>
            </h3>
            <div className="bg-[#333] rounded-lg overflow-hidden">
              <div className="p-3 border-b border-[#444]">
                <input
                  type="text"
                  value={searchLogistics}
                  onChange={handleSearchChange}
                  className="w-full bg-[#222] text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-Red transition-all"
                  placeholder="Search by name or location..."
                  aria-label="Search logistics providers"
                />
              </div>

              <div
                className="max-h-60 overflow-y-auto"
                role="listbox"
                aria-multiselectable="true"
                aria-label="Available logistics providers"
              >
                {logisticsProviderLoading ? (
                  <div className="p-4 text-center">
                    <Suspense fallback={<div className="w-6 h-6" />}>
                      <LoadingSpinner size="sm" color="white" />
                    </Suspense>
                  </div>
                ) : filteredLogistics.length > 0 ? (
                  filteredLogistics.map((provider) => {
                    const isSelected = selectedLogistics.some(
                      (p) => p.address === provider.address
                    );
                    return (
                      <div
                        key={provider.address}
                        className={`flex items-center justify-between p-3 hover:bg-[#3A3B3F] cursor-pointer ${
                          isSelected ? "bg-[#3A3B3F]" : ""
                        }`}
                        onClick={() => toggleLogisticsProvider(provider)}
                        onKeyDown={(e) =>
                          handleKeyPress(e, () =>
                            toggleLogisticsProvider(provider)
                          )
                        }
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="text-white font-medium truncate">
                            {provider.name}
                          </div>
                          <div className="text-gray-400 text-sm truncate">
                            {provider.location}
                          </div>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          <span className="text-gray-400 text-sm mr-3 whitespace-nowrap">
                            {provider.cost} USDT
                          </span>
                          <div
                            className={`w-5 h-5 rounded border ${
                              isSelected
                                ? "bg-Red border-Red"
                                : "border-gray-400"
                            } flex items-center justify-center`}
                            aria-hidden="true"
                          >
                            {isSelected && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-gray-400 text-center">
                    No providers match your search
                  </div>
                )}
              </div>
            </div>

            {/* Selected logistics */}
            {selectedLogistics.length > 0 && (
              <div className="mt-2">
                <div className="text-gray-400 text-sm">
                  Selected providers: {selectedLogistics.length}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedLogistics.map((provider) => (
                    <div
                      key={provider.address}
                      className="bg-[#3A3B3F] text-white text-sm px-3 py-1 rounded-full flex items-center"
                    >
                      <span className="truncate max-w-[150px]">
                        {provider.name}
                      </span>
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-Red flex-shrink-0"
                        onClick={() => toggleLogisticsProvider(provider)}
                        aria-label={`Remove ${provider.name}`}
                      >
                        <FiX size={14} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error for logistics */}
            {errors.logistics && (
              <p className="text-Red text-sm mt-1" role="alert">
                {errors.logistics}
              </p>
            )}
          </section>

          {/* Submit Button */}
          <div className="pt-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                title={isSubmitting ? "Creating Product..." : "Create Product"}
                className="w-full bg-Red border-0 rounded text-white py-3 transition-colors hover:bg-[#e02d37] flex items-center justify-center gap-2"
                type="submit"
                disabled={isSubmitting || loading}
                iconPosition="start"
                icon={
                  isSubmitting ? (
                    <Suspense fallback={<div className="w-5 h-5" />}>
                      <LoadingSpinner size="sm" color="white" />
                    </Suspense>
                  ) : (
                    <FiPlus aria-hidden="true" />
                  )
                }
              />
            </motion.div>

            {errors.submit && (
              <p className="text-Red text-sm mt-2 text-center" role="alert">
                {errors.submit}
              </p>
            )}

            {successMessage && (
              <motion.p
                className="text-green-400 text-center mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="status"
              >
                {successMessage}
              </motion.p>
            )}
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default CreateProduct;
