/**
 * Deals & Notifications API Service
 * Connects to the Wander backend for RSS deal aggregation and in-app notifications
 */

import axios from 'axios';

// Use the backend URL from env
const getBaseUrl = () => {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (backendUrl) return backendUrl;
  // Fallback for development
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== DEALS ====================

export interface Deal {
  id: string;
  source: string;
  title: string;
  origin: string | null;
  destination: string | null;
  price: number | null;
  currency: string;
  url: string;
  image_url: string | null;
  published_at: string | null;
  fetched_at: string;
  is_error_fare: boolean;
  tags: string[];
}

export const fetchDeals = async (limit: number = 50, errorFaresOnly: boolean = false): Promise<Deal[]> => {
  try {
    const response = await apiClient.get('/api/deals', {
      params: { limit, error_fares_only: errorFaresOnly },
    });
    return response.data.deals || [];
  } catch (error) {
    console.warn('[Deals] Error fetching deals:', error);
    return [];
  }
};

export const fetchErrorFares = async (): Promise<Deal[]> => {
  try {
    const response = await apiClient.get('/api/deals/error-fares');
    return response.data.deals || [];
  } catch (error) {
    console.warn('[Deals] Error fetching error fares:', error);
    return [];
  }
};

export const refreshDeals = async (): Promise<{ deals_count: number; notifications_created: number }> => {
  try {
    const response = await apiClient.post('/api/deals/refresh');
    return response.data;
  } catch (error) {
    console.warn('[Deals] Error refreshing deals:', error);
    return { deals_count: 0, notifications_created: 0 };
  }
};

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  deal_id: string | null;
  read: boolean;
  created_at: string;
}

export const fetchNotifications = async (
  userId: string,
  unreadOnly: boolean = false
): Promise<{ notifications: Notification[]; unread_count: number }> => {
  try {
    const response = await apiClient.get(`/api/notifications/${userId}`, {
      params: { unread_only: unreadOnly },
    });
    return response.data;
  } catch (error) {
    console.warn('[Notifications] Error fetching:', error);
    return { notifications: [], unread_count: 0 };
  }
};

export const markNotificationRead = async (notificationId: string): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/api/notifications/${notificationId}/read`);
    return response.data.success;
  } catch (error) {
    console.warn('[Notifications] Error marking read:', error);
    return false;
  }
};

export const markAllNotificationsRead = async (userId: string): Promise<number> => {
  try {
    const response = await apiClient.post(`/api/notifications/${userId}/read-all`);
    return response.data.marked_read;
  } catch (error) {
    console.warn('[Notifications] Error marking all read:', error);
    return 0;
  }
};

// ==================== ACCOMMODATIONS ====================

export interface Accommodation {
  category: 'budget' | 'midrange' | 'premium';
  name: string;
  stars: number;
  review_score: number;
  review_word: string;
  total_price: number;
  price_per_night: number;
  currency: string;
  photo_url: string;
  address: string;
  distance_to_center: string;
  booking_url: string;
  accommodation_type: string;
}

export interface AccommodationResult {
  city: string;
  checkin: string;
  checkout: string;
  nights: number;
  total_results: number;
  accommodations: {
    budget: Accommodation | null;
    midrange: Accommodation | null;
    premium: Accommodation | null;
  };
}

export const searchAccommodations = async (
  city: string,
  checkin: string,
  checkout: string,
  adults: number = 2,
  currency: string = 'EUR'
): Promise<AccommodationResult | null> => {
  try {
    const response = await apiClient.get('/api/accommodations/search', {
      params: { city, checkin, checkout, adults, currency },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    console.warn('[Accommodations] Error searching:', error);
    return null;
  }
};

// ==================== CURRENCY ====================

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export const getExchangeRates = async (
  base: string = 'EUR',
  targets: string = 'USD,GBP,MXN,BRL,COP'
): Promise<ExchangeRates | null> => {
  try {
    const response = await apiClient.get('/api/currency/rates', {
      params: { base, targets },
    });
    return response.data;
  } catch (error) {
    console.warn('[Currency] Error getting rates:', error);
    return null;
  }
};

export const convertCurrency = async (
  amount: number,
  from: string = 'EUR',
  to: string = 'USD'
): Promise<{ result: number; rate: number } | null> => {
  try {
    const response = await apiClient.get('/api/currency/convert', {
      params: { amount, from_currency: from, to_currency: to },
    });
    return response.data;
  } catch (error) {
    console.warn('[Currency] Error converting:', error);
    return null;
  }
};

export interface AlertPreference {
  user_id: string;
  max_price?: number;
  preferred_destinations: string[];
  preferred_regions: string[];
  origin_iata?: string;
  mood?: string;
  active: boolean;
}

export const saveAlertPreference = async (pref: AlertPreference): Promise<boolean> => {
  try {
    await apiClient.post('/api/alerts/preferences', pref);
    return true;
  } catch (error) {
    console.warn('[Alerts] Error saving preference:', error);
    return false;
  }
};

export const getAlertPreference = async (userId: string): Promise<AlertPreference | null> => {
  try {
    const response = await apiClient.get(`/api/alerts/preferences/${userId}`);
    return response.data;
  } catch (error) {
    console.warn('[Alerts] Error getting preference:', error);
    return null;
  }
};
