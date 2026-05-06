"use client";

// Use plain <img> for recommended offers to avoid next/image host config issues
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getNearbyOffers } from "../lib/api";

const GLOCAL_CATEGORY_ID_TO_LABEL = {
  "food-restaurants": "Food & Restaurants",
  "home-services": "Home Services",
  "beauty-wellness": "Beauty & Wellness",
  "healthcare-medical": "Healthcare & Medical",
  "hotels-accommodation": "Hotels & Accommodation",
  "shopping-retail": "Shopping & Retail",
  "education-training": "Education & Training",
  "real-estate": "Real Estate",
  "events-entertainment": "Events & Entertainment",
  "professional-services": "Professional Services",
  "automotive-services": "Automotive Services",
  "home-improvement": "Home Improvement",
  "fitness-sports": "Fitness & Sports",
  "daily-needs": "Daily Needs & Utilities",
  "local-businesses-vendors": "Local Businesses & Vendors",
};

function resolveGolocalCategoryLabel(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  return GLOCAL_CATEGORY_ID_TO_LABEL[rawValue] || rawValue;
}

function normalizeForKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeRecommendationCategory(value) {
  return normalizeForKey(value);
}

function getRecommendedCacheKey(userEmail) {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  return normalizedEmail ? `golo_recommended_deals_${normalizedEmail}` : "golo_recommended_deals_guest";
}

function loadRecommendedCache(userEmail) {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(getRecommendedCacheKey(userEmail));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecommendedCache(userEmail, deals) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getRecommendedCacheKey(userEmail), JSON.stringify(deals));
  } catch {
    // Ignore cache write failures.
  }
}

function getStoredGolocalCategories(userEmail) {
  if (typeof window === "undefined") return [];

  const keys = [];
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (normalizedEmail) {
    keys.push(`golo_golocal_selected_categories_email_${normalizedEmail}`);
  }
  keys.push("golo_golocal_selected_categories");

  const collected = [];
  const seen = new Set();

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      for (const item of parsed) {
        const label = resolveGolocalCategoryLabel(item);
        const dedupeKey = normalizeRecommendationCategory(label);
        if (!label || seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        collected.push(label);
      }

      if (collected.length > 0) {
        break;
      }
    } catch {
      // Ignore malformed localStorage payloads and fall back below.
    }
  }

  return collected;
}

