import { motion } from "framer-motion";
import { RiEdit2Fill } from "react-icons/ri";
import { useRef, useState, useEffect } from "react";

interface ProfilePictureProps {
  avatar: string;
  onImageChange?: (file: File | null) => void;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  avatar,
  onImageChange,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when avatar changes from parent
  useEffect(() => {
    if (avatar && !previewImage) {
      setPreviewImage(avatar);
    }
  }, [avatar]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
        alert("Please select a valid image file (JPG, PNG, GIF, WEBP)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        if (onImageChange) {
          onImageChange(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="relative">
        <motion.img
          src={previewImage || avatar}
          className="w-24 h-24 sm:w-[110px] sm:h-[110px] rounded-full object-cover border-2 border-Red"
          alt="User profile"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <motion.button
          type="button"
          className="absolute bottom-0 right-0 bg-Red p-2 rounded-full"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
        >
          <RiEdit2Fill className="text-white text-sm" />
        </motion.button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </motion.div>
  );
};

export default ProfilePicture;
