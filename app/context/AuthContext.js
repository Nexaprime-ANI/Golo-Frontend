"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    API_BASE_URL,
    loginUser,
    registerUser,
    logoutUser,
    getProfile,
    updateMerchantStoreLocation,
    setStoredAuthTokens,
    clearStoredAuthTokens,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load cached user, then validate the cookie-based session with the backend
    useEffect(() => {
        const savedUser = localStorage.getItem("user");

        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem("user");
            }
        }

        let mounted = true;

        (async () => {
            try {
                const response = await getProfile();
                if (!mounted) return;
                const profileUser = response?.data;
                if (profileUser) {
                    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
                    const mergedProfileUser = {
                        ...(currentUser || {}),
                        ...profileUser,
                        accountType: profileUser?.accountType || currentUser?.accountType || "user",
                    };
                    localStorage.setItem("user", JSON.stringify(mergedProfileUser));
                    setUser(mergedProfileUser);
                }
            } catch {
                if (!mounted) return;
                setUser((current) => current || null);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        const handleAuthCleared = () => {
            clearStoredAuthTokens();
            localStorage.removeItem("user");
            setUser(null);
        };

        window.addEventListener("golo-auth-cleared", handleAuthCleared);

        return () => {
            mounted = false;
            window.removeEventListener("golo-auth-cleared", handleAuthCleared);
        };
    }, []);

    const login = useCallback(async (email, password, accountType = "user") => {
        const response = await loginUser(email, password, accountType);
        const authData = response?.data?.data || response?.data || {};
        const userData = authData?.user || null;
        const accessToken = authData?.accessToken || '';
        const refreshToken = authData?.refreshToken || '';

        if (!userData || !accessToken) {
            throw new Error("Login response missing authentication data.");
        }

        // Ensure accountType is preserved from response or fallback to login parameter
        const userDataWithType = {
            ...userData,
            accountType: userData?.accountType || accountType || 'user'
        };

        localStorage.setItem("user", JSON.stringify(userDataWithType));
        setStoredAuthTokens({ accessToken, refreshToken });

        if (typeof window !== "undefined" && userDataWithType?.accountType === "merchant") {
            try {
                // Ask server to sync any pending merchant location saved during registration
                const backendApiBase = API_BASE_URL;
                await fetch(`${backendApiBase}/users/pending-location/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
            } catch (syncError) {
                console.warn("Pending merchant location sync failed:", syncError);
            }
        }

        setUser(userDataWithType);
        return response;
    }, []);

    const register = useCallback(async ({
        name,
        email,
        password,
        phone,
        accountType = "user",
        storeName,
        storeEmail,
        gstNumber,
        storeCategory,
        storeSubCategory,
        contactNumber,
        storeLocation,
        storeLocationLatitude,
        storeLocationLongitude,
    }) => {
        const response = await registerUser({
            name,
            email,
            password,
            phone,
            accountType,
            storeName,
            storeEmail,
            gstNumber,
            storeCategory,
            storeSubCategory,
            contactNumber,
            storeLocation,
            storeLocationLatitude,
            storeLocationLongitude,
        });
        return response;
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } catch {
            // Logout from server failed, but still clear local state
        }

        clearStoredAuthTokens();
        localStorage.removeItem("user");
        setUser(null);
    }, []);

    const refreshProfile = useCallback(async () => {
        try {
            const response = await getProfile();
            const userData = response.data;
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch {
            return null;
        }
    }, []);

    const getUserAccountType = useCallback(() => {
        return user?.accountType || 'user';
    }, [user]);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
        getUserAccountType,  // Safe way to get account type
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
