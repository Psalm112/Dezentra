import { useState, useEffect } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

interface QuantitySelectorProps {
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
  availableQuantity?: number;
}

const QuantitySelector = ({
  min = 1,
  max = 99,
  onChange,
  availableQuantity,
}: QuantitySelectorProps) => {
  const [quantity, setQuantity] = useState(1);

  const effectiveMax =
    availableQuantity !== undefined ? Math.min(max, availableQuantity) : max;

  // Reset quantity if available quantity changes
  useEffect(() => {
    if (availableQuantity !== undefined) {
      const newQuantity = Math.min(quantity, availableQuantity);
      if (newQuantity !== quantity) {
        setQuantity(newQuantity);
        onChange(newQuantity);
      }
    }
  }, [availableQuantity, quantity, onChange]);

  const handleDecrease = () => {
    if (quantity > min) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onChange(newQuantity);
    }
  };

  const handleIncrease = () => {
    if (quantity < effectiveMax) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      onChange(newQuantity);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= effectiveMax) {
      setQuantity(value);
      onChange(value);
    }
  };

  return (
    <div className="flex items-center">
      <span className="text-sm text-gray-400 mr-3">Quantity:</span>
      <div className="flex items-center bg-[#31333a] rounded-lg">
        <button
          onClick={handleDecrease}
          disabled={quantity <= min}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
          aria-label="Decrease quantity"
        >
          <FiMinus />
        </button>

        <input
          type="text"
          value={quantity}
          onChange={handleInputChange}
          className="w-10 bg-transparent text-center text-white focus:outline-none"
          aria-label="Product quantity"
        />

        <button
          onClick={handleIncrease}
          disabled={quantity >= effectiveMax}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
          aria-label="Increase quantity"
        >
          <FiPlus />
        </button>
      </div>
    </div>
  );
};

export default QuantitySelector;
