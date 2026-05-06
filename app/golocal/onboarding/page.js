"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  Utensils,
  Home,
  Sparkles,
  HeartPulse,
  Building,
  Building2,
  ShoppingBag,
  GraduationCap,
  Ticket,
  Briefcase,
  Car,
  Hammer,
  Dumbbell,
  Zap,
  Store,
  ChevronRight,
} from "lucide-react";

const MAX_SELECTION = 6;

const CATEGORY_OPTIONS = [
  { id: "food-restaurants", label: "Food & Restaurants", Icon: Utensils },
  { id: "home-services", label: "Home Services", Icon: Home },
  { id: "beauty-wellness", label: "Beauty & Wellness", Icon: Sparkles },
  { id: "healthcare-medical", label: "Healthcare & Medical", Icon: HeartPulse },
  { id: "hotels-accommodation", label: "Hotels & Accommodation", Icon: Building2 },
  { id: "shopping-retail", label: "Shopping & Retail", Icon: ShoppingBag },
  { id: "education-training", label: "Education & Training", Icon: GraduationCap },
  { id: "real-estate", label: "Real Estate", Icon: Building },
  { id: "events-entertainment", label: "Events & Entertainment", Icon: Ticket },
  { id: "professional-services", label: "Professional Services", Icon: Briefcase },
  { id: "automotive-services", label: "Automotive Services", Icon: Car },
  { id: "home-improvement", label: "Home Improvement", Icon: Hammer },
  { id: "fitness-sports", label: "Fitness & Sports", Icon: Dumbbell },
  { id: "daily-needs", label: "Daily Needs & Utilities", Icon: Zap },
  { id: "local-businesses-vendors", label: "Local Businesses & Vendors", Icon: Store },
];

export default function GolocalOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState([
    "food-restaurants",
    "hotels-accommodation",
    "education-training",
    "events-entertainment",
  ]);

  const selectionCount = selected.length;
  const canContinue = selectionCount === MAX_SELECTION;

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleCategory = (id) => {
    setSelected((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((value) => value !== id);
      }
      if (prev.length >= MAX_SELECTION) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    if (!canContinue || typeof window === "undefined") return;

    const normalizedEmail = String(user?.email || "").trim().toLowerCase();
    if (normalizedEmail) {
      localStorage.setItem(`golo_golocal_onboarding_done_email_${normalizedEmail}`, "1");
      localStorage.setItem(
        `golo_golocal_selected_categories_email_${normalizedEmail}`,
        JSON.stringify(selected),
      );
    }
    localStorage.removeItem("golo_pending_first_login_email");
    localStorage.setItem("golo_golocal_selected_categories", JSON.stringify(selected));

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="min-h-screen w-full overflow-hidden border border-gray-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#157A4F] text-white text-xs font-bold">
              G
            </div>
            <span className="text-xl font-bold tracking-tight text-[#157A4F]">GOLO</span>
          </div>
          <p className="text-xl font-bold text-[#157A4F] sm:text-3xl">
            {selectionCount} <span className="text-gray-400">/ {MAX_SELECTION}</span>
          </p>
        </div>

        <div className="px-4 pb-2 pt-4 sm:px-8 sm:pb-3 sm:pt-6">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">What are you interested in?</h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">Pick your top {MAX_SELECTION} categories to personalize your experience.</p>
        </div>

        <div className="flex min-h-[calc(100vh-170px)] flex-col px-4 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
          <div className="grid flex-1 grid-cols-2 content-start gap-5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-7 xl:gap-9">
            {CATEGORY_OPTIONS.map(({ id, label, Icon }) => {
              const active = selectedSet.has(id);
              const blocked = !active && selectionCount >= MAX_SELECTION;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCategory(id)}
                  disabled={blocked}
                  className={`mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border text-center shadow-sm transition sm:h-40 sm:w-40 ${
                    active
                      ? "border-[#E8AB2B] bg-[#EFB53D] text-[#171717] shadow-[0_10px_24px_rgba(239,181,61,0.28)]"
                      : "border-gray-200 bg-[#F7F7F7] text-gray-700 hover:bg-white hover:shadow-md"
                  } ${blocked ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
                >
                  <Icon size={22} className={active ? "text-[#1F1F1F]" : "text-gray-500"} />
                  <span className="mt-2.5 max-w-[105px] text-[13px] font-semibold leading-tight sm:text-[14px]">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={`inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-base font-semibold shadow-sm transition ${
                canContinue
                  ? "border-[#157A4F] bg-[#157A4F] text-white hover:bg-[#12663f]"
                  : "border-gray-200 bg-[#F0F0F0] text-gray-400"
              }`}
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
