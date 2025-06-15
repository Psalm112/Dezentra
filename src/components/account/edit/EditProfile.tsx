import { motion } from "framer-motion";
import { LiaAngleLeftSolid } from "react-icons/lia";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ProfilePicture from "./ProfilePicture";
import ProfileField from "./ProfileField";
import PhoneInput from "./PhoneInput";
import DatePickerField from "./DatePickerField";
// import Button from "../../common/Button";
import { useSnackbar } from "../../../context/SnackbarContext";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "../../common/ErrorFallback";
import { useUserManagement } from "../../../utils/hooks/useUser";

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  dateOfBirth: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Invalid date format (MM/DD/YYYY)"),
  email: z.string().email("Please enter a valid email address").optional(),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  profileImage: z.any().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileProps {
  avatar: string;
  setViewState: () => void;
  currentProfile: {
    name: string;
    dob: string;
    email: string;
    phone: string;
    address?: string;
  };
}

const EditProfile: React.FC<EditProfileProps> = ({
  avatar,
  setViewState,
  currentProfile,
}) => {
  const { updateProfile } = useUserManagement();
  const { showSnackbar } = useSnackbar();
  const [countryCode, setCountryCode] = useState("US");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Parse the date from MM/DD/YYYY format
  const parseDateString = (dateStr: string) => {
    if (!dateStr)
      return { day: 1, month: "January", year: new Date().getFullYear() };

    const [month, day, year] = dateStr.split("/").map(Number);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return {
      day: day || 1,
      month: months[month - 1] || "January",
      year: year || new Date().getFullYear(),
    };
  };

  const [selectedDate, setSelectedDate] = useState(
    parseDateString(currentProfile.dob)
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
    // watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentProfile.name,
      dateOfBirth: currentProfile.dob,
      email: currentProfile.email,
      phoneNumber: currentProfile.phone,
      address: currentProfile.address || "",
    },
  });

  // const watchedEmail = watch("email");

  const handleProfileImageChange = (file: File | null) => {
    setProfileImageFile(file);
  };

  const onDateSelect = (day: number, month: string, year: number) => {
    setSelectedDate({ day, month, year });
    // Format date as MM/DD/YYYY for form submission
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthNum = months.indexOf(month) + 1;
    const formattedDate = `${monthNum.toString().padStart(2, "0")}/${day
      .toString()
      .padStart(2, "0")}/${year}`;
    setValue("dateOfBirth", formattedDate, { shouldDirty: true });
    setShowDatePicker(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const submitData = { ...data };
      if (profileImageFile) {
        submitData.profileImage = profileImageFile;
      }
      const success = await updateProfile(data);
      // await dispatch(updateUserProfile(submitData)).unwrap();
      if (success) {
        showSnackbar("Profile updated successfully", "success");
      }
    } catch (error) {
      showSnackbar((error as string) || "Failed to update profile", "error");
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={setViewState}>
      <motion.div
        className="mt-4 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            aria-label="Back to Profile"
            className="hover:opacity-80 transition-opacity"
            transition={{ type: "spring", stiffness: 300 }}
            onClick={setViewState}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <LiaAngleLeftSolid className="text-white text-2xl" />
          </motion.button>
          <h3 className="text-white text-2xl font-semibold">Edit Profile</h3>
        </div>

        <motion.form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <ProfilePicture
            avatar={avatar}
            onImageChange={handleProfileImageChange}
          />

          <div className="space-y-4 mt-6">
            <ProfileField
              label=""
              icon="person"
              placeholder="Full Name"
              register={register("name")}
              error={errors.name?.message}
              delay={0.2}
            />

            <DatePickerField
              register={register("dateOfBirth")}
              error={errors.dateOfBirth?.message}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              delay={0.3}
            />

            <ProfileField
              label=""
              icon="email"
              placeholder="Email Address"
              register={register("email")}
              error={errors.email?.message}
              delay={0.4}
              disabled={true}
            />

            <PhoneInput
              register={register("phoneNumber")}
              error={errors.phoneNumber?.message}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              delay={0.5}
            />

            <ProfileField
              label=""
              icon="location"
              placeholder="Address"
              register={register("address")}
              error={errors.address?.message}
              delay={0.6}
            />

            <motion.div
              className="mt-8 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className={`w-full ${
                  isSubmitting || !isDirty
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-Red hover:bg-[#e02d37]"
                } text-white py-3 rounded font-medium transition-colors`}
              >
                {isSubmitting ? "Updating..." : "Update"}
              </button>
            </motion.div>
          </div>
        </motion.form>
      </motion.div>
    </ErrorBoundary>
  );
};

export default EditProfile;
