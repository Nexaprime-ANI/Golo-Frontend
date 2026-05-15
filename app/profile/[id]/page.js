"use client";

import Image from "next/image";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Recommended from "@/app/components/Recommended";
import { getUserById, getAdsByUser } from "@/app/lib/api";
import { Flag, MessageCircle, MapPin, Package, Mail } from "lucide-react";
import UserReportModal from "@/app/components/UserReportModal";

function getAdImage(ad) {
  return (
    ad?.images?.[0] ||
    ad?.imageUrl ||
    ad?.image ||
    "/images/deal2.avif"
  );
}

function getAdPrice(ad) {
  const raw =
    ad?.price ??
    ad?.categorySpecificData?.price ??
    ad?.categorySpecificData?.rent ??
    ad?.categorySpecificData?.askingPrice;

  const parsed = Number(raw || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function UserProfile({ params }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const [userRes, adsRes] = await Promise.all([
          getUserById(userId),
          getAdsByUser(userId),
        ]);

        if (userRes?.success && userRes?.data) {
          setUser(userRes.data);
        }

        const adRows = Array.isArray(adsRes?.data)
          ? adsRes.data
          : Array.isArray(adsRes?.data?.ads)
          ? adsRes.data.ads
          : [];
        setAds(adRows);
      } catch {
        setUser(null);
        setAds([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "Email unavailable";
  const displayPhoto = user?.profilePhoto || "";
  const locationLabel =
    user?.profile?.address ||
    [user?.profile?.city, user?.profile?.state].filter(Boolean).join(", ") ||
    "Location not shared";

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-[#e4f5ed]" />
            <p className="text-sm text-[#667085]">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f6f8_55%,#ffffff_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
          <section className="overflow-hidden rounded-[28px] border border-[#e7ebf0] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.07)]">
            <div className="relative bg-[radial-gradient(circle_at_top_left,#dff6e9_0%,#f7fbff_45%,#ffffff_100%)] px-6 py-8 lg:px-8 lg:py-10">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#157A4F_0%,#20b66f_50%,#ffb648_100%)]" />
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[26px] border border-[#dce7df] bg-[#edf7f1] shadow-[0_10px_22px_rgba(21,122,79,0.12)]">
                    {displayPhoto ? (
                      <Image
                        src={displayPhoto}
                        alt={displayName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[#157A4F]">
                        {(displayName || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eefaf3] px-3 py-1 text-[12px] font-semibold text-[#157A4F]">
                      <Package size={14} />
                      Choja Seller
                    </div>
                    <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#111827] lg:text-[38px]">
                      {displayName}
                    </h1>
                    <div className="mt-4 flex flex-col gap-3 text-sm text-[#667085]">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-[#157A4F]" />
                        <span>{displayEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#157A4F]" />
                        <span>{locationLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <button
                    onClick={() => router.push(`/chats?sellerId=${userId}`)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#157A4F] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(21,122,79,0.22)] transition hover:bg-[#12643f]"
                  >
                    <MessageCircle size={17} />
                    Chat with Seller
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-[#f3c2c2] bg-[#fff7f7] px-5 text-sm font-semibold text-[#dc2626] transition hover:bg-[#feecec]"
                  >
                    <Flag size={17} />
                    Report User
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#157A4F]">
                  Marketplace
                </p>
                <h2 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#111827]">
                  Ads Uploaded by {displayName}
                </h2>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#667085] shadow-sm ring-1 ring-[#e7ebf0]">
                {ads.length} listing{ads.length === 1 ? "" : "s"}
              </div>
            </div>

            {ads.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#d7dee7] bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf7f1] text-[#157A4F]">
                  <Package size={24} />
                </div>
                <p className="mt-4 text-lg font-semibold text-[#1f2937]">
                  No ads uploaded yet
                </p>
                <p className="mt-2 text-sm text-[#667085]">
                  This seller has not published any Choja listings right now.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {ads.map((ad) => {
                  const price = getAdPrice(ad);
                  return (
                    <article
                      key={ad._id}
                      className="group overflow-hidden rounded-[24px] border border-[#e8edf3] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.10)]"
                    >
                      <div className="relative h-52 overflow-hidden bg-[#f4f6f8]">
                        <Image
                          src={getAdImage(ad)}
                          alt={ad?.title || "Ad"}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold text-[#157A4F] shadow-sm">
                          {ad?.category || "Listing"}
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="line-clamp-2 text-[18px] font-bold leading-6 text-[#111827]">
                            {ad?.title || "Untitled Ad"}
                          </h3>
                          {price ? (
                            <div className="shrink-0 rounded-full bg-[#edf7f1] px-3 py-1 text-[12px] font-bold text-[#157A4F]">
                              Rs.{price.toLocaleString("en-IN")}
                            </div>
                          ) : null}
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#667085]">
                          {ad?.description || "No description available for this listing."}
                        </p>

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div className="text-[12px] font-medium text-[#98a2b3]">
                            {ad?.createdAt
                              ? new Date(ad.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Recently added"}
                          </div>
                          <button
                            onClick={() => router.push(`/product/${ad._id}`)}
                            className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[#111827] px-4 text-[13px] font-semibold text-white transition hover:bg-[#157A4F]"
                          >
                            View Ad
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <Recommended />
      <Footer />
      <UserReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        userId={userId}
        userName={user?.name || user?.email || "User"}
      />
    </>
  );
}
