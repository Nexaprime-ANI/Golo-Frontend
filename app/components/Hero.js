"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_ORIGIN_URL, getActiveHomepageBanners } from "../lib/api";

const MAX_SLIDES = 10;

function isRemoteUrl(url) {
  const normalized = String(url || "").trim();
  if (!normalized) return false;
  return /^(https?:\/\/|data:|blob:)/i.test(normalized);
}

function extractBannerImageUrl(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  return (
    item.imageUrl ||
    item.imageURL ||
    item.bannerImageUrl ||
    item.bannerImageURL ||
    item.bannerImage ||
    item.image ||
    null
  );
}

function normalizeImageUrl(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!url) return null;
  if (/^(data:|blob:)/i.test(url)) return url;
  if (isRemoteUrl(url) || url.startsWith("/")) return url;

  // If backend stored a relative path, prefer prefixing with configured API URL.
  const apiBase = API_ORIGIN_URL;
  if (apiBase) {
    const base = apiBase.replace(/\/$/, "");
    const path = url.replace(/\\/g, "/").replace(/^\//, "");
    return `${base}/${path}`;
  }

  return url.replace(/\\/g, "/");
}

function extractMerchantId(item) {
  return String(
    item?.merchantId ||
      item?.merchant?.merchantId ||
      item?.merchant?.userId ||
      item?.merchant?._id ||
      item?.merchant?.id ||
      item?.merchantStoreId ||
      item?.userId ||
      ""
  ).trim();
}

export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [debugInfo, setDebugInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const failedUrlsRef = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageBanners() {
      try {
        if (isMounted) {
          setLoading(true);
        }

        const res = await getActiveHomepageBanners(MAX_SLIDES);

        const bannerCandidate =
          res?.data?.data ??
          res?.data?.rows ??
          res?.data ??
          res?.rows ??
          res;

        const rows = Array.isArray(bannerCandidate)
          ? bannerCandidate
          : Array.isArray(bannerCandidate?.rows)
            ? bannerCandidate.rows
            : [];

        if (process.env.NODE_ENV !== "production") {
          // Helps quickly confirm if backend is returning data at all.
          console.log("[Hero] Active banners response:", res);
          console.log("[Hero] Active banners rows:", rows);
        }

        const dynamicSlides = rows
          .filter((item) => {
            const status = String(item?.status || "").toLowerCase();
            return status === "approved" || status === "active" || !status;
          })
          .map((item) => {
            const imageUrl = normalizeImageUrl(extractBannerImageUrl(item));
            if (!imageUrl) return null;

            const merchantId = extractMerchantId(item);
            const href = merchantId
              ? `/nearby-deals/store?merchantId=${encodeURIComponent(merchantId)}`
              : null;

            return {
              url: imageUrl,
              merchantId,
              href,
            };
          })
          .filter(Boolean);

        if (isMounted) {
          if (dynamicSlides.length > 0) {
            const finalSlides = dynamicSlides.slice(0, MAX_SLIDES);
            setSlides(finalSlides);
            setDebugInfo(`Showing ${finalSlides.length} approved banners`);
            setCurrent(0);
          } else {
            setSlides([]);
            setDebugInfo("No approved banners found");
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("[Hero] Error loading approved banners:", error);
          setDebugInfo(`Error: ${error?.message || "Failed to load banners"}`);
          setSlides([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHomepageBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto slide
  useEffect(() => {
    if (!slides.length) return;
    if (current >= slides.length) {
      setCurrent(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides]);

  const handleImageError = (url) => {
    const normalized = String(url || "");
    if (!normalized) return;
    if (failedUrlsRef.current.has(normalized)) return;
    failedUrlsRef.current.add(normalized);

    if (process.env.NODE_ENV !== "production") {
      console.warn("[Hero] Failed to load banner image:", normalized);
    }

    setSlides((prev) => {
      const next = prev.filter((slide) => slide.url !== normalized);
      return next;
    });
  };

  if (loading) {
    return (
      <section className="relative w-full overflow-hidden bg-[#F8F6F2]">
        <div className="relative h-[240px] w-full bg-[#ece9e1] sm:h-[340px] md:h-[520px]" />
      </section>
    );
  }

  if (!slides.length) {
    // Keep homepage clean in production; show a hint during development.
    if (process.env.NODE_ENV !== "production") {
      return (
        <section className="relative w-full overflow-hidden bg-[#F8F6F2]">
          <div className="relative w-full h-[220px] flex items-center justify-center text-[12px] text-gray-600">
            {debugInfo || "No approved banners returned by API"}
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#F8F6F2]">

      {/* Carousel Wrapper */}
      <div className="relative h-[240px] w-full sm:h-[340px] md:h-[520px]">

        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          >
            {slide.href ? (
              <Link
                href={slide.href}
                className="absolute inset-0 block cursor-pointer"
                aria-label={`Open merchant store for banner ${index + 1}`}
              >
                {isRemoteUrl(slide.url) ? (
                  // Avoid Next/image remote host restrictions & optimizer issues for third-party CDNs.
                  <img
                    src={slide.url}
                    alt={`Slide ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(slide.url)}
                  />
                ) : (
                  <Image
                    src={slide.url}
                    alt={`Slide ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                    onError={() => handleImageError(slide.url)}
                  />
                )}
              </Link>
            ) : isRemoteUrl(slide.url) ? (
              <img
                src={slide.url}
                alt={`Slide ${index + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                onError={() => handleImageError(slide.url)}
              />
            ) : (
              <Image
                src={slide.url}
                alt={`Slide ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
                onError={() => handleImageError(slide.url)}
              />
            )}
          </div>
        ))}

        {/* Dark Overlay for premium look */}
        <div className="pointer-events-none absolute inset-0 bg-black/20"></div>

        {/* Dots Indicator */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  current === index ? "bg-[#F5B849] w-6" : "bg-white/70"
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
