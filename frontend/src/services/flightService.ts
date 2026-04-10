import axios from 'axios';
import { Destination } from '../types';

import Constants from 'expo-constants';

const DUFFEL_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_DUFFEL_API_KEY 
  || process.env.EXPO_PUBLIC_DUFFEL_API_KEY 
  || '';
const DUFFEL_BASE_URL = 'https://api.duffel.com';
const IS_TEST_KEY = DUFFEL_API_KEY.startsWith('duffel_test_');

const duffelClient = axios.create({
  baseURL: DUFFEL_BASE_URL,
  headers: {
    'Authorization': `Bearer ${DUFFEL_API_KEY}`,
    'Content-Type': 'application/json',
    'Duffel-Version': 'v2',
    'Accept': 'application/json',
  },
});

/** Country code → Full name mapping */
const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal', ES: 'Spain', FR: 'France', IT: 'Italy',
  GR: 'Greece', CZ: 'Czech Republic', HU: 'Hungary', PL: 'Poland',
  AT: 'Austria', DE: 'Germany', NL: 'Netherlands', BE: 'Belgium',
  GB: 'United Kingdom', IE: 'Ireland', HR: 'Croatia', RO: 'Romania',
  BG: 'Bulgaria', CH: 'Switzerland', SE: 'Sweden', NO: 'Norway',
  DK: 'Denmark', FI: 'Finland', TR: 'Turkey', MA: 'Morocco',
};

/** Stable city images from Unsplash */
const CITY_IMAGES: Record<string, string> = {
  LIS: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
  BCN: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
  MAD: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80',
  ATH: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80',
  PRG: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80',
  BUD: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&q=80',
  FCO: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  KRK: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
  OPO: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
  VIE: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80',
  BER: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80',
  AMS: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
};

/** Average cost-of-living ratings */
const COST_OF_LIVING: Record<string, string> = {
  LIS: 'Bajo', BCN: 'Medio', MAD: 'Medio', ATH: 'Bajo',
  PRG: 'Bajo', BUD: 'Muy bajo', FCO: 'Medio', KRK: 'Muy bajo',
  OPO: 'Bajo', VIE: 'Alto', BER: 'Medio', AMS: 'Alto',
};

/** Average temperatures by destination (summer) */
const AVG_TEMPS: Record<string, number> = {
  LIS: 28, BCN: 30, MAD: 33, ATH: 32,
  PRG: 24, BUD: 26, FCO: 31, KRK: 23,
  OPO: 27, VIE: 25, BER: 24, AMS: 21,
};

/**
 * Adjust dates for Duffel test API key.
 * Test keys require dates far in the future (~330+ days).
 * We shift dates forward while keeping the same trip duration.
 */
const adjustDatesForTestApi = (departure: string, returnD: string): { departure: string; return: string } => {
  if (!IS_TEST_KEY) return { departure, return: returnD };

  const dep = new Date(departure);
  const ret = new Date(returnD);
  const tripDays = Math.round((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24));

  // Minimum date: today + 340 days to be safe
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 340);

  if (dep < minDate) {
    const newDep = new Date(minDate);
    const newRet = new Date(minDate);
    newRet.setDate(newRet.getDate() + Math.max(tripDays, 1));

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    return { departure: formatDate(newDep), return: formatDate(newRet) };
  }

  return { departure, return: returnD };
};

/**
 * Format ISO 8601 duration (PT2H30M, PT8H, PT45M) to human readable
 */
const formatDuration = (isoDuration: string | undefined): string => {
  if (!isoDuration) return 'N/A';

  const hoursMatch = isoDuration.match(/(\d+)H/);
  const minutesMatch = isoDuration.match(/(\d+)M/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'N/A';
};

/**
 * Search multiple destinations via Duffel and return top 3.
 * Searches each destination in parallel (batched in groups of 4).
 */
export const searchMultipleDestinations = async (
  origin: string,
  destinations: string[],
  departureDate: string,
  returnDate: string,
  budgetMax: number = 500,
  passportCountry?: string
): Promise<Destination[]> => {
  console.log(`[Flights] Searching via backend: ${origin} → ${destinations.length} destinations`);

  try {
    // Call backend which handles Duffel API (avoids CORS, keeps key secure)
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    const response = await fetch(`${backendUrl}/api/flights/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destinations,
        departure_date: departureDate,
        return_date: returnDate,
        budget_max: budgetMax,
      }),
    });

    const data = await response.json();
    const flightResults = data.results || [];
    console.log(`[Flights] Backend returned ${flightResults.length} results`);

    if (flightResults.length === 0) {
      console.warn('[Flights] No results from backend');
      return [];
    }

    // Map backend results to Destination type
    const results: Destination[] = flightResults.map((r: any) => ({
      id: r.iata,
      city: r.city,
      country: r.country,
      iata: r.iata,
      flightPrice: r.flightPrice,
      hotelPrice: 0, // Will be replaced with real Booking.com price
      totalPrice: r.flightPrice, // Temporary — updated after Booking.com
      departureDate,
      returnDate,
      imageUrl: CITY_IMAGES[r.iata] || `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80`,
      temperature: AVG_TEMPS[r.iata] || 25,
      flightDuration: r.flightDuration || 'N/A',
      costOfLiving: COST_OF_LIVING[r.iata] || 'Medio',
      visaFree: r.visaFree !== undefined ? r.visaFree : true,
      flightDetails: r.flightDetails,
    }));

    // Sort by price
    const sorted = results.sort((a, b) => a.totalPrice - b.totalPrice);
    const top = sorted.slice(0, 6);

    // Assign badges
    if (top.length > 0) top[0].badge = 'cheapest';
    if (top.length > 1) top[1].badge = 'best-value';
    if (top.length > 2) top[2].badge = 'hidden-gem';

    console.log(`[Flights] Returning ${top.length} destinations with real prices`);
    return top;
  } catch (error: any) {
    console.error(`[Flights] Error calling backend: ${error.message}`);
    return [];
  }
};

/**
 * Popular European destinations for students
 */
export const POPULAR_EU_DESTINATIONS = [
  'LIS', // Lisbon
  'BCN', // Barcelona
  'MAD', // Madrid
  'ATH', // Athens
  'PRG', // Prague
  'BUD', // Budapest
  'FCO', // Rome
  'KRK', // Krakow
  'OPO', // Porto
  'VIE', // Vienna
  'BER', // Berlin
  'AMS', // Amsterdam
];
