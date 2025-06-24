import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  getUserById,
  getUserByEmail,
  getAllUsers,
  deleteUserProfile,
  clearSelectedUser,
  fetchUserProfile,
  syncProfileWithSelectedUser,
  updateUserProfile,
  updateUserFromAuth,
  verifySelfIdentity,
  getSelfVerificationStatus,
  revokeSelfVerification,
} from "../../store/slices/userSlice";
import {
  selectAllUsers,
  selectSelectedUser,
  selectUserLoading,
  selectUserError,
  selectFormattedSelectedUser,
  selectUserProfile,
} from "../../store/selectors/userSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { useAuth } from "../../context/AuthContext";
import { UserProfile } from "../types";

export const useUserManagement = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { handleUserUpdate } = useAuth();

  const users = useAppSelector(selectAllUsers);
  const selectedUser = useAppSelector(selectSelectedUser);
  const profile = useAppSelector(selectUserProfile);
  const formattedSelectedUser = useAppSelector(selectFormattedSelectedUser);
  const loading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);

  useEffect(() => {
    if (profile && !selectedUser) {
      dispatch(syncProfileWithSelectedUser());
    }
  }, [profile, selectedUser, dispatch]);
  const fetchProfile = useCallback(
    async (showNotifications = true, forceRefresh = false) => {
      try {
        if (!forceRefresh && selectedUser) {
          return true;
        }

        await dispatch(fetchUserProfile(forceRefresh)).unwrap();
        if (showNotifications) {
          showSnackbar("Profile loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to load profile", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar, selectedUser]
  );

  const fetchUserById = useCallback(
    async (userId: string, showNotifications = false) => {
      try {
        await dispatch(getUserById(userId)).unwrap();
        if (showNotifications) {
          showSnackbar("User details loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to load user", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const updateProfile = useCallback(
    async (profileData: Partial<UserProfile>, showNotifications = false) => {
      try {
        const updatedProfile = await dispatch(
          updateUserProfile(profileData)
        ).unwrap();

        handleUserUpdate(updatedProfile);

        dispatch(updateUserFromAuth(updatedProfile));

        if (showNotifications) {
          showSnackbar("Profile updated successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to update profile", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar, handleUserUpdate]
  );

  const fetchUserByEmail = useCallback(
    async (email: string, showNotifications = false) => {
      try {
        await dispatch(getUserByEmail(email)).unwrap();
        if (showNotifications) {
          showSnackbar("User details loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to load user", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchAllUsers = useCallback(
    async (showNotifications = false, forceRefresh = false) => {
      try {
        await dispatch(getAllUsers(forceRefresh)).unwrap();
        if (showNotifications) {
          showSnackbar("Users loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to load users", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        await dispatch(deleteUserProfile(userId)).unwrap();
        showSnackbar("User deleted successfully", "success");
        return true;
      } catch (err) {
        showSnackbar((err as string) || "Failed to delete user", "error");
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const verifySelf = useCallback(
    async (
      verificationData: {
        proof: {
          pi_a: string[];
          pi_b: string[][];
          pi_c: string[];
          protocol: string;
          curve: string;
        };
        publicSignals: string[];
      },
      showNotifications = true
    ) => {
      try {
        const updatedProfile = await dispatch(
          verifySelfIdentity(verificationData)
        ).unwrap();

        handleUserUpdate(updatedProfile);

        if (showNotifications) {
          showSnackbar("Identity verified successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to verify identity", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar, handleUserUpdate]
  );

  const checkVerificationStatus = useCallback(
    async (showNotifications = false) => {
      try {
        await dispatch(getSelfVerificationStatus()).unwrap();
        if (showNotifications) {
          showSnackbar("Verification status updated", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to check verification status",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const revokeVerification = useCallback(
    async (showNotifications = true) => {
      try {
        const updatedProfile = await dispatch(
          revokeSelfVerification()
        ).unwrap();

        handleUserUpdate(updatedProfile);

        if (showNotifications) {
          showSnackbar("Verification revoked successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to revoke verification",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar, handleUserUpdate]
  );

  const resetSelectedUser = useCallback(() => {
    dispatch(clearSelectedUser());
  }, [dispatch]);

  return {
    users,
    selectedUser,
    formattedSelectedUser,
    isLoading: loading === "pending",
    error,
    fetchProfile,
    updateProfile,
    fetchUserById,
    fetchUserByEmail,
    fetchAllUsers,
    deleteUser,
    verifySelf,
    checkVerificationStatus,
    revokeVerification,
    resetSelectedUser,
    isError: loading === "failed" && error !== null,
    isSuccess: loading === "succeeded",
  };
};
