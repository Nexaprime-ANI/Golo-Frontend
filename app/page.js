"use client";

import Image from "next/image";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import CategoryBar from "./components/CategoryBar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import { getHomeSectionConfig, getNearbyOffers } from "./lib/api";

const SHOP_FALLBACKS = [
  {
    id: "shop-1",
    merchantId: "shop-1",
    title: "Moon Cafe",
    subtitle: "Get the latest smart watch with advanced health tracking.",
    image: "/images/place1.jpg",
    buttonLabel: "View Store",
    type: "shop",
  },
  {
    id: "shop-2",
    merchantId: "shop-2",
    title: "Luxury Spa Package",
    subtitle: "Relax and rejuvenate with our exclusive spa treatments.",
    image: "/images/deal2.jpg",
    buttonLabel: "View Store",
    type: "shop",
  },
  {
    id: "shop-3",
    merchantId: "shop-3",
    title: "Fashion Apparel Sale",
    subtitle: "Discover the latest trends in fashion wear.",
    image: "/images/deal3.jpg",
    buttonLabel: "View Store",
    type: "shop",
  },
  {
    id: "shop-4",
    merchantId: "shop-4",
    title: "Weekend Getaway",
    subtitle: "Book your perfect weekend getaway at unbeatable prices.",
    image: "/images/place4.jpg",
    buttonLabel: "View Store",
    type: "shop",
  },
];

const DEAL_FALLBACKS = [
  {
    id: "deal-1",
    offerId: "deal-1",
    title: "Smart Watch Pro",
    subtitle: "Get the latest smart watch with advanced health tracking.",
    image: "/images/del1.webp",
    badge: "50% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-2",
    offerId: "deal-2",
    title: "Luxury Spa Package",
    subtitle: "Relax and rejuvenate with our exclusive spa treatments.",
    image: "/images/deal2.jpg",
    badge: "30% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-3",
    offerId: "deal-3",
    title: "Fashion Apparel Sale",
    subtitle: "Discover the latest trends in fashion wear.",
    image: "/images/deal3.jpg",
    badge: "25% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-4",
    offerId: "deal-4",
    title: "Weekend Getaway",
    subtitle: "Book your perfect weekend getaway at unbeatable prices.",
    image: "/images/deal4.jpg",
    badge: "40% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-5",
    offerId: "deal-5",
    title: "Smart TV",
    subtitle: "Get the latest smart watch with advanced health tracking.",
    image: "/images/tv.jpg",
    badge: "50% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-6",
    offerId: "deal-6",
    title: "Bazaar Special",
    subtitle: "Discover the latest trends in fashion wear.",
    image: "/images/banner1.jpg",
    badge: "25% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-7",
    offerId: "deal-7",
    title: "Movie Fair",
    subtitle: "Get the latest smart watch with advanced health tracking.",
    image: "/images/hero.jpg",
    badge: "50% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-8",
    offerId: "deal-8",
    title: "Foodie Sale",
    subtitle: "Relax and rejuvenate with our exclusive spa treatments.",
    image: "/images/place2.avif",
    badge: "30% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-9",
    offerId: "deal-9",
    title: "Sweet Day Sale",
    subtitle: "Discover the latest trends in fashion wear.",
    image: "/images/deal1.jpg",
    badge: "25% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
  {
    id: "deal-10",
    offerId: "deal-10",
    title: "Weekend Special",
    subtitle: "Book your perfect weekend getaway at unbeatable prices.",
    image: "/images/place4.jpg",
    badge: "40% OFF",
    buttonLabel: "View Deal",
    type: "deal",
  },
];

function normalizeOffers(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.offers)) return response.data.offers;
  if (Array.isArray(response?.offers)) return response.offers;
  return [];
}

function buildShopCards(offers = []) {
  const seen = new Set();
  const shops = [];

  offers.forEach((offer, index) => {
    const merchantId = String(
      offer?.merchant?.merchantId ||
        offer?.merchantId ||
        offer?.merchant?._id ||
        offer?.merchant?.id ||
        ""
    ).trim();

    if (!merchantId || seen.has(merchantId)) return;
    seen.add(merchantId);

    shops.push({
      id: `shop-${merchantId}`,
      merchantId,
      title: offer?.merchant?.name || offer?.title || `Popular Shop ${index + 1}`,
      subtitle:
        offer?.description ||
        offer?.merchant?.address ||
        "Discover offers and products from this store.",
      image:
        offer?.merchant?.profilePhoto ||
        offer?.imageUrl ||
        offer?.images?.[0] ||
        SHOP_FALLBACKS[index % SHOP_FALLBACKS.length].image,
      buttonLabel: "View Store",
      type: "shop",
    });
  });

  return shops;
}

