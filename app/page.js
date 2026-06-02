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
import { getNearbyOffers } from "./lib/api";

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
    element.scrollBy({ left: direction * element.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="border-t border-[#bcc4cf] bg-[#f4f4f4] py-7 sm:py-10">
      <div className="mx-auto max-w-[1260px] px-4 lg:px-6">
        <h2 className="mb-5 text-[22px] font-semibold text-[#343943] sm:text-[28px]">
          {title}
        </h2>

        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1f2937] shadow-[0_10px_30px_rgba(15,23,42,0.18)] sm:-left-5 sm:h-11 sm:w-11"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1f2937] shadow-[0_10px_30px_rgba(15,23,42,0.18)] sm:-right-5 sm:h-11 sm:w-11"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight size={22} />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item) => (
              <article
                key={item.id}
                className="w-full min-w-full max-w-full flex-none snap-start overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:w-auto sm:min-w-[280px] sm:max-w-[280px]"
              >
                <div className="relative h-[170px] w-full overflow-hidden sm:h-[190px]">
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

                <div className="flex min-h-[145px] flex-col bg-[#ffe1a3] p-4 sm:min-h-[170px]">
                  <h3 className="line-clamp-2 min-h-[48px] text-[17px] font-semibold leading-6 text-[#30343c] sm:min-h-[56px] sm:text-[18px] sm:leading-7">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-[40px] text-[12px] leading-5 text-[#7c8492] sm:min-h-[48px]">
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
  const [shops, setShops] = useState(SHOP_FALLBACKS);
  const [dealsUnder2Km, setDealsUnder2Km] = useState(DEAL_FALLBACKS.slice(0, 4));
  const [recommendedDeals, setRecommendedDeals] = useState(DEAL_FALLBACKS.slice(4, 8));
  const [coupleDeals, setCoupleDeals] = useState(DEAL_FALLBACKS.slice(6, 10));
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
      try {
        const response = await getNearbyOffers({
          limit: 24,
          activeNowOnly: true,
          location: selectedLocation || undefined,
          q: selectedQuery || undefined,
        });
        const rows = normalizeOffers(response);

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

        if (shopRows.length > 0) {
          setShops(shopRows);
        }

        if (dealRows.length > 0) {
          setDealsUnder2Km(dealRows.slice(0, 8));
          setRecommendedDeals(dealRows.slice(4, 12).length ? dealRows.slice(4, 12) : dealRows.slice(0, 8));
          setCoupleDeals(dealRows.slice(8, 16).length ? dealRows.slice(8, 16) : dealRows.slice(0, 8));
        }
      } catch {
        // Keep visual fallbacks when live data is unavailable.
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
