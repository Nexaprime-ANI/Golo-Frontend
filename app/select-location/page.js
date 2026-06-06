"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { reverseGeocode, searchLocations } from "../services/leafletService";

const CURRENT_LOCATION_STORAGE_KEY = "golo_current_location";

const popularLocations = [
  { name: "Kolhapur", displayName: "Kolhapur, Maharashtra, India", coordinates: { lat: 16.705, lng: 73.7308 } },
  { name: "Pune", displayName: "Pune, Maharashtra, India", coordinates: { lat: 18.5204, lng: 73.8567 } },
  { name: "Mumbai", displayName: "Mumbai, Maharashtra, India", coordinates: { lat: 19.076, lng: 72.8777 } },
  { name: "Sangli", displayName: "Sangli, Maharashtra, India", coordinates: { lat: 16.8524, lng: 74.5815 } },
  { name: "Ichalkaranji", displayName: "Ichalkaranji, Maharashtra, India", coordinates: { lat: 16.6987, lng: 74.4685 } },
];

function getReadableLocation(locationDetails) {
  const rawAddress = String(
    locationDetails?.address ||
    locationDetails?.displayName ||
    locationDetails?.name ||
    "",
  );

  const parts = rawAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\d{4,}$/.test(part));

  if (parts.length >= 2) return parts.slice(0, 3).join(", ");
  return parts[0] || "Current Location";
}

function normalizeRedirect(rawRedirect) {
  if (!rawRedirect || rawRedirect.startsWith("http") || rawRedirect.startsWith("//")) {
    return "/nearby-deals";
  }

  return rawRedirect === "/" ? "/nearby-deals" : rawRedirect;
}

function SelectLocationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => normalizeRedirect(searchParams.get("redirect")),
    [searchParams],
  );

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(popularLocations);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(min-width: 768px)").matches) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    let active = true;

    if (!trimmedQuery) {
      setSuggestions(popularLocations);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(trimmedQuery, { limit: 8, country: "in" });
        if (!active) return;
        setSuggestions(Array.isArray(results) && results.length > 0 ? results : []);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const openWithLocation = (label, coordinates, useCoordinatesOnly = false) => {
    if (typeof window === "undefined") return;

    const target = new URL(redirectTo, window.location.origin);
    const lat = Number(coordinates?.lat);
    const lng = Number(coordinates?.lng);

    if (useCoordinatesOnly) {
      target.searchParams.delete("location");
    } else if (label) {
      target.searchParams.set("location", label);
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      target.searchParams.set("lat", String(lat));
      target.searchParams.set("lng", String(lng));
    } else {
      target.searchParams.delete("lat");
      target.searchParams.delete("lng");
    }

    router.push(`${target.pathname}${target.search}${target.hash}`);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Location access is not available on this device.");
      return;
    }

    setMessage("");
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        let label = "Current Location";
        const details = await reverseGeocode(coordinates.lng, coordinates.lat);
        if (details) label = getReadableLocation(details);

        localStorage.setItem(
          CURRENT_LOCATION_STORAGE_KEY,
          JSON.stringify({
            label,
            coordinates,
            updatedAt: Date.now(),
          }),
        );

        setDetecting(false);
        openWithLocation(label, coordinates, true);
      },
      () => {
        setDetecting(false);
        setMessage("Please allow location access or search your area manually.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  };

  const handleSuggestionClick = (place) => {
    const label = place.displayName || place.address || place.name || "";
    openWithLocation(label, place.coordinates || null, false);
  };

  return (
    <main className="min-h-screen bg-[#fff8e6] px-4 pb-8 pt-4 md:hidden">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1f2933] shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#157A4F]">Set location</p>
            <h1 className="text-xl font-extrabold text-[#1f2933]">Choose your area</h1>
          </div>
        </div>

        <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <div className="flex h-[52px] items-center rounded-2xl border border-[#f0dfb1] bg-[#fffdf7] px-3">
            <Search size={19} className="mr-2.5 shrink-0 text-[#7b7f86]" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setMessage("");
              }}
              placeholder="Search city, area or street"
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#1f2933] outline-none placeholder:text-[#85878b]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="ml-2 text-gray-400"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={detecting}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#dff3e9] bg-[#f6fffb] px-4 py-3 text-left transition active:scale-[0.99] disabled:opacity-70"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#157A4F] text-white">
              {detecting ? <Loader2 size={19} className="animate-spin" /> : <Crosshair size={19} />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-[#157A4F]">
                {detecting ? "Detecting your location..." : "Use my current location"}
              </span>
              <span className="block text-xs font-medium text-[#667085]">
                Turn on GPS for accurate nearby deals
              </span>
            </span>
          </button>

          {message && (
            <p className="mt-3 rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm font-semibold text-[#c2410c]">
              {message}
            </p>
          )}
        </section>

        <section className="mt-5 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
          <div className="border-b border-gray-100 px-4 py-4">
            <h2 className="text-sm font-extrabold text-[#1f2933]">
              {query.trim() ? "Search suggestions" : "Popular nearby cities"}
            </h2>
            <p className="mt-1 text-xs font-medium text-[#667085]">Select one to refresh deals around that place.</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 px-4 py-5 text-sm font-semibold text-[#667085]">
              <Loader2 size={18} className="animate-spin text-[#157A4F]" />
              Searching locations...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {suggestions.map((place, index) => (
                <button
                  type="button"
                  key={`${place.displayName || place.name || index}-${index}`}
                  onClick={() => handleSuggestionClick(place)}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-[#fffaf0] active:bg-[#fff4d7]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1d6] text-[#ff7a1a]">
                    <MapPin size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-[#1f2933]">
                      {place.name || place.displayName?.split(",")[0] || "Location"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-[#667085]">
                      {place.displayName || place.address || "India"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-extrabold text-[#1f2933]">No locations found</p>
              <p className="mt-1 text-xs font-medium text-[#667085]">Try a nearby landmark, area, or city name.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function SelectLocationPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#fff8e6] md:hidden" />}>
      <SelectLocationContent />
    </Suspense>
  );
}
