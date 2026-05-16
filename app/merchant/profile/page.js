"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  Edit3,
  User,
  Bell,
  Lock,
  Mail,
  Phone,
  CalendarDays,
  Store,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MerchantNavbar from "../MerchantNavbar";
import { useRoleProtection, LoadingScreen } from "../../components/RoleBasedRedirect";
import LocationPicker from "../../components/LocationPicker";
import StoreLocationMap from "../../components/StoreLocationMap";
import {
  updateMerchantStoreLocation,
  getMerchantStoreLocation,
  getMerchantProfile,
  updateProfile,
  updateMerchantProfile,
  changePassword,
  getMerchantLoyaltyLeaderboard,
} from "../../lib/api";

const topTabs = ["Profile Settings", "Loyalty Rewards", "Help", "Settings", "Logout"];
<<<<<<< HEAD

const loyaltyRows = [
  { customer: "Amit Singh", offers: 16, points: 146, star: true },
  { customer: "Rakesh Patel", offers: 14, points: 102, star: true },
  { customer: "Amit Singh", offers: 10, points: 102, star: true },
  { customer: "Rakesh Patel", offers: 10, points: 95, star: false },
  { customer: "Amit Singh", offers: 6, points: 73, star: false },
  { customer: "Rakesh Patel", offers: 4, points: 50, star: false },
  { customer: "Amit Singh", offers: 2, points: 23, star: false },
=======
const MERCHANT_CATEGORIES = [
  "Food & Restaurants",
  "Home Services",
  "Beauty & Wellness",
  "Healthcare & Medical",
  "Hotels & Accommodation",
  "Shopping & Retail",
  "Education & Training",
  "Real Estate",
  "Events & Entertainment",
  "Professional Services",
  "Automotive Services",
  "Home Improvement",
  "Fitness & Sports",
  "Daily Needs & Utilities",
  "Local Businesses & Vendors",
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
];

export default function MerchantProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#ececec]" />}>
      <MerchantProfilePageContent />
    </Suspense>
  );
}

function MerchantProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();
  const { isLoading: roleLoading, isAuthorized } = useRoleProtection("merchant");
  const requestedTab = searchParams.get("tab");
  const initialTab =
    requestedTab === "settings"
      ? "Settings"
      : requestedTab === "loyalty"
      ? "Loyalty Rewards"
      : "Profile Settings";

  if (roleLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) {
    return null;
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-[#ececec]" />;
  }

  if (user.accountType !== "merchant") {
    return null;
  }

  return (
    <MerchantProfileContent
      user={user}
      logout={logout}
      router={router}
      initialTab={initialTab}
    />
  );
}

function MerchantProfileContent({ user, logout, router, initialTab = "Profile Settings" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    email: "",
    shopName: "",
    storeCategory: "",
    location: "",
  });
<<<<<<< HEAD
  const [merchantPhoto, setMerchantPhoto] = useState("/images/deal2.avif");
  const [shopPhoto, setShopPhoto] = useState("/images/place2.avif");
=======
  const [initialFormData, setInitialFormData] = useState(null);
  const [initialMerchantPhoto, setInitialMerchantPhoto] = useState("");
  const [initialShopPhoto, setInitialShopPhoto] = useState("");
  const [merchantPhoto, setMerchantPhoto] = useState("");
  const [shopPhoto, setShopPhoto] = useState("");
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
  const [merchantPhotoFile, setMerchantPhotoFile] = useState(null);
  const [shopPhotoFile, setShopPhotoFile] = useState(null);
  const [storeLocation, setStoreLocation] = useState({
    address: "",
    latitude: 0,
    longitude: 0,
  });
