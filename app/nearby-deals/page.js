"use client";

import { Suspense, useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Grid2x2, List, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import CategoryBar from "../components/CategoryBar";
import Footer from "../components/Footer";
import AuthRequiredModal from "../components/AuthRequiredModal";
import { getNearbyOffers } from "../lib/api";

const OFFER_TYPES = [
  "Special",
  "Festival",
  "Limited Time",
  "Combo",
  "Clearance",
  "Flash Sale",
  "Buy One Get One (BOGO)",
  "Flat Discount",
  "Percentage Off",
  "Bundle Deal",
  "New Arrival Offer",
  "Seasonal Offer",
  "Weekend Offer",
  "Happy Hour Deal",
  "Member Exclusive",
  "First Purchase Offer",
  "Loyalty Reward",
  "Referral Offer",
  "Clear Stock Sale",
  "Free Gift Offer",
];

const SORT_OPTIONS = [
  { value: "nearest", label: "Nearest" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount_desc", label: "Best Discount" },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function getDaysRemainingText(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days <= 1 ? "1 day left" : `${days} days left`;
}

function computeBestDiscountPercent(products = [], fallback = 0) {
  const fallbackValue = toNumber(fallback, 0);
  if (fallbackValue > 0) {
    return Math.max(0, Math.round(fallbackValue));
  }

  return Math.round(
    products.reduce((best, product) => {
      const original = toNumber(product?.originalPrice, 0);
      const offer = toNumber(product?.offerPrice, 0);
      if (original <= 0 || offer < 0 || offer >= original) {
        return best;
      }
      const discount = ((original - offer) / original) * 100;
      return Math.max(best, discount);
    }, 0),
  );
}

function computeStartingPrice(products = [], fallback = 0) {
  const fallbackValue = toNumber(fallback, 0);
  if (fallbackValue > 0) {
    return fallbackValue;
  }

  if (!Array.isArray(products) || products.length === 0) {
    return fallbackValue;
  }

  const values = products
    .map((item) => toNumber(item?.offerPrice, 0))
    .filter((price) => price > 0);

  if (!values.length) {
    return fallbackValue;
  }

  return values.reduce((sum, price) => sum + price, 0);
}

function normalizeNearbyOffer(row) {
  const selectedProducts = Array.isArray(row?.selectedProducts) ? row.selectedProducts : [];
  const displayPrice = computeStartingPrice(selectedProducts, row?.displayPrice || row?.totalPrice);
  const discountPercent = computeBestDiscountPercent(selectedProducts, row?.discountPercent);

  return {
    ...row,
    selectedProducts,
    displayPrice,
    discountPercent,
  };
}

function formatDistance(distanceKm) {
  if (typeof distanceKm !== "number" || Number.isNaN(distanceKm)) return "Nearby";
  return `${distanceKm.toFixed(1)} km`;
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getOfferBadgeLabel(row) {
  const discountPercent = toNumber(row?.discountPercent, 0);
  if (discountPercent > 0) {
    return `${discountPercent}% OFF`;
  }

  const products = row?.selectedProducts || [];
  const productCount = Array.isArray(products) ? products.length : 0;
  if (productCount > 0) {
    return `${productCount} Product${productCount > 1 ? 's' : ''}`;
  }

  const category = String(row?.category || "").trim();
  return category ? category.toUpperCase() : "SPECIAL OFFER";
}

function matchOfferType(row, typeLabel) {
  const title = String(row?.title || "").toLowerCase();
  const category = String(row?.category || "").toLowerCase();
  const combined = `${title} ${category}`;
  const normalizedType = String(typeLabel || "").trim().toLowerCase();

  // Exact category match first for the new offer category model.
  if (normalizedType && category === normalizedType) {
    return true;
  }

  if (normalizedType === "flat discount") {
    return row?.discountPercent > 0 || combined.includes("discount") || combined.includes("flat");
  }

  if (normalizedType === "buy one get one (bogo)") {
    return (
      combined.includes("bogo") ||
      combined.includes("buy 1 get 1") ||
      combined.includes("buy one get one")
    );
  }

  if (normalizedType === "combo") {
    return combined.includes("combo");
  }

  if (normalizedType === "percentage off") {
    return combined.includes("%") || combined.includes("percent") || combined.includes("percentage");
  }

  return combined.includes(normalizedType);
}

function NearbyDealsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
   const { isAuthenticated, user } = useAuth();

  const [activeView, setActiveView] = useState("grid");
  const [distanceRadius, setDistanceRadius] = useState(50);
  const [priceRange, setPriceRange] = useState(5000);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState("detecting");
  const [locationError, setLocationError] = useState("");
  const [topDiscountOnly, setTopDiscountOnly] = useState(false);
  const [activeNowOnly, setActiveNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState("nearest");
  const [selectedOfferTypes, setSelectedOfferTypes] = useState({
    Special: false,
    Festival: false,
    "Limited Time": false,
    Combo: false,
    Clearance: false,
    "Flash Sale": false,
    "Buy One Get One (BOGO)": false,
    "Flat Discount": false,
    "Percentage Off": false,
    "Bundle Deal": false,
    "New Arrival Offer": false,
    "Seasonal Offer": false,
    "Weekend Offer": false,
    "Happy Hour Deal": false,
    "Member Exclusive": false,
    "First Purchase Offer": false,
    "Loyalty Reward": false,
    "Referral Offer": false,
    "Clear Stock Sale": false,
    "Free Gift Offer": false,
  });
  const [rawOffers, setRawOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authRedirectTo, setAuthRedirectTo] = useState("/nearby-deals");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const lastLocationUpdateRef = useRef(0);
  const nearbyFetchSeqRef = useRef(0);

  const selectedTypeLabels = useMemo(
    () => Object.keys(selectedOfferTypes).filter((key) => selectedOfferTypes[key]),
    [selectedOfferTypes],
  );

  const location = useMemo(() => searchParams.get("location") || "", [searchParams]);
  const manualLatitude = useMemo(() => {
    const value = Number(searchParams.get("lat"));
    // Treat zero or near-zero coordinates as not provided (avoid lat=0 sentinel)
    return Number.isFinite(value) && Math.abs(value) > 0.000001 ? value : null;
  }, [searchParams]);
  const manualLongitude = useMemo(() => {
    const value = Number(searchParams.get("lng"));
    // Treat zero or near-zero coordinates as not provided (avoid lng=0 sentinel)
    return Number.isFinite(value) && Math.abs(value) > 0.000001 ? value : null;
  }, [searchParams]);
  const query = useMemo(() => searchParams.get("q") || "", [searchParams]);
  const selectedCategory = useMemo(() => searchParams.get("category") || "", [searchParams]);

  // When user types a location search (e.g. "Mumbai"), avoid showing stale "nearby" results
  // from the previous GPS-based fetch while the new request is loading/processing.
  useEffect(() => {
    if (String(location || "").trim()) {
      setRawOffers([]);
    }
  }, [location]);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      setLocationError("Location services are not available in this browser.");
      return;
    }

    let ignoreResult = false;
    let watchId = null;
    setLocationStatus("detecting");
    setLocationError("");

    const handlePositionSuccess = (position) => {
      if (ignoreResult) return;

      const nextLat = Number(position.coords.latitude);
      const nextLng = Number(position.coords.longitude);
      if (Number.isNaN(nextLat) || Number.isNaN(nextLng)) return;

      setUserCoordinates((prev) => {
        if (!prev) {
          lastLocationUpdateRef.current = Date.now();
          return { lat: nextLat, lng: nextLng };
        }

        // Avoid noisy re-fetches for tiny GPS drifts and rapid watch updates.
        const latDiff = Math.abs(prev.lat - nextLat);
        const lngDiff = Math.abs(prev.lng - nextLng);
        const movedTooLittle = latDiff < 0.0015 && lngDiff < 0.0015; // ~150m threshold
        const updatedTooSoon = Date.now() - lastLocationUpdateRef.current < 15000;
        if (movedTooLittle || updatedTooSoon) {
          return prev;
        }

        lastLocationUpdateRef.current = Date.now();
        return { lat: nextLat, lng: nextLng };
      });
      setLocationStatus("ready");
      setLocationError("");
    };

    const handlePositionError = (geoError) => {
      if (ignoreResult) return;
      setUserCoordinates(null);

      if (geoError?.code === geoError.PERMISSION_DENIED) {
        setLocationStatus("denied");
        setLocationError("Location permission denied. Enable it to use exact distance filters.");
        return;
      }

      if (geoError?.code === geoError.POSITION_UNAVAILABLE) {
        setLocationStatus("unavailable");
        setLocationError("Current location is unavailable. Please try again.");
        return;
      }

      if (geoError?.code === geoError.TIMEOUT) {
        setLocationStatus("timeout");
        setLocationError("Location request timed out. Please try again.");
        return;
      }

      setLocationStatus("error");
      setLocationError("Could not detect your location.");
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (ignoreResult) return;
        handlePositionSuccess(position);
      },
      handlePositionError,
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 15000,
      },
    );

    watchId = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 30000,
      },
    );

    return () => {
      ignoreResult = true;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    const loadNearbyOffers = async () => {
      const fetchSeq = ++nearbyFetchSeqRef.current;
      setLoading(true);
      setError("");

      const resolvedLat =
        typeof userCoordinates?.lat === "number" && !Number.isNaN(userCoordinates.lat)
          ? userCoordinates.lat
          : undefined;
      const resolvedLng =
        typeof userCoordinates?.lng === "number" && !Number.isNaN(userCoordinates.lng)
          ? userCoordinates.lng
          : undefined;

      // If user explicitly provided a location (navbar/manual), prefer that
      // and do not constrain results by current GPS coordinates.
      const hasManualCoordinates = manualLatitude !== null && manualLongitude !== null;
      const hasLocationQuery = Boolean(String(location || "").trim());
      // When a location string is provided (e.g. "Pune"), do not use live GPS coords,
      // otherwise results get mixed with the current device location.
      const fetchLat = hasLocationQuery ? (hasManualCoordinates ? manualLatitude : undefined) : (hasManualCoordinates ? manualLatitude : resolvedLat);
      const fetchLng = hasLocationQuery ? (hasManualCoordinates ? manualLongitude : undefined) : (hasManualCoordinates ? manualLongitude : resolvedLng);
      const hasCoordinateSearch = typeof fetchLat === "number" && typeof fetchLng === "number";
      const locationForRequest = hasCoordinateSearch ? "" : location;

      try {
        const response = await getNearbyOffers({
          lat: fetchLat,
          lng: fetchLng,
          radiusKm: distanceRadius,
          location: locationForRequest,
          q: query,
          category: selectedCategory || undefined,
          sort: sortBy,
          maxPrice: priceRange < 5000 ? priceRange : undefined,
          applyPriceFilter: priceRange < 5000,
          offerTypes: selectedTypeLabels.join(','),
          topDiscountOnly: topDiscountOnly,
          activeNowOnly: activeNowOnly,
          page: 1,
          limit: 100,
        });

        const primaryRows = Array.isArray(response?.data)
          ? response.data.map(normalizeNearbyOffer)
          : [];

        // If the user explicitly provided a location string and the backend
        // returned no results for that location, do NOT fall back to other
        // nearby offers — show an empty state instead. This prevents showing
        // unrelated deals (e.g., Kolhapur) for a typed location like "Mumbai".
        if (hasLocationQuery && !hasCoordinateSearch && primaryRows.length === 0) {
          if (fetchSeq !== nearbyFetchSeqRef.current) return;
          setRawOffers([]);
          setLoading(false);
          return;
        }

        // Graceful fallback: if strict geofence returns empty, show relevant offers
        // instead of a blank state (helps when merchant coords are incomplete/inaccurate).
        if (primaryRows.length === 0 && fetchLat !== undefined && fetchLng !== undefined) {
          const fallbackResponse = await getNearbyOffers({
            lat: undefined,
            lng: undefined,
            radiusKm: distanceRadius,
            location: locationForRequest,
            q: query,
            category: selectedCategory || undefined,
            sort: sortBy,
            maxPrice: priceRange < 5000 ? priceRange : undefined,
            applyPriceFilter: priceRange < 5000,
            offerTypes: selectedTypeLabels.join(','),
            topDiscountOnly: topDiscountOnly,
            activeNowOnly: activeNowOnly,
            page: 1,
            limit: 100,
          });

          if (fetchSeq !== nearbyFetchSeqRef.current) return;
          const fallbackRows = Array.isArray(fallbackResponse?.data)
            ? fallbackResponse.data.map(normalizeNearbyOffer)
            : [];
          setRawOffers(fallbackRows);
        } else {
          if (fetchSeq !== nearbyFetchSeqRef.current) return;
          setRawOffers(primaryRows);
        }
      } catch (err) {
        if (fetchSeq !== nearbyFetchSeqRef.current) return;
        setError(err?.message || "Failed to load nearby offers.");
        // For explicit location searches, never keep stale nearby results.
        if (String(location || "").trim()) {
          setRawOffers([]);
        }
      } finally {
        if (fetchSeq !== nearbyFetchSeqRef.current) return;
        setLoading(false);
      }
    };

    loadNearbyOffers();
  }, [distanceRadius, priceRange, location, query, selectedCategory, sortBy, userCoordinates?.lat, userCoordinates?.lng, manualLatitude, manualLongitude, selectedTypeLabels, topDiscountOnly, activeNowOnly]);

  const filteredDeals = useMemo(() => {
    const rows = rawOffers.filter((row) => {
      // Respect activeNowOnly toggle: when enabled, hide offers outside visibility window.
      if (activeNowOnly && !row?.isActiveNow) {
        return false;
      }

      if (topDiscountOnly && toNumber(row?.discountPercent, 0) < 30) {
        return false;
      }

      if (selectedTypeLabels.length > 0) {
        const typeMatched = selectedTypeLabels.some((typeLabel) => matchOfferType(row, typeLabel));
        if (!typeMatched) {
          return false;
        }
      }

      // Exclude expired offers from nearby/category listings. Expired deals
      // should only appear in the user's `My Deals` view when they have
      // previously claimed or redeemed them.
      const expiryCandidates = row?.endsAt || row?.expiresAt || row?.expiry || row?.expires_at || row?.endDate;
      if (expiryCandidates) {
        const ts = new Date(expiryCandidates).getTime();
        if (!Number.isNaN(ts) && ts <= Date.now()) {
          return false;
        }
      }

      return true;
    });

    const sortedRows = [...rows];

    if (sortBy === "price_asc") {
      sortedRows.sort((a, b) => toNumber(a?.displayPrice, 0) - toNumber(b?.displayPrice, 0));
    } else if (sortBy === "price_desc") {
      sortedRows.sort((a, b) => toNumber(b?.displayPrice, 0) - toNumber(a?.displayPrice, 0));
    } else if (sortBy === "newest") {
      sortedRows.sort(
        (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime(),
      );
    } else if (sortBy === "discount_desc") {
      sortedRows.sort((a, b) => toNumber(b?.discountPercent, 0) - toNumber(a?.discountPercent, 0));
    } else {
      sortedRows.sort((a, b) => {
        const distanceA = typeof a?.distanceKm === "number" ? a.distanceKm : Number.MAX_SAFE_INTEGER;
        const distanceB = typeof b?.distanceKm === "number" ? b.distanceKm : Number.MAX_SAFE_INTEGER;
        return distanceA - distanceB;
      });
    }

    const hasCoordinateSearch = manualLatitude !== null && manualLongitude !== null;

    if (!location || hasCoordinateSearch) {
      return sortedRows;
    }

    // When user provided a location string, only include offers whose merchant
    // store location/address contains that location. Use a normalized, punctuation-
    // insensitive match so queries like "Kolhapur, Maharashtra, India" match
    // stored addresses such as "Kolhapur District, Maharashtra, India".
    const normalize = (v) =>
      String(v || '')
        .toLowerCase()
        .replace(/[^ -\u007F\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const locationNorm = normalize(location);
    if (!locationNorm) return [];

    // Prefer the city segment (first comma-separated part). This avoids
    // matches based only on state/country tokens like "Maharashtra" or "India".
    const citySegment = String(location).split(',')[0] || location;
    const cityNorm = normalize(citySegment);
    const LOCATION_ALIASES = {
      kolhapur: ['kolhapur', 'karvir', 'karveer', 'karveer taluka', 'karvir taluka'],
    };

    return sortedRows.filter((row) => {
      const addressNorm = normalize(row?.merchant?.address || row?.merchant?.name || '');
      if (!addressNorm) return false;

      // Direct city match (preferred)
      if (cityNorm && addressNorm.includes(cityNorm)) return true;

      // Alias match for city
      const aliases = LOCATION_ALIASES[cityNorm];
      if (aliases && aliases.length) {
        for (const alias of aliases) {
          if (normalize(alias) && addressNorm.includes(normalize(alias))) return true;
        }
      }

      return false;
    });
  }, [rawOffers, activeNowOnly, topDiscountOnly, selectedTypeLabels, location, sortBy]);

  const summary = useMemo(() => {
    const total = filteredDeals.length;
    const active = filteredDeals.filter((row) => row?.isActiveNow).length;
    const avgPrice =
      total > 0
        ? Math.round(
            filteredDeals.reduce((sum, row) => sum + toNumber(row?.displayPrice, 0), 0) / total,
          )
        : 0;

    return { total, active, avgPrice };
  }, [filteredDeals]);

  const clearAllFilters = () => {
    setDistanceRadius(50);
    setPriceRange(5000);
    setTopDiscountOnly(false);
    setActiveNowOnly(true);
    setSortBy("nearest");
    setSelectedOfferTypes({
      Special: false,
      Festival: false,
      "Limited Time": false,
      Combo: false,
      Clearance: false,
      "Flash Sale": false,
      "Buy One Get One (BOGO)": false,
      "Flat Discount": false,
      "Percentage Off": false,
      "Bundle Deal": false,
      "New Arrival Offer": false,
      "Seasonal Offer": false,
      "Weekend Offer": false,
      "Happy Hour Deal": false,
      "Member Exclusive": false,
      "First Purchase Offer": false,
      "Loyalty Reward": false,
      "Referral Offer": false,
      "Clear Stock Sale": false,
      "Free Gift Offer": false,
    });
  };

  const openDealDetails = (deal) => {
    const targetUrl = `/nearby-deals/deal?offerId=${deal.offerId}`;

    if (!isAuthenticated) {
      setAuthRedirectTo(targetUrl);
      setShowAuthPrompt(true);
      return;
    }

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          `golo_nearby_offer_${deal.offerId}`,
          JSON.stringify(deal),
        );
      } catch {
      }
    }

    router.push(targetUrl);
  };

  return (
    <main className="min-h-screen bg-[#F3F3F3]">
      <Navbar />
       <CategoryBar variant="golocal" preferredCategories={user?.preferredCategories || []} />

      <section className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => setShowMobileFilters((value) => !value)}
          className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-sm lg:hidden"
        >
          <SlidersHorizontal size={15} />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </button>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
          <aside className={`${showMobileFilters ? "block" : "hidden"} max-h-[68vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm lg:sticky lg:top-28 lg:block lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:p-4`}>
            <div className="mb-4 flex items-center justify-between lg:mb-5">
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                <SlidersHorizontal size={14} /> Filters
              </button>
              <button className="text-xs font-semibold text-[#157A4F]" onClick={clearAllFilters}>
                Clear All
              </button>
            </div>

            <div className="mb-4 lg:mb-6">
              <p className="mb-3 text-[11px] font-bold tracking-wide text-gray-400">DISTANCE RADIUS</p>
              <input
                type="range"
                min="1"
                max="50"
                value={distanceRadius}
                onChange={(e) => setDistanceRadius(Number(e.target.value))}
                className="w-full accent-[#157A4F]"
              />
              <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                <span>1 km</span><span>25 km</span><span>50 km</span>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-[#157A4F]">Selected: {distanceRadius} km</p>
            </div>

            <div className="mb-4 lg:mb-6">
              <p className="mb-3 text-[11px] font-bold tracking-wide text-gray-400">OFFER TYPE</p>
              <div className="grid max-h-[136px] grid-cols-2 gap-2 overflow-y-auto pr-1 text-xs text-gray-700 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent lg:grid-cols-1 lg:max-h-[150px] lg:pr-2">
                {OFFER_TYPES.map((item) => (
                  <label key={item} className="flex min-h-6 items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 shrink-0 rounded border-gray-300"
                      checked={selectedOfferTypes[item]}
                      onChange={(e) =>
                        setSelectedOfferTypes((prev) => ({
                          ...prev,
                          [item]: e.target.checked,
                        }))
                      }
                    />
                    <span className="min-w-0 truncate" title={item}>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4 lg:mb-6">
              <p className="mb-3 text-[11px] font-bold tracking-wide text-gray-400">PRICE RANGE</p>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#157A4F]"
              />
              <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                <span>₹100</span><span>₹1.5k</span><span>₹5k</span>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-[#157A4F]">
                {priceRange < 5000
                  ? `Max: ₹${priceRange.toLocaleString("en-IN")}`
                  : "Max: Any price"}
              </p>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold tracking-wide text-gray-400">OTHER TOGGLES</p>
              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Top Discount (30%+)</span>
                  <button
                    onClick={() => setTopDiscountOnly((v) => !v)}
                    className={`h-4 w-8 rounded-full p-[2px] ${topDiscountOnly ? "bg-[#1B9B5A]" : "bg-gray-300"}`}
                  >
                    <span className={`block h-3 w-3 rounded-full bg-white transition ${topDiscountOnly ? "translate-x-4" : ""}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Today</span>
                  <button
                    onClick={() => setActiveNowOnly((v) => !v)}
                    className={`h-4 w-8 rounded-full p-[2px] ${activeNowOnly ? "bg-[#1B9B5A]" : "bg-gray-300"}`}
                  >
                    <span className={`block h-3 w-3 rounded-full bg-white transition ${activeNowOnly ? "translate-x-4" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-[26px] font-extrabold leading-tight text-gray-900 sm:text-[34px]">{selectedCategory || "Deals near you"}</h1>
                <p className="mt-1 text-xs text-gray-500">
                  Showing {summary.total} offers
                  {selectedCategory ? ` in ${selectedCategory}` : ""}
                  {query ? ` for \"${query}\"` : ""}
                  {location ? ` in ${location}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {locationStatus === "ready"
                    ? `Distance filter uses your live location (${distanceRadius} km radius) for offers with coordinates.`
                    : locationStatus === "detecting"
                      ? "Detecting your location for accurate nearby results..."
                      : "Enable location permission to make distance filters fully accurate."}
                </p>
                {locationError ? <p className="mt-1 text-[11px] text-amber-600">{locationError}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  className={`rounded-md border border-gray-200 bg-white p-2 ${activeView === "grid" ? "text-gray-700" : "text-gray-400"}`}
                  onClick={() => setActiveView("grid")}
                >
                  <Grid2x2 size={14} />
                </button>
                <button
                  className={`rounded-md border border-gray-200 bg-white p-2 ${activeView === "list" ? "text-gray-700" : "text-gray-400"}`}
                  onClick={() => setActiveView("list")}
                >
                  <List size={14} />
                </button>
                <button className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 sm:flex-none">
                  Sort:
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs text-gray-700 outline-none"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            <div className="mb-4 flex w-full gap-2 sm:gap-3">
              <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2 sm:px-3">
                <p className="text-[9px] leading-tight text-gray-500 sm:text-[11px]">Total Deals</p>
                <p className="text-[18px] font-semibold text-gray-900 sm:text-[20px]">{summary.total}</p>
              </div>
              <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2 sm:px-3">
                <p className="text-[9px] leading-tight text-gray-500 sm:text-[11px]">Active Now</p>
                <p className="text-[18px] font-semibold text-gray-900 sm:text-[20px]">{summary.active}</p>
              </div>
              <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2 sm:px-3">
                <p className="text-[9px] leading-tight text-gray-500 sm:text-[11px]">Avg Price</p>
                <p className="text-[16px] font-semibold text-gray-900 sm:text-[20px]">₹{summary.avgPrice.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {error ? <p className="mb-3 text-[12px] text-red-600">{error}</p> : null}

            <div className={activeView === "list" ? "space-y-4" : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"}>
              {loading ? (
                <NearbyDealsSkeleton view={activeView} />
              ) : filteredDeals.length === 0 ? (
                <div className="col-span-full rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                  {location ? (
                    <>No deals found for "{location}".</>
                  ) : (
                    <>No offers found for the selected filters.</>
                  )}
                </div>
              ) : (
                filteredDeals.map((deal) => (
                  <article
                      key={deal.offerId}
                      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#157A4F] hover:shadow-lg"
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-gray-100 sm:h-36">
                      <img
                        src={deal.imageUrl || "/images/deal2.avif"}
                        alt={deal.title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#157A4F] to-[#28A745] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        {deal.category || "Special"}
                      </span>
                      <span className="absolute left-2 top-8 rounded-md bg-white/95 px-2 py-0.5 text-[9px] font-semibold text-gray-700 shadow-sm">
                        {formatDistance(deal.distanceKm)}
                      </span>
                      <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm ${getDaysRemainingText(deal.endsAt) === "Expired" ? "bg-red-500 text-white" : "bg-white/95 text-[#157A4F]"}`}>
                        {getDaysRemainingText(deal.endsAt) || "N/A"}
                      </span>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{deal.title}</h3>
                      <p className="mt-1 text-[11px] text-gray-500">{deal.merchant?.name || "Merchant"}</p>
                      <p className="mt-2 text-[11px] text-gray-500 line-clamp-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {deal.merchant?.address || "Location not specified"}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Valid: {formatDate(deal.startsAt)} - {formatDate(deal.endsAt)}
                      </p>
                      <p className="mt-2 text-xl font-extrabold text-gray-900">
                        ₹{toNumber(deal.displayPrice, 0).toLocaleString("en-IN")}
                      </p>
                      <button
                        onClick={() => openDealDetails(deal)}
                        className="mt-auto w-full rounded-lg border border-gray-200 bg-[#F7F7F7] py-2 text-xs font-bold text-gray-800 transition-colors duration-200 hover:border-[#157A4F] hover:bg-[#157A4F] hover:text-white"
                      >
                        View Deal
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <AuthRequiredModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Login or Register"
        description="Please log in or register to open deal details. You can still browse nearby deals without signing in."
        redirectTo={authRedirectTo}
      />
    </main>
  );
}

function NearbyDealsSkeleton({ view = "grid" }) {
  return (
    <>
      {Array.from({ length: view === "list" ? 5 : 8 }).map((_, idx) => (
        <article
          key={idx}
          className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="relative h-36 w-full overflow-hidden bg-gray-100">
            <div className="h-full w-full animate-pulse bg-[#e6ebf1]" />
            <span className="absolute left-2 top-2 h-5 w-20 animate-pulse rounded-full bg-[#d9dee5]" />
            <span className="absolute left-2 top-8 h-4 w-16 animate-pulse rounded-md bg-[#e2e6ec]" />
          </div>
          <div className="p-3 flex flex-col flex-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#e5e7eb]" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#edf0f4]" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-[#edf0f4]" />
            <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-[#edf0f4]" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-[#edf0f4]" />
            <div className="mt-2 h-6 w-1/3 animate-pulse rounded bg-[#e5e7eb]" />
            <div className="mt-auto h-[34px] w-full animate-pulse rounded-lg bg-[#e5e7eb]" />
          </div>
        </article>
      ))}
    </>
  );
}

export default function NearbyDealsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect merchants away from user pages
  useEffect(() => {
    if (!loading && user && user.accountType === "merchant") {
      router.replace("/merchant/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <main className="min-h-screen bg-[#F3F3F3]" />;
  }

  if (user && user.accountType === "merchant") {
    return null;
  }

  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F3F3F3]" />}>
      <NearbyDealsPageContent />
    </Suspense>
  );
}
