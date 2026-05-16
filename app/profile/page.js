"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  MapPin,
  Phone,
  Star,
  Award,
  BadgeCheck,
  Ticket,
  Plus,
  Pencil,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GolocalProfileSidebar from "../components/GolocalProfileSidebar";
import { useAuth } from "../context/AuthContext";
import { useRoleProtection, LoadingScreen } from "../components/RoleBasedRedirect";
import { getProfile, getMyAds, updateProfile, getUserDealStatistics } from "../lib/api";

export default function ProfilePage() {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const router = useRouter();
  const { isLoading, isAuthorized } = useRoleProtection("user");
  const [profile, setProfile] = useState(null);
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [dealsRedeemed, setDealsRedeemed] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    categories: ["Art & Culture", "Local Dining", "Sustainable Living"],
  });
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [profileRes, adsRes, dealStatsRes] = await Promise.all([
          getProfile(),
          getMyAds({ page: 1, limit: 1 }),
          getUserDealStatistics(),
        ]);

        if (profileRes.success) {
          setProfile(profileRes.data);
        }
        if (adsRes.success) {
          setActiveAdsCount(adsRes.pagination?.total || 0);
        }
        if (dealStatsRes) {
          setDealsRedeemed(dealStatsRes.dealsRedeemed || 0);
          setTotalSavings(dealStatsRes.totalSavings || 0);
        }
      } catch {
        // Use cached user data as fallback
        setProfile(user);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!showEditModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showEditModal]);

  if (isLoading || loading) {
    return isLoading ? <LoadingScreen /> : (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const displayUser = profile || user;
  const initials = displayUser?.name?.charAt(0)?.toUpperCase() || "A";
  const locationText =
    displayUser?.profile?.city || displayUser?.profile?.state
      ? `${displayUser?.profile?.city || ""}${displayUser?.profile?.city && displayUser?.profile?.state ? ", " : ""}${displayUser?.profile?.state || ""}`
      : "Pulewadi, IN";
  const points = Math.max(12450, activeAdsCount * 140);
  const pointsGoal = 15000;
  const progressPct = Math.min(100, Math.round((points / pointsGoal) * 100));
  const neededPoints = Math.max(0, pointsGoal - points);
  const formattedPhone = displayUser?.profile?.phone || displayUser?.phone || "+91 9876543212";
  const interests = [
    "Home Services",
    "Real Estate",
    "Beauty & Wellness",
    "Shopping & Retail",
    "Food & Restaurants",
  ];
  const modalCategories = [
    "Art & Culture",
    "Local Dining",
    "Sustainable Living",
    "Home Services",
    "Beauty & Wellness",
    "Shopping & Retail",
    "Food & Restaurants",
    "Travel",
  ];

  const openEditModal = () => {
    const source = profile || user || {};
    const existingLocation =
      source?.profile?.city || source?.profile?.state
        ? `${source?.profile?.city || ""}${source?.profile?.city && source?.profile?.state ? ", " : ""}${source?.profile?.state || ""}`
        : "Zimbabwe";

    setEditForm({
      name: source?.name || "",
      email: source?.email || "",
      phone: source?.profile?.phone || source?.phone || "+1 (503) 555-0192",
      location: existingLocation,
      categories: ["Art & Culture", "Local Dining", "Sustainable Living"],
    });
    setEditError("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setShowEditModal(false);
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (category) => {
    setEditForm((prev) => {
      const exists = prev.categories.includes(category);
      if (exists) {
        return { ...prev, categories: prev.categories.filter((item) => item !== category) };
      }
      return { ...prev, categories: [...prev.categories, category] };
    });
  };

  const handleAvatarPick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setAvatarPreview(blobUrl);
  };

  const handleSaveProfileFromModal = async () => {
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      setEditError("Full name, email and phone number are required.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    const [cityPart, statePart] = String(editForm.location || "").split(",").map((item) => item.trim());

    try {
      const res = await updateProfile({
        name: editForm.name,
        email: editForm.email,
        profile: {
          phone: editForm.phone,
          city: cityPart || editForm.location,
          state: statePart || "IN",
        },
      });

      if (!res?.success) {
        setEditError(res?.message || "Failed to update profile.");
        return;
      }

      const refreshed = await getProfile();
      if (refreshed?.success) {
        setProfile(refreshed.data);
      }
      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }

      setShowEditModal(false);
    } catch (error) {
      setEditError(error?.data?.message || error?.message || "Failed to update profile.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#f4f4f4]">
        <div className="w-full px-0 py-0">
          <div className="grid lg:grid-cols-[250px_1fr] min-h-[760px]">
            <GolocalProfileSidebar active="profile" />

            <main className="p-5 lg:p-8 space-y-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-[84px] h-[84px] rounded-full bg-[#e6b03f] text-white flex items-center justify-center text-4xl font-medium relative shadow-sm">
                      {initials}
                      <span className="absolute right-1 bottom-1 w-5 h-5 rounded-full bg-[#157a4f] border-2 border-white flex items-center justify-center text-[10px] text-white">
                        <User size={10} />
                      </span>
                    </div>
                    <div>
                      <h1 className="text-[36px] leading-none font-semibold text-[#1d1d1d]">{displayUser?.name || "Kaustubh Khamkar"}</h1>
                      <div className="mt-2 space-y-1 text-sm text-[#4f4f4f]">
                        <p className="flex items-center gap-2"><Mail size={13} className="text-[#157a4f]" /> {displayUser?.email || "kutubkamkar@gmail.com"}</p>
                        <p className="flex items-center gap-2"><MapPin size={13} className="text-[#157a4f]" /> {locationText}</p>
                      </div>
                      <p className="text-xs text-[#8d8d8d] mt-2 max-w-[520px]">
                        Keep your profile updated for better recommendations. Your local journey started in June 2023.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={openEditModal}
                    className="self-start rounded-xl bg-[#157a4f] text-white text-sm font-semibold px-6 py-2.5 shadow-sm hover:bg-[#10613f] transition"
                  >
                    Edit Profile
                  </button>
                </div>

                <section className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-[#e7e7e7] p-4">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-lg bg-[#eff6f2] text-[#157a4f] flex items-center justify-center"><Star size={14} /></span>
                      <span className="text-[11px] text-[#157a4f] bg-[#ecf8f1] px-2 py-0.5 rounded-full">Lifetime</span>
                    </div>
<<<<<<< HEAD
                    <p className="text-3xl font-semibold text-[#1f1f1f] mt-4">12,450</p>
                    <p className="text-sm text-[#4d4d4d]">Total Points</p>
                    <p className="text-xs text-[#8a8a8a] mt-3">You've earned 850 points this month!</p>
=======
                    <p className="text-3xl font-semibold text-[#1f1f1f] mt-4">{loyaltyPoints?.toLocaleString() ?? 0}</p>
                    <p className="text-sm text-[#4d4d4d]">Total Points ({loyaltyTier})</p>
                    {/* <p className="text-xs text-[#8a8a8a] mt-3">{`You've earned ${monthlyLoyaltyPoints} points this month!`}</p> */}
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
                  </div>

                  <div className="rounded-xl border border-[#b6e7d0] bg-[#c9f1df] p-4">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-lg bg-[#e5f7ef] text-[#157a4f] flex items-center justify-center"><Award size={14} /></span>
                      <span className="text-[11px] text-[#157a4f] bg-[#d9f6e8] px-2 py-0.5 rounded-full">Lifetime</span>
                    </div>
                    <p className="text-3xl font-semibold text-[#1f1f1f] mt-4">Platinum Local</p>
                    <p className="text-sm text-[#4d4d4d]">Current Tier</p>
                    <p className="text-xs text-[#5b7d6d] mt-3">Top 5% of users in Portland area.</p>
                  </div>

                  <div className="rounded-xl border border-[#e7e7e7] p-4">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-lg bg-[#eff6f2] text-[#157a4f] flex items-center justify-center"><Ticket size={14} /></span>
                      <span className="text-[11px] text-[#157a4f] bg-[#ecf8f1] px-2 py-0.5 rounded-full">Lifetime</span>
                    </div>
<<<<<<< HEAD
                    <p className="text-3xl font-semibold text-[#1f1f1f] mt-4">48</p>
                    <p className="text-sm text-[#4d4d4d]">Deals Redeemed</p>
                    <p className="text-xs text-[#8a8a8a] mt-3">Estimated ₹120 saved on local goods.</p>
=======
                    <p className="text-3xl font-semibold text-[#1f1f1f] mt-4">{dealsRedeemed || 0}</p>
                    <p className="text-sm text-[#4d4d4d]">Deals Redeemed</p>
                    {/* <p className="text-xs text-[#8a8a8a] mt-3">{`Estimated ₹${totalSavings?.toLocaleString() || 0} saved on local goods.`}</p> */}
>>>>>>> ab702514040ebb26ccf6345e37517ad5d0c39df4
                  </div>
                </section>

                <section className="rounded-xl border border-[#e7e7e7] p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <span className="inline-block text-[11px] rounded-full bg-[#f2bf42] text-[#2d2d2d] px-3 py-1 font-semibold">Next Milestone: Elite Legend</span>
                      <h2 className="text-[31px] leading-tight font-semibold text-[#1f1f1f] mt-2">Progress to Elite Tier</h2>
                      <p className="text-sm text-[#666] mt-1">Reach 15,000 points to unlock exclusive 24h early access to flash deals.</p>
                    </div>
                    <div className="rounded-xl border border-[#c8ead9] bg-[#e3f5ec] px-4 py-3 min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center rounded-lg bg-[#157a4f] text-white text-sm font-bold px-2 py-1">1.5x</span>
                        <div>
                          <p className="text-[11px] font-semibold text-[#157a4f] uppercase tracking-wide">Current Boost</p>
                          <p className="text-sm text-[#1f1f1f]">Multiplier Benefit Active</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm font-semibold text-[#3f3f3f]">{points.toLocaleString()} / {pointsGoal.toLocaleString()} Points</div>
                  <div className="w-full h-2.5 rounded-full bg-[#f2e5c6] mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-[#157a4f]" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-[#7b7b7b]">Platinum Status</span>
                    <span className="text-[#157a4f] font-semibold">{neededPoints.toLocaleString()} points needed to level up</span>
                  </div>
                </section>

                <section className="grid lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#e7e7e7] p-5">
                    <h3 className="text-2xl font-semibold text-[#232323] flex items-center gap-2">
                      <BadgeCheck size={18} className="text-[#157a4f]" />
                      Your Interests
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <span key={interest} className="rounded-full bg-[#157a4f] text-white text-xs font-semibold px-3 py-1.5">
                          {interest}
                        </span>
                      ))}
                      <button className="rounded-full bg-[#f0e7cf] text-[#574f3e] text-xs font-semibold px-3 py-1.5 inline-flex items-center gap-1">
                        <Plus size={12} />
                        Add Category
                      </button>
                    </div>
                    <div className="mt-16 border-t border-[#efefef] pt-3 text-xs text-[#8f8f8f] text-center">
                      Your chosen interests allow us to personalize your experience with nearby services and offers.
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#e7e7e7] p-5">
                    <h3 className="text-2xl font-semibold text-[#232323] flex items-center gap-2">
                      <User size={18} className="text-[#157a4f]" />
                      Account Details
                    </h3>

                    <div className="mt-5 space-y-4">
                      <div className="pb-3 border-b border-[#efefef]">
                        <p className="text-[10px] tracking-[0.08em] uppercase text-[#a0a0a0]">Full Name</p>
                        <p className="mt-1 text-base text-[#202020]">{displayUser?.name || "Ram Patil"}</p>
                      </div>
                      <div className="pb-3 border-b border-[#efefef]">
                        <p className="text-[10px] tracking-[0.08em] uppercase text-[#a0a0a0]">Email Address</p>
                        <p className="mt-1 text-base text-[#202020]">{displayUser?.email || "rampatil1200@gmail.com"}</p>
                      </div>
                      <div className="pb-3 border-b border-[#efefef]">
                        <p className="text-[10px] tracking-[0.08em] uppercase text-[#a0a0a0]">Phone Number</p>
                        <p className="mt-1 text-base text-[#202020] flex items-center gap-2"><Phone size={14} className="text-[#7a7a7a]" /> {formattedPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.08em] uppercase text-[#a0a0a0]">Primary Location</p>
                        <p className="mt-1 text-base text-[#202020]">{locationText}</p>
                      </div>
                    </div>
                  </div>
                </section>
            </main>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[10020] bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-[640px] max-h-[88vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#dfe5e2] flex flex-col">
            <div className="bg-[#e9f4ef] px-5 py-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-xl bg-[#157a4f] text-white flex items-center justify-center shadow-sm">
                  <Pencil size={16} />
                </span>
                <div>
                  <h2 className="text-2xl leading-none font-semibold text-[#157a4f]">Edit Your Profile</h2>
                  <p className="text-[#74a590] text-sm leading-tight mt-1.5">Update your details and preferences to stay connected local.</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="text-[#157a4f] hover:opacity-80 transition"
                aria-label="Close edit profile modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-6 py-5 border-t border-[#edf1ef] overflow-y-auto">
              <div className="flex items-center gap-4 pb-5 border-b border-[#ececec]">
                <div className="w-16 h-16 rounded-full bg-[#edb744] text-white flex items-center justify-center text-3xl font-medium">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Profile preview" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    editForm.name?.charAt(0)?.toUpperCase() || "A"
                  )}
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#2c2c2c]">Profile Picture</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="border border-[#d8ddd9] bg-[#f5f8f6] hover:bg-[#edf3ef] text-[#157a4f] text-base font-semibold rounded-xl px-3 py-1.5"
                    >
                      Change Photo
                    </button>
                    <button
                      onClick={() => setAvatarPreview("")}
                      className="text-base text-[#ef6f6f] font-semibold"
                    >
                      Remove
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarPick}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-xs font-bold tracking-wide text-[#4c4c4c] uppercase mb-2">Full Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => handleEditFieldChange("name", e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#e5e5e5] bg-[#f8f8f8] px-4 text-base text-[#2d2d2d] outline-none focus:border-[#157a4f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wide text-[#4c4c4c] uppercase mb-2">Email Address</label>
                  <input
                    value={editForm.email}
                    onChange={(e) => handleEditFieldChange("email", e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#e5e5e5] bg-[#f8f8f8] px-4 text-base text-[#2d2d2d] outline-none focus:border-[#157a4f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wide text-[#4c4c4c] uppercase mb-2">Phone Number</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => handleEditFieldChange("phone", e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#e5e5e5] bg-[#f8f8f8] px-4 text-base text-[#2d2d2d] outline-none focus:border-[#157a4f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wide text-[#4c4c4c] uppercase mb-2">Primary Location</label>
                  <input
                    value={editForm.location}
                    onChange={(e) => handleEditFieldChange("location", e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#e5e5e5] bg-[#f8f8f8] px-4 text-base text-[#2d2d2d] outline-none focus:border-[#157a4f]"
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold tracking-wide text-[#4c4c4c] uppercase">Category Preferences</label>
                  <span className="text-[#8cbca8] text-[10px] font-bold">MIN 5 SELECTED</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {modalCategories.map((category) => {
                    const selected = editForm.categories.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          selected
                            ? "border-[#6ebc9f] bg-[#e8f7ef] text-[#1a8a60]"
                            : "border-[#d7ddd9] bg-white text-[#7a7a7a]"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                  <button className="rounded-full border border-[#e4dbc5] bg-[#efe6cf] text-[#4d4737] px-4 py-1.5 text-sm font-semibold inline-flex items-center gap-1.5">
                    <Plus size={14} />
                    Add Category
                  </button>
                </div>
              </div>

              {editError && (
                <p className="mt-4 text-[#d45555] text-sm font-semibold">{editError}</p>
              )}
            </div>

            <div className="border-t border-[#ececec] px-6 py-4 flex items-center justify-end gap-3 bg-white">
              <button
                onClick={closeEditModal}
                className="h-11 min-w-[108px] rounded-xl border border-[#e2e2e2] text-[#3f3f3f] text-base font-semibold bg-[#f8f8f8]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfileFromModal}
                disabled={savingEdit}
                className="h-11 min-w-[170px] rounded-xl bg-[#157a4f] text-white text-base font-semibold shadow-md hover:bg-[#10613f] transition disabled:opacity-70"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}