<<<<<<< HEAD
=======
  const [loyaltyRows, setLoyaltyRows] = useState([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [loyaltyPage, setLoyaltyPage] = useState(1);
  const LOYALTY_PAGE_SIZE = 15;

  const merchantDisplayName = formData.username || user?.name || "Merchant";
  const merchantEmail = formData.email || user?.email || "No email available";
  const merchantPhone = formData.phone || user?.profile?.phone || "No phone number";
  const memberSinceLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Not available";
  const shopDisplayName = formData.shopName || "Your Shop";

  const loadLoyaltyLeaderboard = () => {
    setLoyaltyLoading(true);
    getMerchantLoyaltyLeaderboard()
      .then((res) => {
        let rows = [];
        if (Array.isArray(res?.data)) {
          rows = res.data;
        } else if (Array.isArray(res?.data?.data)) {
          rows = res.data.data;
        }
        setLoyaltyRows(rows);
      })
      .catch(() => {
        setLoyaltyRows([]);
      })
      .finally(() => setLoyaltyLoading(false));
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab !== "Loyalty Rewards") return;

    loadLoyaltyLeaderboard();
    const interval = setInterval(loadLoyaltyLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4

  useEffect(() => {
    const loadMerchantData = async () => {
      try {
        setIsLoading(true);
        const profileResponse = await getMerchantProfile();
        const merchantData = profileResponse?.data;

        if (merchantData) {
          const nextFormData = {
            username: user?.name || "",
            phone: user?.profile?.phone || "",
            email: user?.email || "",
            shopName: merchantData.storeName || "",
            storeCategory:
              merchantData.storeCategory ||
              user?.merchantProfile?.storeCategory ||
              user?.storeCategory ||
              "",
            location: merchantData.storeLocation || "",
          };
          setFormData(nextFormData);
          setInitialFormData(nextFormData);

          if (merchantData.profilePhoto) {
            setMerchantPhoto(merchantData.profilePhoto);
            setInitialMerchantPhoto(merchantData.profilePhoto);
          }
          if (merchantData.shopPhoto) {
            setShopPhoto(merchantData.shopPhoto);
            setInitialShopPhoto(merchantData.shopPhoto);
          }
        }
      } catch (error) {
        console.error("Error loading merchant profile:", error);
        setSaveMessage("Error loading profile data");
      } finally {
        setIsLoading(false);
      }
    };

    loadMerchantData();
  }, [user]);

  useEffect(() => {
    const loadStoreLocation = async () => {
      try {
        setIsLoadingLocation(true);
        const response = await getMerchantStoreLocation();
        if (response?.data) {
          const { address, latitude, longitude } = response.data;
          setStoreLocation({
            address: address || "",
            latitude: latitude || 0,
            longitude: longitude || 0,
          });
        }
      } catch (error) {
        console.error("Error loading store location:", error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    loadStoreLocation();
  }, []);

  const handleMerchantLogout = async () => {
    await logout();
    router.push("/login");
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleMerchantLogout();
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (file, isShopPhoto = false) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveMessage("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target.result;
      if (isShopPhoto) {
        setShopPhoto(previewUrl);
        setShopPhotoFile(file);
      } else {
        setMerchantPhoto(previewUrl);
        setMerchantPhotoFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoClick = (isShopPhoto = false) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => handlePhotoChange(e.target.files[0], isShopPhoto);
    input.click();
  };

  const handleDiscard = () => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
    setMerchantPhoto(initialMerchantPhoto);
    setShopPhoto(initialShopPhoto);
    setMerchantPhotoFile(null);
    setShopPhotoFile(null);
    setIsEditMode(false);
    setSaveMessage("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.username,
        email: formData.email,
        profile: {
          phone: formData.phone,
        },
      });

      const merchantData = {
        storeName: formData.shopName,
        storeCategory: formData.storeCategory,
        storeLocation: formData.location,
      };

      if (merchantPhotoFile) {
        const reader = new FileReader();
        const merchantPhotoBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(merchantPhotoFile);
        });
        merchantData.profilePhoto = merchantPhotoBase64;
      }

      if (shopPhotoFile) {
        const reader = new FileReader();
        const shopPhotoBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(shopPhotoFile);
        });
        merchantData.shopPhoto = shopPhotoBase64;
      }

      await updateMerchantProfile(merchantData);
      setSaveMessage("Profile updated successfully!");

      if (storeLocation && storeLocation.latitude && storeLocation.longitude) {
        await updateMerchantStoreLocation({
          address: storeLocation.address,
          latitude: storeLocation.latitude,
          longitude: storeLocation.longitude,
        });
      }

      setMerchantPhotoFile(null);
      setShopPhotoFile(null);
      setInitialFormData(formData);
      setInitialMerchantPhoto(merchantPhoto);
      setInitialShopPhoto(shopPhoto);
      setTimeout(() => setSaveMessage(""), 3000);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveMessage(error?.data?.message || "Failed to save profile. Please try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocationSelect = (location) => {
    const address =
      location.address ||
      `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

    setStoreLocation({
      address,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setFormData((prev) => ({ ...prev, location: address }));
    setShowLocationPicker(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setSettingsMessage("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setSettingsMessage("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsMessage("Passwords do not match.");
      return;
    }

    try {
      setSettingsLoading(true);
      setSettingsMessage("");
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSettingsMessage("Password changed successfully.");
    } catch (error) {
      setSettingsMessage(
        error?.data?.message || error?.message || "Failed to change password."
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]">
        <MerchantNavbar activeKey="profile" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <MerchantNavbar activeKey="profile" />

      <main className="w-full px-8 py-6 lg:px-10">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="mb-6 flex flex-wrap items-center justify-end gap-8 text-[12px] font-semibold">
            {topTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === "Help") {
                    router.push("/merchant/help");
                  } else if (tab === "Logout") {
                    setShowLogoutConfirm(true);
                  } else {
                    setActiveTab(tab);
                  }
                }}
                className={`relative pb-1 transition ${
                  activeTab === tab
                    ? "text-[#157a4f]"
                    : tab === "Logout"
                    ? "text-[#ef4444]"
                    : "text-[#111]"
                }`}
              >
                <span>{tab}</span>
                {activeTab === tab && tab !== "Logout" && (
                  <span className="absolute left-0 right-0 -bottom-[5px] h-[2px] bg-[#157a4f]" />
                )}
              </button>
            ))}
          </div>

          {activeTab === "Loyalty Rewards" ? (
            <div className="mx-auto max-w-[1260px] space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex h-[56px] items-center justify-between rounded-[8px] border border-[#b8bdc6] bg-white px-4">
                  <p className="text-[13px] font-semibold text-[#1f9b57]">Total Customers</p>
<<<<<<< HEAD
                  <p className="text-[30px] leading-none font-semibold text-[#1f1f1f]">228</p>
=======
                  <p className="text-[30px] font-semibold leading-none text-[#1f1f1f]">{loyaltyRows.length}</p>
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
                </div>
                <div className="flex h-[56px] items-center justify-between rounded-[8px] border border-[#b8bdc6] bg-white px-4">
                  <p className="text-[13px] font-semibold text-[#f1a61b]">Reward Champs</p>
<<<<<<< HEAD
                  <p className="text-[30px] leading-none font-semibold text-[#1f1f1f]">3</p>
=======
                  <p className="text-[30px] font-semibold leading-none text-[#1f1f1f]">{loyaltyRows.slice(0, 3).length}</p>
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
                </div>
                <div className="flex h-[56px] items-center justify-between rounded-[8px] border border-[#b8bdc6] bg-white px-4">
                  <p className="text-[13px] font-semibold text-[#323232]">Reward Points</p>
<<<<<<< HEAD
                  <p className="text-[30px] leading-none font-semibold text-[#1f1f1f]">100</p>
=======
                  <p className="text-[30px] font-semibold leading-none text-[#1f1f1f]">
                    {loyaltyRows.reduce((acc, row) => acc + (row.totalPoints || 0), 0)}
                  </p>
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
                </div>
              </div>

              <div className="overflow-hidden rounded-[8px] border border-[#bfc3cb] bg-white">
                <div className="px-6 py-4 text-[28px] font-semibold leading-none text-[#202020]">
                  Loyalty Rewards
                </div>
                <div className="grid grid-cols-3 border-b border-[#bfc3cb] px-6 py-3 text-[13px] font-medium text-[#2c2c2c]">
                  <p>Active Customers</p>
                  <p className="text-center">Number of Offers Claimed</p>
                  <p className="text-right">Loyalty Rewards</p>
                </div>
<<<<<<< HEAD

                {loyaltyRows.map((row, index) => (
                  <div key={`${row.customer}-${index}`} className="grid grid-cols-3 px-6 py-3 text-[13px] text-[#2f2f2f] border-b border-[#bfc3cb] last:border-b-0">
                    <p className="pl-6">{row.customer}</p>
                    <p className="text-center">{row.offers}</p>
                    <p className="text-right pr-6">
                      {row.star ? <span className="text-[#e5ad1d]">★</span> : null}
                      {row.star ? " / " : ""}
                      {row.points}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-[8px] bg-[#d9dbe0] px-5 py-3 flex items-center justify-between">
                <p className="text-[11px] text-[#5f6064]">Showing 5 of 97 products</p>
                <div className="flex items-center gap-2">
                  <button className="h-7 px-3 rounded-[8px] border border-[#8f949d] bg-white text-[10px] text-[#5f6064]">Previous</button>
                  <button className="h-7 px-3 rounded-[8px] border border-[#86c490] bg-[#e6f8eb] text-[10px] text-[#1f9b57]">Next</button>
                </div>
=======
                {loyaltyLoading ? (
                  <div className="py-6 text-center text-[#888]">Loading leaderboard...</div>
                ) : loyaltyRows.length === 0 ? (
                  <div className="py-6 text-center text-[#888]">No loyalty data yet.</div>
                ) : (
                  <>
                    {loyaltyRows
                      .slice((loyaltyPage - 1) * LOYALTY_PAGE_SIZE, loyaltyPage * LOYALTY_PAGE_SIZE)
                      .map((row, index) => {
                        const globalIndex = (loyaltyPage - 1) * LOYALTY_PAGE_SIZE + index;
                        return (
                          <div
                            key={row.email || globalIndex}
                            className="grid grid-cols-3 border-b border-[#bfc3cb] px-6 py-3 text-[13px] text-[#2f2f2f] last:border-b-0"
                          >
                            <p className="pl-6">
                              <span className="mr-2 font-bold">{globalIndex + 1}.</span>
                              {row.name || row.email || "Customer"}
                            </p>
                            <p className="text-center">{row.offersClaimed ?? "-"}</p>
                            <p className="pr-6 text-right">
                              {globalIndex < 3 ? <span className="text-[#e5ad1d]">★</span> : null}
                              {globalIndex < 3 ? " / " : ""}
                              {row.totalPoints}
                            </p>
                          </div>
                        );
                      })}

                    <div className="flex items-center justify-end gap-3 border-t border-[#bfc3cb] bg-[#f9f9f9] px-6 py-4">
                      <button
                        className="rounded bg-[#ececec] px-4 py-2 text-[13px] font-semibold text-[#222] disabled:opacity-60"
                        onClick={() => setLoyaltyPage((p) => Math.max(1, p - 1))}
                        disabled={loyaltyPage === 1}
                      >
                        Previous
                      </button>
                      <span className="text-[13px] font-semibold text-[#666]">
                        Page {loyaltyPage} of {Math.max(1, Math.ceil(loyaltyRows.length / LOYALTY_PAGE_SIZE))}
                      </span>
                      <button
                        className="rounded bg-[#ececec] px-4 py-2 text-[13px] font-semibold text-[#222] disabled:opacity-60"
                        onClick={() =>
                          setLoyaltyPage((p) =>
                            Math.min(Math.ceil(loyaltyRows.length / LOYALTY_PAGE_SIZE), p + 1)
                          )
                        }
                        disabled={loyaltyPage >= Math.ceil(loyaltyRows.length / LOYALTY_PAGE_SIZE)}
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
              </div>
            </div>
          ) : activeTab === "Settings" ? (
            <div className="mx-auto max-w-[1260px] space-y-5">
              <div className="rounded-[8px] border border-[#d5d5d5] bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Bell size={18} style={{ color: "#157a4f" }} />
                  <h2 className="text-[16px] font-bold text-[#1f1f1f]">Notifications</h2>
                </div>
                <div className="flex items-center justify-between rounded-[6px] bg-[#f9f9f9] p-3">
                  <div>
                    <p className="text-[12px] font-semibold text-[#1f1f1f]">Order Alerts</p>
                    <p className="mt-0.5 text-[11px] text-[#999]">
                      Get notified when a customer claims your offer
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={orderNotifications}
                      onChange={(e) => setOrderNotifications(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-[#d5d5d5] peer-checked:bg-[#157a4f] peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-[#d5d5d5] after:bg-white after:transition-all after:content-['']" />
                  </label>
                </div>
              </div>

<<<<<<< HEAD
              <div className="space-y-8 max-w-[1260px] mx-auto">
                <div className="bg-white border border-[#d9d9d9] rounded-[6px] overflow-hidden">
                  <div className="h-[78px] bg-[#f3d58d] px-6 flex items-start pt-5 font-semibold text-[15px] text-[#1b1b1b]">
                    Merchant Profile
                  </div>
                  <div className="relative px-8 pb-7 pt-0">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-14 w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white cursor-pointer group" onClick={() => isEditMode && handlePhotoClick(false)}>
                      <Image src={merchantPhoto} alt="Merchant profile" fill className="object-cover group-hover:brightness-75 transition" />
                    </div>
                    {isEditMode && (
                      <div className="absolute left-1/2 translate-x-[28px] top-[24px] w-8 h-8 rounded-full bg-[#157a4f] border-2 border-white flex items-center justify-center text-white shadow-sm cursor-pointer hover:bg-[#0f5a3a] transition" onClick={() => handlePhotoClick(false)}>
                        <Camera size={15} />
                      </div>
                    )}
                    {!isEditMode && (
                      <div className="absolute left-1/2 translate-x-[28px] top-[24px] w-8 h-8 rounded-full bg-[#bdbdbd] border-2 border-white flex items-center justify-center text-white shadow-sm">
                        <Camera size={15} />
                      </div>
                    )}

                    <div className="pt-20 space-y-5">
                      <div>
                        <label className="block text-[14px] font-semibold text-[#222] mb-2">Username</label>
                        {isEditMode ? (
                          <input value={formData.username} onChange={(e) => handleInputChange("username", e.target.value)} className="h-10 w-full rounded-[4px] bg-[#f3f3f6] px-3 text-[12px] text-[#3a3a3a] outline-none" />
                        ) : (
                          <div className="h-10 rounded-[4px] bg-[#f3f3f6] px-3 flex items-center text-[12px] text-[#3a3a3a]">{formData.username}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[14px] font-semibold text-[#222] mb-2">Phone Number</label>
                        {isEditMode ? (
                          <input value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="h-10 w-full rounded-[4px] bg-[#f3f3f6] px-3 text-[12px] text-[#3a3a3a] outline-none" />
                        ) : (
                          <div className="h-10 rounded-[4px] bg-[#f3f3f6] px-3 flex items-center text-[12px] text-[#3a3a3a]">{formData.phone}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[14px] font-semibold text-[#222] mb-2">Email</label>
                        {isEditMode ? (
                          <input value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="h-10 w-full rounded-[4px] bg-[#f3f3f6] px-3 text-[12px] text-[#3a3a3a] outline-none" />
                        ) : (
                          <div className="h-10 rounded-[4px] bg-[#f3f3f6] px-3 flex items-center text-[12px] text-[#3a3a3a]">{formData.email}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#d9d9d9] rounded-[6px] overflow-hidden">
                  <div className="h-[78px] bg-[#f3d58d] px-6 flex items-start pt-5 font-semibold text-[15px] text-[#1b1b1b]">
                    Shop Details
                  </div>
                  <div className="relative px-8 pb-7 pt-0">
                    <div className="absolute left-1/2 -translate-x-1/2 -top-14 w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white cursor-pointer group" onClick={() => isEditMode && handlePhotoClick(true)}>
                      <Image src={shopPhoto} alt="Shop" fill className="object-cover group-hover:brightness-75 transition" />
                    </div>
                    {isEditMode && (
                      <div className="absolute left-1/2 translate-x-[28px] top-[24px] w-8 h-8 rounded-full bg-[#157a4f] border-2 border-white flex items-center justify-center text-white shadow-sm cursor-pointer hover:bg-[#0f5a3a] transition" onClick={() => handlePhotoClick(true)}>
                        <Camera size={15} />
                      </div>
                    )}
                    {!isEditMode && (
                      <div className="absolute left-1/2 translate-x-[28px] top-[24px] w-8 h-8 rounded-full bg-[#bdbdbd] border-2 border-white flex items-center justify-center text-white shadow-sm">
                        <Camera size={15} />
                      </div>
                    )}
=======
              <div className="rounded-[8px] border border-[#d5d5d5] bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Lock size={18} style={{ color: "#157a4f" }} />
                  <h2 className="text-[16px] font-bold text-[#1f1f1f]">Change Password</h2>
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    autoComplete="current-password"
                    className="w-full rounded-[6px] border border-[#d5d5d5] bg-white px-3 py-2 text-[12px] focus:border-[#157a4f] focus:outline-none"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    className="w-full rounded-[6px] border border-[#d5d5d5] bg-white px-3 py-2 text-[12px] focus:border-[#157a4f] focus:outline-none"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="w-full rounded-[6px] border border-[#d5d5d5] bg-white px-3 py-2 text-[12px] focus:border-[#157a4f] focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={settingsLoading}
                    className="h-9 rounded-[8px] bg-[#efb02e] px-4 text-[12px] font-semibold text-[#1b1b1b] disabled:opacity-70"
                  >
                    {settingsLoading ? "Processing..." : "Update Password"}
                  </button>
                </div>
              </div>

              {settingsMessage ? (
                <div
                  className={`rounded-[8px] p-3 text-[12px] font-semibold ${
                    settingsMessage.toLowerCase().includes("success") ||
                    settingsMessage.toLowerCase().includes("verified")
                      ? "bg-[#dcfce7] text-[#166534]"
                      : "bg-[#fee2e2] text-[#b91c1c]"
                  }`}
                >
                  {settingsMessage}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="mx-auto max-w-[1260px]">
                <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
                  <section className="lg:sticky lg:top-[96px] lg:border-r lg:border-[#cfd5df] lg:self-start lg:pr-10">
                    <h1 className="mb-6 text-[21px] font-bold text-[#20232b] lg:text-[26px]">
                      Profile Overview
                    </h1>

                    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                      <div className="h-[106px] bg-gradient-to-r from-[#ff8a2f] to-[#ffd07a]" />

                      <div className="relative px-7 pb-7 pt-14">
                        <div
                          className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                          onClick={() => isEditMode && handlePhotoClick(false)}
                        >
                          {merchantPhoto && String(merchantPhoto).trim() ? (
                            <Image src={merchantPhoto} alt="Merchant profile" fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#f4f4f5] text-[#9ca3af]">
                              <User size={40} />
                            </div>
                          )}
                        </div>

                        {isEditMode && (
                          <button
                            type="button"
                            onClick={() => handlePhotoClick(false)}
                            className="absolute left-1/2 top-0 flex h-8 w-8 translate-x-8 -translate-y-2 items-center justify-center rounded-full bg-[#ff8e28] text-white shadow-md"
                          >
                            <Camera size={14} />
                          </button>
                        )}

                        <h2 className="text-center text-[23px] font-bold text-[#20232b]">
                          {merchantDisplayName}
                        </h2>

                        <div className="mt-8 rounded-[14px] bg-[#fcfcfd]">
                          {[
                            { icon: Mail, label: "Email Address", value: merchantEmail },
                            { icon: Phone, label: "Phone Number", value: merchantPhone },
                            { icon: CalendarDays, label: "Member Since", value: memberSinceLabel },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex items-start gap-4 border-b border-[#edf0f4] px-1 py-5 last:border-b-0"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7ed] text-[#ff8b1f]">
                                <item.icon size={16} />
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
                                  {item.label}
                                </p>
                                <p className="mt-1 text-[14px] font-semibold text-[#20232b]">
                                  {item.value}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[22px] bg-white p-7 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4e8] text-[#ff8a24]">
                          <Store size={20} />
                        </div>
                        <h2 className="text-[24px] font-bold tracking-[-0.02em] text-[#20232b]">
                          {shopDisplayName}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-[12px] bg-[#ff922d] px-4 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(255,146,45,0.24)]"
                      >
                        <Edit3 size={14} />
                        Edit Shop Details
                      </button>
                    </div>

                    <div className="relative mb-6 h-[260px] overflow-hidden rounded-[18px] bg-[#f3f4f6]">
                      {shopPhoto && String(shopPhoto).trim() ? (
                        <Image src={shopPhoto} alt={shopDisplayName} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fff4dd] to-[#f5f5f5] text-[#9ca3af]">
                          <Store size={56} />
                        </div>
                      )}

                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handlePhotoClick(true)}
                          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#ff8b1f] shadow-lg"
                        >
                          <Camera size={16} />
                        </button>
                      )}
                    </div>
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4

                    <div className="space-y-8">
                      <div>
<<<<<<< HEAD
                        <label className="block text-[14px] font-semibold text-[#222] mb-2">Shop Name</label>
                        {isEditMode ? (
                          <input value={formData.shopName} onChange={(e) => handleInputChange("shopName", e.target.value)} className="h-10 w-full rounded-[4px] bg-[#f3f3f6] px-3 text-[12px] text-[#3a3a3a] outline-none" />
                        ) : (
                          <div className="h-10 rounded-[4px] bg-[#f3f3f6] px-3 flex items-center text-[12px] text-[#3a3a3a]">{formData.shopName}</div>
                        )}
=======
                        <label className="mb-2.5 block text-[12px] font-bold uppercase tracking-[0.12em] text-[#30343c]">
                          Shop Name
                        </label>
                        <input
                          value={formData.shopName}
                          onChange={(e) => handleInputChange("shopName", e.target.value)}
                          disabled={!isEditMode}
                          className="h-11 w-full rounded-[12px] border border-[#d7dce3] bg-white px-4 text-[14px] text-[#20232b] outline-none transition focus:border-[#ff922d] disabled:bg-[#fafafa]"
                        />
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
                      </div>

                      <div>
                        <label className="mb-2.5 block text-[12px] font-bold uppercase tracking-[0.12em] text-[#30343c]">
                          Shop Category
                        </label>
                        <select
                          value={formData.storeCategory}
                          onChange={(e) => handleInputChange("storeCategory", e.target.value)}
                          disabled={!isEditMode}
                          className="h-11 w-full rounded-[12px] border border-[#d7dce3] bg-white px-4 text-[14px] text-[#20232b] outline-none transition focus:border-[#ff922d] disabled:bg-[#fafafa]"
                        >
                          <option value="" disabled>
                            Select shop category
                          </option>
                          {MERCHANT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[#30343c]">
                          Store Location
                          <MapPin size={14} className="text-[#ff8b1f]" />
                        </label>

                        {isLoadingLocation ? (
                          <div className="flex h-[190px] items-center justify-center rounded-[18px] border border-[#e5e7eb] bg-[#f8fafc] text-[14px] text-[#6b7280]">
                            Loading location...
                          </div>
                        ) : (
                          <>
                            <div className="overflow-hidden rounded-[18px] border border-[#e5e7eb] bg-[#f8fafc]">
                              <StoreLocationMap
                                location={storeLocation}
                                onMapClick={() => (isEditMode ? setShowLocationPicker(true) : setIsEditMode(true))}
                                isLoading={isSaving}
                              />
                            </div>

                            <div className="mt-5 rounded-[16px] border border-[#dfe3ea] bg-[#fafafa] p-5">
                              <p className="text-[14px] font-semibold text-[#30343c]">
                                {storeLocation.address || formData.location || "Store address not set"}
                              </p>
                              <button
                                type="button"
                                onClick={() => (isEditMode ? setShowLocationPicker(true) : setIsEditMode(true))}
                                className="mt-4 text-[13px] font-semibold text-[#ff8b1f]"
                              >
                                {isEditMode ? "Update Store Location" : "View Store Location"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <label className="mb-2.5 block text-[12px] font-bold uppercase tracking-[0.12em] text-[#30343c]">
                            Username
                          </label>
                          <input
                            value={formData.username}
                            onChange={(e) => handleInputChange("username", e.target.value)}
                            disabled={!isEditMode}
                            className="h-11 w-full rounded-[12px] border border-[#d7dce3] bg-white px-4 text-[14px] text-[#20232b] outline-none transition focus:border-[#ff922d] disabled:bg-[#fafafa]"
                          />
                        </div>

                        <div>
                          <label className="mb-2.5 block text-[12px] font-bold uppercase tracking-[0.12em] text-[#30343c]">
                            Phone Number
                          </label>
                          <input
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            disabled={!isEditMode}
                            className="h-11 w-full rounded-[12px] border border-[#d7dce3] bg-white px-4 text-[14px] text-[#20232b] outline-none transition focus:border-[#ff922d] disabled:bg-[#fafafa]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2.5 block text-[12px] font-bold uppercase tracking-[0.12em] text-[#30343c]">
                          Email Address
                        </label>
                        <input
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          disabled={!isEditMode}
                          className="h-11 w-full rounded-[12px] border border-[#d7dce3] bg-white px-4 text-[14px] text-[#20232b] outline-none transition focus:border-[#ff922d] disabled:bg-[#fafafa]"
                        />
                      </div>
                    </div>
                  </section>
                </div>

                {isEditMode && (
                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="h-9 rounded-[12px] bg-[#d8dbe2] px-4 text-[13px] font-semibold text-[#222]"
                    >
                      Discard Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="h-9 rounded-[12px] bg-[#ff922d] px-5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}

                {saveMessage && (
                  <div
                    className={`mt-5 rounded-[12px] p-3 text-[12px] font-semibold ${
                      saveMessage.includes("success")
                        ? "bg-[#dcfce7] text-[#166534]"
                        : "bg-[#fee2e2] text-[#b91c1c]"
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          storeLocation && storeLocation.latitude
            ? {
                lat: storeLocation.latitude,
                lng: storeLocation.longitude,
              }
            : null
        }
      />

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[420px] overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-white shadow-2xl">
            <div className="border-b border-[#ececec] px-6 py-5">
              <h3 className="text-[18px] font-semibold text-[#1b1b1b]">Confirm Logout</h3>
              <p className="mt-2 text-[13px] text-[#666]">
                Are you sure you want to log out of your merchant account?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 bg-[#fafafa] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="h-9 rounded-[8px] border border-[#cfd5dc] bg-white px-4 text-[12px] font-semibold text-[#555]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="h-9 rounded-[8px] bg-[#ef4d4d] px-4 text-[12px] font-semibold text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-6 bg-[#f0b330] px-4 py-7 text-[#1b1b1b] lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col items-start justify-between gap-8 lg:flex-row lg:gap-12">
          <div className="max-w-[240px]">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-white font-bold text-[#157a4f]">
                G
              </div>
              <span className="text-[18px] font-semibold text-[#157a4f]">GOLO</span>
            </div>
            <p className="max-w-[150px] text-[10px] leading-[1.35] text-[#fff8de]">
              The all-in-one management platform for modern businesses. Empowering growth through analytics and intuitive product management.
            </p>
          </div>

<<<<<<< HEAD
          <div className="grid grid-cols-3 gap-14 lg:gap-20 text-[10px] text-[#6b520f]">
=======
          <div className="grid grid-cols-1 gap-8 text-[10px] text-[#6b520f] sm:grid-cols-2 lg:grid-cols-3 lg:gap-20 lg:gap-y-14">
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
            <div>
              <p className="mb-3 font-semibold text-[#1b1b1b]">Links</p>
              <ul className="space-y-2">
                <li>Overview</li>
                <li>Inventory</li>
                <li>Posts</li>
                <li>Profile</li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold text-[#1b1b1b]">&nbsp;</p>
              <ul className="space-y-2">
                <li>Analytics</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold text-[#1b1b1b]">Support</p>
              <ul className="space-y-2">
                <li>Help Center</li>
                <li>Security</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="mt-auto flex gap-4 text-[#1877f2] lg:pb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f3ba3b] text-[10px] font-bold text-[#1877f2]">f</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-[2px] bg-[#f3ba3b] text-[9px] font-bold text-[#0a66c2]">in</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f3ba3b] text-[10px] font-bold text-[#e1306c]">ig</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-[2px] bg-[#f3ba3b] text-[10px] font-bold text-[#ff0000]">▶</span>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-[1500px] items-center justify-between text-[9px] text-[#5f4710]">
          <p>© 2026 GOLO Dashboard. All rights reserved.</p>
          <p>Made with ♥ by V</p>
        </div>
      </footer>
    </div>
  );
}