function buildDealCards(offers = []) {
  return offers
    .map((offer, index) => {
      const offerId = String(offer?.offerId || offer?._id || offer?.id || "").trim();
      if (!offerId) return null;

      const discountPercent = Number(offer?.discountPercent || 0);
      const fallback = DEAL_FALLBACKS[index % DEAL_FALLBACKS.length];

      return {
        id: `deal-${offerId}`,
        offerId,
        title: offer?.title || fallback.title,
        subtitle:
          offer?.description ||
          offer?.merchant?.name ||
          fallback.subtitle,
        image:
          offer?.imageUrl ||
          offer?.images?.[0] ||
          fallback.image,
        badge:
          discountPercent > 0
            ? `${discountPercent}% OFF`
            : fallback.badge,
        buttonLabel: "View Deal",
        type: "deal",
      };
    })
    .filter(Boolean);
}

function SectionSkeleton({ title }) {
  return (
    <section className="border-t border-[#bcc4cf] bg-[#f4f4f4] py-10">
      <div className="mx-auto max-w-[1260px] px-4 lg:px-6">
        <div className="mb-5 h-8 w-56 animate-pulse rounded-full bg-[#e2e8f0]" />
        <div className="flex gap-4 overflow-hidden pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <article
              key={`${title}-skeleton-${index}`}
              className="min-w-[280px] max-w-[280px] overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
            >
              <div className="h-[190px] w-full animate-pulse bg-[#dbe3ed]" />
              <div className="flex min-h-[170px] flex-col gap-4 bg-[#ffe1a3] p-4">
                <div className="h-6 w-4/5 animate-pulse rounded-full bg-[#f4d77f]" />
                <div className="h-4 w-full animate-pulse rounded-full bg-[#f4d77f]" />
                <div className="h-4 w-5/6 animate-pulse rounded-full bg-[#f4d77f]" />
                <div className="mt-auto h-10 w-full animate-pulse rounded-[7px] bg-[#ffd16c]" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionCarousel({ title, items, onItemClick }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateState = () => {
      setCanScrollLeft(element.scrollLeft > 0);
      setCanScrollRight(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1
      );
    };

    updateState();
    element.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);

    return () => {
      element.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
    };
  }, [items]);

  const scrollByAmount = (direction) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  return (
    <section className="border-t border-[#bcc4cf] bg-[#f4f4f4] py-10">
      <div className="mx-auto max-w-[1260px] px-4 lg:px-6">
        <h2 className="mb-5 text-[28px] font-semibold tracking-[-0.02em] text-[#343943]">
          {title}
        </h2>

        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              className="absolute -left-5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1f2937] shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              className="absolute -right-5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1f2937] shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight size={22} />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item) => (
              <article
                key={item.id}
                className="min-w-[280px] max-w-[280px] overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
              >
                <div className="relative h-[190px] w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {item.type === "deal" && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#ff8c10] px-2 py-1 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="flex min-h-[170px] flex-col bg-[#ffe1a3] p-4">
                  <h3 className="min-h-[56px] text-[18px] font-semibold leading-7 text-[#30343c]">
                    {item.title}
                  </h3>
                  <p className="mt-2 min-h-[48px] text-[12px] leading-4 text-[#7c8492]">
                    {item.subtitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => onItemClick(item)}
                    className={`mt-auto h-10 w-full rounded-[7px] text-[13px] font-semibold text-white transition ${
                      item.type === "shop"
                        ? "bg-[#2f9d3c] hover:bg-[#278531]"
                        : "bg-[#ff9012] hover:bg-[#e57f0c]"
                    }`}
                  >
                    {item.buttonLabel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [shops, setShops] = useState([]);
  const [dealsUnder2Km, setDealsUnder2Km] = useState([]);
  const [recommendedDeals, setRecommendedDeals] = useState([]);
  const [coupleDeals, setCoupleDeals] = useState([]);
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, getUserAccountType } = useAuth();
  const selectedLocation = searchParams.get("location") || "";
  const selectedQuery = searchParams.get("q") || "";

  useEffect(() => {
    if (!loading && user) {
      const accountType = user?.accountType || getUserAccountType();
      if (accountType === "merchant") {
        router.replace("/merchant/dashboard");
      }
    }
  }, [user, loading, router, getUserAccountType]);

  useEffect(() => {
    let cancelled = false;
    const hasFilteredSearch = Boolean(selectedLocation.trim() || selectedQuery.trim());

    async function loadHomepageRows() {
      setIsLoadingRows(true);
      try {
        const [response, sectionConfigResponse] = await Promise.all([
          getNearbyOffers({
            limit: 24,
            activeNowOnly: true,
            location: selectedLocation || undefined,
            q: selectedQuery || undefined,
          }),
          getHomeSectionConfig().catch(() => null),
        ]);

        const rows = normalizeOffers(response);
        const sectionConfig = sectionConfigResponse?.data || {};
        const configuredIds = sectionConfig?.sections || {};
        const configuredOffers = sectionConfig?.resolved || {};

        if (cancelled) return;

        if (!rows.length) {
          if (hasFilteredSearch) {
            setShops([]);
            setDealsUnder2Km([]);
            setRecommendedDeals([]);
            setCoupleDeals([]);
          }
          return;
        }

        const shopRows = buildShopCards(rows).slice(0, 8);
        const dealRows = buildDealCards(rows);

        const hasConfiguredIds = (key) =>
          Array.isArray(configuredIds?.[key]) && configuredIds[key].length > 0;

        const configuredShopRows = buildShopCards(configuredOffers?.popularShops || []).slice(0, 8);
        const configuredDealsUnder2Km = buildDealCards(configuredOffers?.dealsUnder2Km || []).slice(0, 8);
        const configuredRecommendedDeals = buildDealCards(configuredOffers?.recommendedDeals || []).slice(0, 8);
        const configuredCoupleDeals = buildDealCards(configuredOffers?.coupleDeals || []).slice(0, 8);

        if (shopRows.length > 0) {
          if (hasConfiguredIds("popularShops")) {
            setShops(configuredShopRows);
          } else {
            setShops(shopRows);
          }
        }

        if (dealRows.length > 0) {
          if (hasConfiguredIds("dealsUnder2Km")) {
            setDealsUnder2Km(configuredDealsUnder2Km);
          } else {
            setDealsUnder2Km(dealRows.slice(0, 8));
          }

          if (hasConfiguredIds("recommendedDeals")) {
            setRecommendedDeals(configuredRecommendedDeals);
          } else {
            setRecommendedDeals(
              dealRows.slice(4, 12).length ? dealRows.slice(4, 12) : dealRows.slice(0, 8),
            );
          }

          if (hasConfiguredIds("coupleDeals")) {
            setCoupleDeals(configuredCoupleDeals);
          } else {
            setCoupleDeals(
              dealRows.slice(8, 16).length ? dealRows.slice(8, 16) : dealRows.slice(0, 8),
            );
          }
        }

        if (!shopRows.length && hasConfiguredIds("popularShops")) {
          setShops(configuredShopRows);
        }
        if (!dealRows.length && hasConfiguredIds("dealsUnder2Km")) {
          setDealsUnder2Km(configuredDealsUnder2Km);
        }
        if (!dealRows.length && hasConfiguredIds("recommendedDeals")) {
          setRecommendedDeals(configuredRecommendedDeals);
        }
        if (!dealRows.length && hasConfiguredIds("coupleDeals")) {
          setCoupleDeals(configuredCoupleDeals);
        }
      } catch {
        if (!cancelled) {
          setShops([]);
          setDealsUnder2Km([]);
          setRecommendedDeals([]);
          setCoupleDeals([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRows(false);
        }
      }
    }

    loadHomepageRows();

    return () => {
      cancelled = true;
    };
  }, [selectedLocation, selectedQuery]);

  const handleShopClick = (item) => {
    if (!item?.merchantId || String(item.merchantId).startsWith("shop-")) return;
    router.push(`/nearby-deals/store?merchantId=${encodeURIComponent(item.merchantId)}`);
  };

  const handleDealClick = (item) => {
    if (!item?.offerId || String(item.offerId).startsWith("deal-")) return;
    router.push(`/nearby-deals/deal?offerId=${encodeURIComponent(item.offerId)}`);
  };

  return (
    <>
      <style>{`
        .homepage-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <main className="min-h-screen bg-[#f4f4f4]">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <CategoryBar
          variant="golocal"
          preferredCategories={user?.preferredCategories || []}
        />

        <div className="bg-[#f4c035]">
          <Hero />
        </div>

        <div className="border-b border-[#d6d9df] bg-white py-4">
          <div className="mx-auto flex max-w-[1260px] items-center justify-center gap-4 px-4 lg:px-6">
            <span className="h-3.5 w-3.5 rounded-full bg-[#3aa23d]" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#d7dce4]" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#d7dce4]" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#d7dce4]" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#d7dce4]" />
          </div>
        </div>

        {isLoadingRows ? (
          <>
            <SectionSkeleton title="Popular Shops" />
            <SectionSkeleton title="Deals Under 2 KM" />
            <SectionSkeleton title="Recommended Deals" />
            <SectionSkeleton title="Couple Deals" />
          </>
        ) : (
          <>
            <SectionCarousel
              title="Popular Shops"
              items={shops}
              onItemClick={handleShopClick}
            />

            <SectionCarousel
              title="Deals Under 2 KM"
              items={dealsUnder2Km}
              onItemClick={handleDealClick}
            />

            <SectionCarousel
              title="Recommended Deals"
              items={recommendedDeals}
              onItemClick={handleDealClick}
            />

            <SectionCarousel
              title="Couple Deals"
              items={coupleDeals}
              onItemClick={handleDealClick}
            />
          </>
        )}

        <Footer />
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f4f4]" />}>
      <HomeContent />
    </Suspense>
  );
}
