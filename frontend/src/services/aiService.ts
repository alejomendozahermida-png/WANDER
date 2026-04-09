/**
 * AI Service - Connects to backend AI endpoints
 * Uses Claude via Emergent LLM Key on the backend
 */

import axios from 'axios';

const getBaseUrl = () => {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (backendUrl) return backendUrl;
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // AI calls can take longer
  headers: { 'Content-Type': 'application/json' },
});

export interface AIDestination {
  city: string;
  country: string;
  iata: string;
  why: string;
  estimated_flight_budget: number;
  vibe_tags: string[];
  best_season: string;
  student_tip: string;
}

export interface AIDestinationsResponse {
  destinations: AIDestination[];
  error?: string;
}

export interface AIActivity {
  time: string;
  title: string;
  description: string;
  type: 'culture' | 'food' | 'leisure' | 'nightlife' | 'nature' | 'shopping';
  cost: string;
  location: string;
  insider_tip: string;
}

export interface AIItineraryDay {
  day: number;
  title: string;
  activities: AIActivity[];
}

export interface AIItineraryResponse {
  city: string;
  total_days: number;
  days: AIItineraryDay[];
  local_tips: string[];
  error?: string;
}

export const fetchAIDestinations = async (params: {
  mood: string;
  budget_max: number;
  origin: string;
  departure_date: string;
  return_date: string;
  languages?: string[];
  travel_experience?: string;
  travel_companion?: string;
  climate_pref?: string;
  top_priority?: string;
}): Promise<AIDestinationsResponse> => {
  try {
    const response = await apiClient.post('/api/ai/destinations', params);
    return response.data;
  } catch (error) {
    console.warn('[AI] Error fetching destinations:', error);
    return { destinations: [], error: 'Error al conectar con IA' };
  }
};

export const fetchAIItinerary = async (params: {
  city: string;
  country?: string;
  trip_days: number;
  mood: string;
  budget_level?: string;
}): Promise<AIItineraryResponse> => {
  try {
    const response = await apiClient.post('/api/ai/itinerary', params);
    return response.data;
  } catch (error) {
    console.warn('[AI] Error fetching itinerary:', error);
    return { city: params.city, total_days: params.trip_days, days: [], local_tips: [], error: 'Error al generar itinerario' };
  }
};