export default function Recommended() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [deals, setDeals] = useState([]);
  const [fetchState, setFetchState] = useState("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const buildDealCards = (offers = []) => {
    const seenIds = new Set();
    const mapped = [];

    for (const offer of offers) {
      const id = String(offer.offerId || offer._id || "");
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);

      mapped.push({
        id,
        title: offer.title || offer.dealName || "Untitled Deal",
        img: offer.imageUrl || offer.images?.[0] || offer.image || "/images/deal1.jpg",
        discount: offer.discount ? `${offer.discount}% OFF` : offer.discountText || "Special Offer",
        description: offer.description || "",
        isFromApi: true,
      });
    }

    return mapped.slice(0, 4);
  };

  const commitOffers = (offers, userEmail) => {
    const nextDeals = buildDealCards(offers);
    setDeals(nextDeals);
    setFetchState(nextDeals.length > 0 ? "success" : "empty");
    saveRecommendedCache(userEmail, nextDeals);
    return nextDeals;
  };

  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    let intervalId = null;

    async function fetchRecommended() {
      const currentUserEmail = user?.email;

      if (!cancelled) {
        const cachedDeals = loadRecommendedCache(currentUserEmail);
        if (cachedDeals.length > 0) {
          setDeals(cachedDeals);
          setFetchState("success");
          setIsRefreshing(true);
        } else {
          setFetchState("loading");
          setIsRefreshing(false);
        }
      }

      try {
        const storedCategoryIds = getStoredGolocalCategories(currentUserEmail);
        const allOffers = [];
        const seenIds = new Set();

        console.log("[Recommended] Stored GOLOCAL category IDs:", storedCategoryIds);

        if (storedCategoryIds && storedCategoryIds.length > 0) {
          const categoryPromises = storedCategoryIds.map(async (categoryId) => {
            try {
              const categoryLabel = resolveGolocalCategoryLabel(categoryId);

              if (!categoryLabel) {
                console.warn(`[Recommended] Unknown category ID: ${categoryId}`);
                return;
              }

              console.log(`[Recommended] Fetching offers for category: ${categoryLabel} (ID: ${categoryId})`);

              const response = await getNearbyOffers({
                category: categoryLabel,
                limit: 25,
                page: 1,
                activeNowOnly: true,
              });

              const rows = response?.success && Array.isArray(response?.data) ? response.data : [];

              for (const offer of rows) {
                const offerId = String(offer.offerId || offer._id || "");
                if (!offerId || seenIds.has(offerId)) continue;

                seenIds.add(offerId);
                allOffers.push(offer);

                if (!cancelled) {
                  const sortedOffers = [...allOffers].sort(
                    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
                  );
                  commitOffers(sortedOffers, currentUserEmail);
                  setIsRefreshing(true);
                }
              }
            } catch (err) {
              console.warn(`[Recommended] Error fetching offers for category ${categoryId}:`, err);
            }
          });

          await Promise.allSettled(categoryPromises);

          if (allOffers.length > 0) {
            const sortedOffers = [...allOffers].sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
            );

            if (!cancelled) {
              commitOffers(sortedOffers, currentUserEmail);
              setIsRefreshing(false);
            }
            return;
          }
        }

        console.log('[Recommended] No category-based offers found or no categories selected. Trying general offers...');

        try {
          const generalResponse = await getNearbyOffers({
            limit: 20,
            page: 1,
            activeNowOnly: true,
          });

          if (generalResponse?.success && Array.isArray(generalResponse?.data) && generalResponse.data.length > 0) {
            if (!cancelled) {
              commitOffers(generalResponse.data.slice(0, 4), currentUserEmail);
              setIsRefreshing(false);
            }
            return;
          }
        } catch (err) {
          console.warn('[Recommended] Failed to fetch general offers:', err);
        }

        if (!cancelled) {
          setDeals([]);
          setFetchState("empty");
          setIsRefreshing(false);
        }
      } catch (err) {
        console.error('[Recommended] Unexpected error:', err);
        if (!cancelled) {
          setDeals([]);
          setFetchState("error");
          setIsRefreshing(false);
        }
      }
    }

    // initial fetch
    fetchRecommended();

    // re-fetch when window gains focus (user returns to tab)
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        fetchRecommended();
      }
    }

    function handleWindowFocus() {
      fetchRecommended();
    }

    // storage event from other tabs (e.g., onboarding updated categories)
    function handleStorage() {
      fetchRecommended();
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('storage', handleStorage);

    // poll every 60 seconds to keep recommendations fresh
    try {
      intervalId = setInterval(() => {
        fetchRecommended();
      }, 60000);
    } catch {}

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loading, user?.email]);

  return (
    <section className="py-16 theme-section">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-semibold theme-heading">
            Recommended Deals
          </h2>

          <div className="flex items-center gap-3">
            {isRefreshing ? <span className="text-xs font-medium text-gray-500">Refreshing...</span> : null}
            <button 
              className="theme-button-accent px-4 py-2 rounded-full text-sm transition"
              suppressHydrationWarning={true}
            >
              View More →
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {fetchState === "loading" ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="h-36 w-full animate-pulse bg-gray-200" />
                <div className="p-3 space-y-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-9 w-full animate-pulse rounded-lg bg-gray-200" />
                </div>
              </div>
            ))
          ) : fetchState === "error" ? (
            <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              Live recommendations are unavailable right now. Showing no static fallback.
            </div>
          ) : fetchState === "empty" || deals.length === 0 ? (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              No live recommended deals found for your selected categories.
            </div>
          ) : (
            deals.map((deal, i) => (
              <article
                key={deal.id || i}
                onClick={() => deal.id && router.push(`/nearby-deals/deal?offerId=${encodeURIComponent(deal.id)}`)}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#157A4F] hover:shadow-lg"
              >
                <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                  <img
                    src={deal.img}
                    alt={deal.title}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = "/images/deal2.avif";
                    }}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#157A4F] to-[#28A745] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Recommended
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{deal.title}</h3>
                  <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">
                    {deal.description || "Discover live deals near you."}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#157A4F]">{deal.discount}</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (deal.id) router.push(`/nearby-deals/deal?offerId=${encodeURIComponent(deal.id)}`);
                    }}
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-[#F7F7F7] py-2 text-xs font-bold text-gray-800 transition-colors duration-200 hover:border-[#157A4F] hover:bg-[#157A4F] hover:text-white"
                  >
                    View Deal
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
