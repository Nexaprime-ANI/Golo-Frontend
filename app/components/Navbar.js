"use client";
import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { Search, MapPin, User, X, LogOut, ChevronDown, Shield, ShieldCheck, FileText, Bell, Trophy, Heart } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import AuthRequiredModal from "./AuthRequiredModal";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../lib/api";
import { normalizeAppPath } from "../lib/path";
import { searchLocations } from "../services/leafletService";

function NavbarContent({
  searchQuery: externalSearchQuery = "",
  setSearchQuery: setExternalSearchQuery = () => { },
}) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  // Sync with external prop if it changes
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    setLocation(searchParams.get("location") || "");
  }, [searchParams]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setExternalSearchQuery(val);
  };

  const handleLocationChange = (val) => {
    setLocation(val);
    setShowSuggestions(true);
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const router = useRouter();
  const pathname = normalizeAppPath(usePathname());
  const { user, isAuthenticated, logout } = useAuth();
  const logoHref = isAuthenticated && user?.accountType === "merchant"
    ? "/"
    : "/";
  const isGolocalSurface =
    pathname === "/" ||
    pathname.startsWith("/nearby-deals") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/my-deals");
  const isChojaSurface = pathname.startsWith("/choja");
  const useGolocalHomeNav = isGolocalSurface;
  const homeNavHref = "/choja";
  const primaryNavLabel = useGolocalHomeNav ? "My Deals" : "Post Your Ad";
  const primaryNavHref = useGolocalHomeNav ? "/my-deals" : "/post-ad";
  const secondaryNavLabel = useGolocalHomeNav ? "Nearby Deals" : "Chats";
  const secondaryNavHref = useGolocalHomeNav ? "/nearby-deals" : "/chats";

  const defaultLocationSuggestions = [
    { name: "Pune", displayName: "Pune, Maharashtra, India", address: "Pune, Maharashtra, India" },
    { name: "Mumbai", displayName: "Mumbai, Maharashtra, India", address: "Mumbai, Maharashtra, India" },
    { name: "Kolhapur", displayName: "Kolhapur, Maharashtra, India", address: "Kolhapur, Maharashtra, India" },
    { name: "Bangalore", displayName: "Bangalore, Karnataka, India", address: "Bangalore, Karnataka, India" },
    { name: "Delhi", displayName: "Delhi, India", address: "Delhi, India" },
    { name: "Hyderabad", displayName: "Hyderabad, Telangana, India", address: "Hyderabad, Telangana, India" },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (dropdownRef.current || mobileDropdownRef.current) &&
        !dropdownRef.current?.contains(event.target) &&
        !mobileDropdownRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showSuggestions || !isAuthenticated) {
      setLocationLoading(false);
      if (!showSuggestions) {
        setLocationSuggestions([]);
      }
      return;
    }

    const trimmedLocation = location.trim();
    let active = true;

    if (!trimmedLocation) {
      setLocationSuggestions(defaultLocationSuggestions.slice(0, 6));
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(trimmedLocation, { limit: 6, country: "in" });
        if (!active) return;
        setLocationSuggestions(
          Array.isArray(results) && results.length > 0
            ? results.slice(0, 6)
            : defaultLocationSuggestions.slice(0, 6),
        );
      } catch {
        if (active) {
          setLocationSuggestions(defaultLocationSuggestions.slice(0, 6));
        }
      } finally {
        if (active) {
          setLocationLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [location, showSuggestions, isAuthenticated]);

  // Fetch notifications for authenticated users
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getNotifications({ limit: 15 });
      if (res?.success) {
        setNotifications(res.data?.notifications || []);
        setUnreadCount(res.data?.unreadCount || 0);
      }
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleNotifBellClick = () => {
    setShowNotifications((prev) => !prev);
    setShowProfileMenu(false);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // fail silently
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  };

  const runSearch = (nextSearch = searchQuery, nextLocation = location, nextCoordinates = null) => {
    const trimmedSearch = nextSearch.trim();
    const trimmedLocation = nextLocation.trim();

    const params = new URLSearchParams();
    if (trimmedSearch) params.set("q", trimmedSearch);
    if (trimmedLocation) params.set("location", trimmedLocation);
    if (nextCoordinates && Number.isFinite(nextCoordinates.lat) && Number.isFinite(nextCoordinates.lng)) {
      params.set("lat", String(nextCoordinates.lat));
      params.set("lng", String(nextCoordinates.lng));
    }

    const isNearbySurface = pathname.startsWith("/nearby-deals");
    const targetBase = isNearbySurface || pathname === "/" ? "/nearby-deals" : "/choja";

    // Nearby deals browsing (including location/city filtering) should work without auth.
    if (!isAuthenticated && targetBase !== "/nearby-deals") {
      setShowAuthPrompt(true);
      return;
    }

    router.push(params.toString() ? `${targetBase}?${params.toString()}` : targetBase);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      runSearch();
      setShowSuggestions(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
    router.push("/login");
  };

  const handleProfileAvatarClick = () => {
    if (isChojaSurface) {
      setShowProfileMenu((prev) => !prev);
      return;
    }

    if (isGolocalSurface) {
      setShowProfileMenu((prev) => !prev);
      return;
    }

    setShowProfileMenu((prev) => !prev);
  };

  const requireAuth = (callback) => (event) => {
    if (!isAuthenticated) {
      if (event?.preventDefault) event.preventDefault();
      if (event?.stopPropagation) event.stopPropagation();
      setShowAuthPrompt(true);
      return;
    }

    if (callback) callback(event);
  };

  return (
    <>
      <header className="sticky top-0 z-[9999] h-auto min-h-16 bg-[#efb02e] border-b border-[#d7a02a] px-4 shadow-sm md:h-16 md:px-8">
        <div className="w-full h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link
          href={logoHref}
          className="flex min-w-0 items-center gap-2 cursor-pointer sm:gap-3 md:min-w-[180px]"
        >
          <div
            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow font-bold"
            style={{ color: "#157A4F" }}
          >
            G
          </div>
          <span className="text-lg font-semibold tracking-wide text-white sm:text-xl">
            GOLO
          </span>
        </Link>

        {/* CENTER */}
        <div className="hidden md:flex items-center gap-5 flex-1 mx-12 max-w-4xl" onClick={(e) => e.stopPropagation()}>

          {/* SEARCH */}
          <div className="flex-[2] flex items-center rounded-full px-5 h-11 shadow-sm nav-input" onClick={(e) => e.stopPropagation()}>
            <Search
              size={18}
              className="mr-2"
              style={{ color: "var(--color-text-muted)" }}
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => {
                if (!isAuthenticated) setShowAuthPrompt(true);
              }}
              placeholder="Search listings..."
              className="flex-1 outline-none text-sm bg-transparent text-black placeholder-gray-500 focus:outline-none"
              readOnly={!isAuthenticated}
            />

            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="ml-2 transition opacity-70"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* LOCATION */}
          <div className="relative flex-[1]" ref={dropdownRef}>
            <div className="flex items-center rounded-full px-5 h-11 shadow-sm nav-input">
              <MapPin
                size={18}
                className="mr-2"
                style={{ color: "var(--color-text-muted)" }}
              />

              <input
                type="text"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => {
                  if (!isAuthenticated) {
                    setShowAuthPrompt(true);
                    return;
                  }
                  setShowSuggestions(true);
                }}
                placeholder="Location"
                className="w-full outline-none text-sm bg-transparent text-black placeholder-gray-500 focus:outline-none"
                readOnly={!isAuthenticated}
              />

              {location && (
                <button
                  onClick={() => {
                    setLocation("");
                    setShowSuggestions(false);
                    runSearch(searchQuery, "");
                  }}
                  className="ml-2 transition opacity-70"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* LOCATION DROPDOWN */}
            {showSuggestions && (
              <div className="absolute top-14 left-0 w-full rounded-xl shadow-lg py-2 z-50 bg-white border border-gray-200">
                {locationLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Searching cities...</div>
                ) : locationSuggestions.length > 0 ? (
                  locationSuggestions.slice(0, 6).map((place, index) => (
                    <div key={`${place.displayName || place.name || index}-${index}`}>
                      <div
                        onClick={() => {
                          const nextLocation = place.displayName || place.address || place.name || place.city || "";
                          const nextCoordinates = place.coordinates || null;
                          setLocation(nextLocation);
                          setShowSuggestions(false);
                          runSearch(searchQuery, nextLocation, nextCoordinates);
                        }}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <MapPin
                          size={16}
                          style={{ color: "var(--color-primary)" }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-black">
                            {place.name || place.city || place.displayName?.split(",")[0] || "Location"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {place.displayName || place.address || place.state || "India"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">No city matches found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex min-w-0 items-center justify-end gap-3 md:min-w-[260px] md:gap-8">

          <nav className="hidden md:flex gap-6 text-sm font-semibold text-white">
            <Link href={homeNavHref} className="hover:opacity-80 transition">
              Home
            </Link>
            <Link href={primaryNavHref} onClick={requireAuth()} className="hover:opacity-80 transition">
              {primaryNavLabel}
            </Link>
            <Link
              href={secondaryNavHref}
              onClick={useGolocalHomeNav ? undefined : requireAuth()}
              className="hover:opacity-80 transition"
            >
              {secondaryNavLabel}
            </Link>
          </nav>

          {/* PROFILE / AUTH */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">

              {/* NOTIFICATION BELL */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={handleNotifBellClick}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-md hover:scale-105 transition"
                  style={{ color: "#157A4F" }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-12 right-0 w-[calc(100vw-2rem)] max-w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-[9999] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#157A4F] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell size={28} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => !notif.read && handleMarkRead(notif._id)}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition cursor-pointer ${
                              notif.read ? "bg-white" : "bg-green-50 hover:bg-green-100"
                            }`}
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#157A4F]/10 flex items-center justify-center mt-0.5">
                              <Bell size={14} className="text-[#157A4F]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#157A4F] mt-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PROFILE AVATAR */}
            <div className="relative" ref={profileRef}>
              <div
                onClick={handleProfileAvatarClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition bg-white"
                  style={{ color: "#157A4F" }}
                >
                  {user?.name ? (
                    <span className="text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <ChevronDown size={14} className="hidden text-gray-500 sm:block" />
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && !isGolocalSurface && (
                <div className="absolute top-12 right-0 w-[calc(100vw-2rem)] max-w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[9999]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    href="/choja/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <User size={16} /> My Profile
                  </Link>
                  <Link
                    href={useGolocalHomeNav ? "/my-deals" : "/my-ads"}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <FileText size={16} /> {useGolocalHomeNav ? "My Deals" : "My Ads"}
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <ShieldCheck size={16} className="text-red-500" /> Wishlist
                  </Link>

                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#157A4F] hover:bg-green-50 transition border-t border-gray-100 mt-1"
                    >
                      <Shield size={16} /> Admin Dashboard
                    </Link>
                  )}
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}

              {isGolocalSurface && showProfileMenu && (
                <div className="absolute top-12 right-0 w-[calc(100vw-2rem)] max-w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[9999]">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <User size={16} /> Profile
                  </Link>
                  <Link
                    href="/profile/rewards"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Trophy size={16} /> Points & Rewards
                  </Link>
                  <Link
                    href="/profile/favorites"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Heart size={16} /> Favourite
                  </Link>
                  <Link
                    href="/profile/notifications"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Bell size={16} /> Notifications
                  </Link>
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`)}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer bg-white"
              style={{ color: "#157A4F" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer bg-white"
                style={{ color: "#157A4F" }}
              >
                <User size={18} />
              </div>
            </button>
          )}
        </div>
        </div>
        <div className="-mx-4 border-t border-[#d7a02a]/40 px-4 pb-2 md:hidden">
          <div className="grid grid-cols-[1fr_0.9fr_auto] gap-2">
            <div className="flex min-w-0 items-center rounded-full bg-white px-3 py-2 shadow-sm">
              <Search size={15} className="mr-2 shrink-0 text-[#157A4F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => {
                  if (!isAuthenticated) setShowAuthPrompt(true);
                }}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-xs text-black outline-none placeholder-gray-500"
                readOnly={!isAuthenticated}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="ml-1 text-gray-500"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative min-w-0" ref={mobileDropdownRef}>
              <div className="flex min-w-0 items-center rounded-full bg-white px-3 py-2 shadow-sm">
                <MapPin size={15} className="mr-2 shrink-0 text-[#157A4F]" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onKeyDown={handleSearch}
                  onFocus={() => {
                    if (!isAuthenticated) {
                      setShowAuthPrompt(true);
                      return;
                    }
                    setShowSuggestions(true);
                  }}
                  placeholder="Location"
                  className="min-w-0 flex-1 bg-transparent text-xs text-black outline-none placeholder-gray-500"
                  readOnly={!isAuthenticated}
                />
                {location && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocation("");
                      setShowSuggestions(false);
                      runSearch(searchQuery, "");
                    }}
                    className="ml-1 text-gray-500"
                    aria-label="Clear location"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {showSuggestions && (
                <div className="absolute top-11 right-0 z-[9999] w-[min(90vw,320px)] rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                  {locationLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching cities...</div>
                  ) : locationSuggestions.length > 0 ? (
                    locationSuggestions.slice(0, 6).map((place, index) => (
                      <button
                        type="button"
                        key={`${place.displayName || place.name || index}-${index}-mobile`}
                        onClick={() => {
                          const nextLocation = place.displayName || place.address || place.name || place.city || "";
                          const nextCoordinates = place.coordinates || null;
                          setLocation(nextLocation);
                          setShowSuggestions(false);
                          runSearch(searchQuery, nextLocation, nextCoordinates);
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-100"
                      >
                        <MapPin size={16} className="mt-0.5 shrink-0 text-[#157A4F]" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-black">
                            {place.name || place.city || place.displayName?.split(",")[0] || "Location"}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            {place.displayName || place.address || place.state || "India"}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No city matches found.</div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                runSearch();
                setShowSuggestions(false);
              }}
              className="rounded-full bg-[#157A4F] px-3 text-xs font-bold text-white shadow-sm"
            >
              Go
            </button>
          </div>
        </div>
        <nav className="-mx-4 flex gap-2 overflow-x-auto border-t border-[#d7a02a]/40 px-4 pb-2 text-[12px] font-semibold text-white md:hidden">
          <Link href={homeNavHref} className="shrink-0 rounded-full bg-white/15 px-3 py-1.5">
            Home
          </Link>
          <Link href={primaryNavHref} onClick={requireAuth()} className="shrink-0 rounded-full bg-white/15 px-3 py-1.5">
            {primaryNavLabel}
          </Link>
          <Link
            href={secondaryNavHref}
            onClick={useGolocalHomeNav ? undefined : requireAuth()}
            className="shrink-0 rounded-full bg-white/15 px-3 py-1.5"
          >
            {secondaryNavLabel}
          </Link>
        </nav>
      </header>

      <AuthRequiredModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Login or Register"
        description="Please log in or create an account to access GOLO listings, chats, posting, and search from the home page."
        redirectTo={pathname || "/"}
      />
    </>
  );
}

export default function Navbar(props) {
  return (
    <Suspense fallback={
      <header className="theme-footer shadow-sm sticky top-0 z-[9999] border-b border-gray-200 h-16">
        <div className="w-full px-4 md:px-8 h-16 bg-gray-50 animate-pulse" />
      </header>
    }>
      <NavbarContent {...props} />
    </Suspense>
  );
}
