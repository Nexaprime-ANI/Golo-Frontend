/**
 * API Client Configuration
 * Updated to use integrated API Gateway in NestJS Backend on port 3002
 * 
 * Frontend → Backend with integrated Gateway (3002) → All Backend Services
 */

// Backend endpoint with integrated API Gateway
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3002/api'
    : 'http://localhost:3002/api');

// Service-specific endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`
  },

  // Users
  USERS: {
    PROFILE: `${API_BASE_URL}/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
    GET_USER: `${API_BASE_URL}/users`,
    NOTIFICATIONS: `${API_BASE_URL}/users/notifications`,
    PREFERENCES: `${API_BASE_URL}/users/preferences`,
    CHANGE_PASSWORD: `${API_BASE_URL}/users/change-password`
  },

  // Merchants
  MERCHANTS: {
    GET_ALL: `${API_BASE_URL}/merchants`,
    GET_ONE: `${API_BASE_URL}/merchants`,
    CREATE: `${API_BASE_URL}/merchants`,
    UPDATE: `${API_BASE_URL}/merchants`,
    PUBLIC_PROFILE: `${API_BASE_URL}/merchants/public`,
    CATEGORIES: `${API_BASE_URL}/merchants/categories`,
    ANALYTICS: `${API_BASE_URL}/merchants/analytics`
  },

  // Ads
  ADS: {
    CREATE: `${API_BASE_URL}/ads`,
    GET_ALL: `${API_BASE_URL}/ads`,
    GET_ONE: `${API_BASE_URL}/ads`,
    UPDATE: `${API_BASE_URL}/ads`,
    DELETE: `${API_BASE_URL}/ads`,
    SEARCH: `${API_BASE_URL}/ads/search`,
    MY_ADS: `${API_BASE_URL}/ads/my-ads`,
    VIEWS: `${API_BASE_URL}/ads/views`
  },

  // Offers
  OFFERS: {
    CREATE: `${API_BASE_URL}/offers`,
    GET_ALL: `${API_BASE_URL}/offers`,
    GET_ONE: `${API_BASE_URL}/offers`,
    UPDATE: `${API_BASE_URL}/offers`,
    DELETE: `${API_BASE_URL}/offers`,
    LIST: `${API_BASE_URL}/offers/list`,
    LIKE: `${API_BASE_URL}/offers/like`,
    UNLIKE: `${API_BASE_URL}/offers/unlike`
  },

  // Payments
  PAYMENTS: {
    CREATE_ORDER: `${API_BASE_URL}/payments/create-order`,
    VERIFY: `${API_BASE_URL}/payments/verify`,
    REFUND: `${API_BASE_URL}/payments/refund`,
    HISTORY: `${API_BASE_URL}/payments/history`
  },

  // Orders
  ORDERS: {
    CREATE: `${API_BASE_URL}/orders`,
    GET_ALL: `${API_BASE_URL}/orders`,
    GET_ONE: `${API_BASE_URL}/orders`,
    UPDATE_STATUS: `${API_BASE_URL}/orders/status`,
    CANCEL: `${API_BASE_URL}/orders/cancel`,
    MY_ORDERS: `${API_BASE_URL}/orders/my-orders`
  },

  // Chats
  CHATS: {
    GET_CONVERSATIONS: `${API_BASE_URL}/chats/conversations`,
    GET_MESSAGES: `${API_BASE_URL}/chats/messages`,
    SEND_MESSAGE: `${API_BASE_URL}/chats/send`,
    DELETE_CONVERSATION: `${API_BASE_URL}/chats/conversations/delete`
  },

  // Products
  PRODUCTS: {
    GET_ALL: `${API_BASE_URL}/products`,
    GET_ONE: `${API_BASE_URL}/products`,
    SEARCH: `${API_BASE_URL}/products/search`,
    BY_CATEGORY: `${API_BASE_URL}/products/category`
  },

  // Vouchers
  VOUCHERS: {
    GET_ALL: `${API_BASE_URL}/vouchers`,
    VALIDATE: `${API_BASE_URL}/vouchers/validate`,
    REDEEM: `${API_BASE_URL}/vouchers/redeem`
  },

  // Reviews
  REVIEWS: {
    CREATE: `${API_BASE_URL}/reviews`,
    GET_ALL: `${API_BASE_URL}/reviews`,
    GET_FOR_PRODUCT: `${API_BASE_URL}/reviews/product`,
    UPDATE: `${API_BASE_URL}/reviews`,
    DELETE: `${API_BASE_URL}/reviews`
  },

  // Banners
  BANNERS: {
    GET_ALL: `${API_BASE_URL}/banners`,
    GET_ACTIVE: `${API_BASE_URL}/banners/active`
  },

  // Merchant Dashboard
  MERCHANT_DASHBOARD: {
    STATS: `${API_BASE_URL}/merchant-dashboard/stats`,
    SALES: `${API_BASE_URL}/merchant-dashboard/sales`,
    CUSTOMERS: `${API_BASE_URL}/merchant-dashboard/customers`,
    ANALYTICS: `${API_BASE_URL}/merchant-dashboard/analytics`
  },

  // Merchant Products
  MERCHANT_PRODUCTS: {
    GET_ALL: `${API_BASE_URL}/merchant-products`,
    CREATE: `${API_BASE_URL}/merchant-products`,
    UPDATE: `${API_BASE_URL}/merchant-products`,
    DELETE: `${API_BASE_URL}/merchant-products`
  },

  // Analytics
  ANALYTICS: {
    TRACK_EVENT: `${API_BASE_URL}/analytics/track`,
    GET_STATS: `${API_BASE_URL}/analytics/stats`,
    GET_DEVICE_BREAKDOWN: `${API_BASE_URL}/analytics/device-breakdown`,
    GET_REGIONAL_STATS: `${API_BASE_URL}/analytics/regional-stats`
  },

  // Reports
  REPORTS: {
    SUBMIT: `${API_BASE_URL}/reports/submit`,
    GET_MY_REPORTS: `${API_BASE_URL}/reports/my-reports`,
    GET_STATUS: `${API_BASE_URL}/reports/status`
  }
};

/**
 * Create authenticated fetch request
 * Adds JWT token from localStorage
 */
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Clear stored token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
      return null;
    }

    // Handle rate limiting
    if (response.status === 429) {
      console.error('Rate limit exceeded. Please try again later.');
      throw new Error('Too many requests. Please try again later.');
    }

    // Handle server errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Example API calls
 */
export const apiCall = {
  // Auth
  login: (email, password) =>
    fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }),

  // Users
  getUserProfile: () =>
    fetchWithAuth(API_ENDPOINTS.USERS.PROFILE),

  updateProfile: (data) =>
    fetchWithAuth(API_ENDPOINTS.USERS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Ads
  createAd: (data) =>
    fetchWithAuth(API_ENDPOINTS.ADS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getAds: () =>
    fetch(API_ENDPOINTS.ADS.GET_ALL),

  searchAds: (query, filters) =>
    fetch(`${API_ENDPOINTS.ADS.SEARCH}?q=${query}&${new URLSearchParams(filters)}`),

  // Merchants
  getMerchants: () =>
    fetch(API_ENDPOINTS.MERCHANTS.GET_ALL),

  // Offers
  getOffers: () =>
    fetch(API_ENDPOINTS.OFFERS.LIST),

  likeOffer: (offerId) =>
    fetchWithAuth(`${API_ENDPOINTS.OFFERS.LIKE}/${offerId}`, {
      method: 'POST'
    }),

  // Payments
  createPaymentOrder: (data) =>
    fetchWithAuth(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  verifyPayment: (data) =>
    fetchWithAuth(API_ENDPOINTS.PAYMENTS.VERIFY, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  fetchWithAuth,
  apiCall
};
