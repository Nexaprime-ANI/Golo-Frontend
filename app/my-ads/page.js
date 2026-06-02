"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileSidebar from "../components/ProfileSidebar";
import AdCard from "../components/AdCard";
import PostAdForm from "../components/PostAdForm";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRoleProtection, LoadingScreen } from "../components/RoleBasedRedirect";
import { getMyAds, updateAd } from "../lib/api";

export default function MyAds() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { isLoading, isAuthorized } = useRoleProtection("user");
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingAd, setEditingAd] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCities, setEditCities] = useState([]);
  const [editUploadedImages, setEditUploadedImages] = useState([]);
  const [editPrimaryContact, setEditPrimaryContact] = useState("");
  const [editSelectedCategory, setEditSelectedCategory] = useState(null);
  const [editSelectedDates, setEditSelectedDates] = useState([]);
  const [editMobilePrice, setEditMobilePrice] = useState("");
  const [editMonthlyRent, setEditMonthlyRent] = useState("");
  const [editPropertyTypeRent, setEditPropertyTypeRent] = useState("");
  const [editTemplateId, setEditTemplateId] = useState(1);
  const [editCategoryDetails, setEditCategoryDetails] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const limit = 9;

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchMyAds() {
      setLoading(true);
      try {
        const response = await getMyAds({ page, limit });
        if (response.success) {
          setAds(response.data || []);
          setTotalPages(response.pagination?.pages || 1);
        }
      } catch {
        setAds([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMyAds();
  }, [isAuthenticated, page]);

  if (isLoading) return <LoadingScreen />;

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="bg-[#F8F6F2] min-h-screen py-14 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-10">

          {/* LEFT SIDEBAR */}
          <ProfileSidebar />

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-3">

            <div className="bg-white rounded-3xl shadow-sm p-10">

              {/* Header */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-6">
                <div>
                  <h1 className="text-3xl font-semibold text-black">
                    My Ads
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Manage and track your posted ads
                  </p>
                </div>

                <Link
                  href="/i-want"
                  className="group relative inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#157A4F] text-white font-semibold shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95"
                >
                  <span className="relative z-10">I Want</span>
                  <span className="absolute inset-0 rounded-full bg-[#1c9460] opacity-0 group-hover:opacity-20 blur-md transition duration-300"></span>
                </Link>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center py-20">
                  <p className="text-gray-500">Loading your ads...</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && ads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-gray-500 text-lg mb-4">You haven&apos;t posted any ads yet</p>
                  <Link
                    href="/post-ad"
                    className="px-6 py-3 rounded-full bg-[#157A4F] text-white font-semibold transition hover:bg-[#0f5c3a]"
                  >
                    Post Your First Ad
                  </Link>
                </div>
              )}

              {/* Ads Grid */}
              {!loading && ads.length > 0 && (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {ads.map((ad) => (
                    <AdCard
                      key={ad._id}
                      ad={ad}
                      onDelete={(deletedId) => {
                        setAds(prev => prev.filter(a => (a.adId || a._id) !== deletedId));
                      }}
                      onEdit={(ad) => {
                        setEditingAd(ad);
                        setEditTitle("");
                        setEditDescription("");
                        setEditCities([]);
                        setEditUploadedImages([]);
                        setEditPrimaryContact("");
                        setEditSelectedCategory(null);
                        setEditSelectedDates([]);
                        setEditMobilePrice("");
                        setEditMonthlyRent("");
                        setEditPropertyTypeRent("");
                        setEditTemplateId(1);
                        setEditCategoryDetails(true);
                        setEditError("");
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-16">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-[#157A4F] hover:text-[#157A4F] transition disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 rounded-lg ${p === page
                        ? "bg-[#157A4F] text-white font-semibold shadow-sm"
                        : "border border-gray-300 bg-white hover:border-[#157A4F] hover:text-[#157A4F] transition"
                        }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-[#157A4F] hover:text-[#157A4F] transition disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      <Footer />

      {editingAd && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-7xl max-h-[calc(100vh-4rem)] overflow-hidden rounded-[28px] bg-white shadow-2xl border border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Edit Ad</h2>
                <p className="text-sm text-slate-500">Edit every field for this ad. The update can be saved only once.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAd(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 py-6">
                {editError && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    {editError}
                  </div>
                )}
              </div>
              <div className="px-6 pb-6">
                <PostAdForm
                  adTitleState={editTitle}
                  setAdTitleState={setEditTitle}
                  adDescriptionState={editDescription}
                  setAdDescriptionState={setEditDescription}
                  cities={editCities}
                  setCities={setEditCities}
                  uploadedImages={editUploadedImages}
                  setUploadedImages={setEditUploadedImages}
                  primaryContact={editPrimaryContact}
                  setPrimaryContact={setEditPrimaryContact}
                  selectedCategory={editSelectedCategory}
                  setSelectedCategory={setEditSelectedCategory}
                  selectedDates={editSelectedDates}
                  setSelectedDates={setEditSelectedDates}
                  mobilePrice={editMobilePrice}
                  setMobilePrice={setEditMobilePrice}
                  monthlyRent={editMonthlyRent}
                  setMonthlyRent={setEditMonthlyRent}
                  propertyTypeRent={editPropertyTypeRent}
                  setPropertyTypeRent={setEditPropertyTypeRent}
                  onCategoryDetailsChange={setEditCategoryDetails}
                  templateId={editTemplateId}
                  setTemplateId={setEditTemplateId}
                  initialAd={editingAd}
                />
              </div>
            </div>
            <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Category: <span className="font-semibold text-slate-900">{editSelectedCategory?.name || editingAd.category || "Unknown"}</span></p>
                  <p className="text-sm text-slate-600">Subcategory: <span className="font-semibold text-slate-900">{editSelectedCategory?.sub ? (editingAd.subCategory || editSelectedCategory?.sub?.[0]) : editingAd.subCategory || "General"}</span></p>
                  <p className="text-sm text-slate-600">Fields complete: <span className="font-semibold text-slate-900">{editCategoryDetails ? "Yes" : "No"}</span></p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAd(null);
                      setEditCategoryDetails(false);
                    }}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={editSaving || !editCategoryDetails}
                    onClick={async () => {
                      if (!editingAd) return;
                      if (!editCategoryDetails) {
                        setEditError("Please complete all category details before saving.");
                        return;
                      }

                      setEditSaving(true);
                      setEditError("");

                      const normalizePhone = (value) => {
                        const digits = String(value || "").replace(/\D/g, "");
                        if (!digits) return "";
                        if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
                        if (digits.length === 10) return `+91${digits}`;
                        return value;
                      };

                      const rawCategoryName = typeof editSelectedCategory === "string"
                        ? editSelectedCategory
                        : editSelectedCategory?.name || editingAd.category || "";

                      const categoryNameMap = {
                        Electronics: "Electronics & Home appliances",
                      };

                      const normalizedCategory = categoryNameMap[rawCategoryName] || rawCategoryName;
                      const normalizedPhone = normalizePhone(editPrimaryContact);
                      const resolvedPrice = Number(
                        editCategoryDetails?.price ??
                        editCategoryDetails?.rent ??
                        editCategoryDetails?.askingPrice ??
                        editCategoryDetails?.rentAmount ??
                        editCategoryDetails?.fees ??
                        editCategoryDetails?.pricePerPerson ??
                        editCategoryDetails?.consultationFee ??
                        editCategoryDetails?.charges ??
                        editMobilePrice ??
                        editMonthlyRent ??
                        0
                      ) || 0;

                      const uploadedUrls = [];
                      try {
                        const { uploadToCloudinary } = await import("../services/cloudinaryConfig");
                        for (const img of editUploadedImages || []) {
                          if (img?.file) {
                            const uploadedData = await uploadToCloudinary(img.file);
                            uploadedUrls.push(uploadedData.url);
                          } else if (typeof img === "string") {
                            uploadedUrls.push(img);
                          } else if (img?.url) {
                            uploadedUrls.push(img.url);
                          }
                        }
                      } catch (uploadError) {
                        setEditError(uploadError?.message || "Image upload failed. Please try again.");
                        setEditSaving(false);
                        return;
                      }

                      const updateData = {
                        title: editTitle.trim(),
                        description: editDescription.trim(),
                        category: normalizedCategory,
                        subCategory:
                          editCategoryDetails?.subCategory ||
                          editCategoryDetails?.listingType ||
                          editCategoryDetails?.type ||
                          editCategoryDetails?.tributeType ||
                          (typeof editSelectedCategory === "string"
                            ? editSelectedCategory
                            : editSelectedCategory?.name || "General"),
                        images: uploadedUrls,
                        price: resolvedPrice,
                        location: editCities?.[0] || "India",
                        city: editCities?.[0] || "",
                        cities: editCities || [],
                        primaryContact: normalizedPhone,
                        contactInfo: {
                          name: user?.name || "User",
                          phone: normalizedPhone || "",
                          email: user?.email || "",
                          preferredContactMethod: "phone",
                        },
                        templateId: editTemplateId,
                        selectedDates: editSelectedDates || [],
                        negotiable: Boolean(editCategoryDetails?.negotiable),
                        tags: [normalizedCategory].filter(Boolean),
                        categorySpecificData: editCategoryDetails,
                      };

                      if (normalizedCategory === "Property" && editPropertyTypeRent) {
                        updateData.propertyData = { propertyType: editPropertyTypeRent, rent: editMonthlyRent };
                      }
                      if (normalizedCategory === "Mobiles" && editMobilePrice) {
                        updateData.mobileData = { price: editMobilePrice };
                      }

                      const categoryKeyMap = {
                        Education: "educationData",
                        Matrimonial: "matrimonialData",
                        Vehicle: "vehicleData",
                        Business: "businessData",
                        Travel: "travelData",
                        Astrology: "astrologyData",
                        Property: "propertyData",
                        "Public Notice": "publicNoticeData",
                        "Lost & Found": "lostFoundData",
                        Service: "serviceData",
                        Personal: "personalData",
                        Employment: "employmentData",
                        Pets: "petsData",
                        Mobiles: "mobileData",
                        Electronics: "electronicsData",
                        "Electronics & Home appliances": "electronicsData",
                        Furniture: "furnitureData",
                        "Greetings & Tributes": "greetingsData",
                        Other: "otherData",
                      };

                      const categoryKey = categoryKeyMap[normalizedCategory];
                      if (categoryKey) {
                        updateData[categoryKey] = editCategoryDetails;
                      }

                      try {
                        const apiId = editingAd.adId || editingAd._id;
                        const response = await updateAd(apiId, updateData);
                        if (response?.success) {
                          setAds((prevAds) => prevAds.map((ad) => {
                            const id = ad.adId || ad._id;
                            if (id !== apiId) return ad;
                            return {
                              ...ad,
                              ...updateData,
                              editCount: Math.max(Number(ad.editCount || 0), 0) + 1,
                              hasUsedEdit: true,
                            };
                          }));
                          setEditingAd(null);
                        } else {
                          setEditError(response?.message || "Unable to save changes. Please try again.");
                        }
                      } catch (error) {
                        setEditError(error?.data?.message || error?.message || "Update failed. Please try again.");
                      } finally {
                        setEditSaving(false);
                      }
                    }}
                    className="w-full rounded-2xl bg-[#157A4F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#13673a] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
