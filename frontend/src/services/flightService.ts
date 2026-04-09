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
  const results: Destination[] = [];

  // Adjust dates for test API if needed
  const adjusted = adjustDatesForTestApi(departureDate, returnDate);
  console.log(`[Duffel] Searching from ${origin}, dates: ${adjusted.departure} → ${adjusted.return} (original: ${departureDate} → ${returnDate})`);

  // Batch destinations in groups of 5 for faster results
  const batchSize = 5;
  for (let i = 0; i < destinations.length; i += batchSize) {
    const batch = destinations.slice(i, i + batchSize);

    const searchPromises = batch.map(async (destIata) => {
      // Skip if origin equals destination
      if (destIata === origin) return;

      try {
        const payload = {
          data: {
            slices: [
              {
                origin: origin,
                destination: destIata,
                departure_date: adjusted.departure,
              },
              {
                origin: destIata,
                destination: origin,
                departure_date: adjusted.return,
              },
            ],
            passengers: [{ type: 'adult' }],
            cabin_class: 'economy',
          },
        };

        const response = await duffelClient.post(
          '/air/offer_requests?return_offers=true',
          payload,
          { timeout: 45000 }
        );

        const offers = response.data.data.offers || [];
        console.log(`[Duffel] ${origin}→${destIata}: ${offers.length} offers`);

        if (offers.length > 0) {
          // Get cheapest offer
          const cheapestOffer = offers.reduce((min: any, offer: any) =>
            parseFloat(offer.total_amount) < parseFloat(min.total_amount) ? offer : min
          );

          const flightPrice = parseFloat(cheapestOffer.total_amount);

          // Get city/country from Duffel response
          const destData = cheapestOffer.slices[0]?.destination;
          const cityName = destData?.city_name || destIata;
          const countryCode = destData?.iata_country_code || '';
          const countryName = COUNTRY_NAMES[countryCode] || countryCode;

          // Check visa (use visa_rules if available)
          let visaFree = true;
          if (passportCountry) {
            try {
              const visaRules = require('../assets/visa_rules.json');
              const freeCountries = visaRules[passportCountry] || [];
              visaFree = freeCountries.includes(countryCode);
            } catch { visaFree = true; }
          }

          // Extract rich flight details from Duffel offer
          const extractSegments = (slice: any) => {
            return (slice.segments || []).map((seg: any) => ({
              airline: seg.marketing_carrier?.name || seg.operating_carrier?.name || cheapestOffer.owner?.name || 'Unknown',
              airlineLogo: seg.marketing_carrier?.logo_symbol_url || seg.operating_carrier?.logo_symbol_url || '',
              flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
              departureAirport: seg.origin?.iata_code || '',
              departureName: seg.origin?.city_name || seg.origin?.name || '',
              departureTime: seg.departing_at || '',
              arrivalAirport: seg.destination?.iata_code || '',
              arrivalName: seg.destination?.city_name || seg.destination?.name || '',
              arrivalTime: seg.arriving_at || '',
              duration: formatDuration(seg.duration),
              aircraft: seg.aircraft?.name || '',
            }));
          };

          const outboundSlice = cheapestOffer.slices[0];
          const inboundSlice = cheapestOffer.slices[1];

          const flightDetails = {
            offerId: cheapestOffer.id,
            airline: cheapestOffer.owner?.name || 'Unknown',
            totalPrice: Math.round(flightPrice),
            currency: cheapestOffer.total_currency || 'EUR',
            outbound: {
              departure: outboundSlice?.segments?.[0]?.departing_at || '',
              arrival: outboundSlice?.segments?.slice(-1)[0]?.arriving_at || '',
              duration: formatDuration(outboundSlice?.duration),
              stops: Math.max(0, (outboundSlice?.segments?.length || 1) - 1),
              segments: extractSegments(outboundSlice),
            },
            inbound: inboundSlice ? {
              departure: inboundSlice?.segments?.[0]?.departing_at || '',
              arrival: inboundSlice?.segments?.slice(-1)[0]?.arriving_at || '',
              duration: formatDuration(inboundSlice?.duration),
              stops: Math.max(0, (inboundSlice?.segments?.length || 1) - 1),
              segments: extractSegments(inboundSlice),
            } : { departure: '', arrival: '', duration: 'N/A', stops: 0, segments: [] },
          };

          // Hotel price will be set to 0 — real price loaded from Booking.com later
          const destination: Destination = {
            id: destIata,
            city: cityName,
            country: countryName,
            iata: destIata,
            flightPrice: Math.round(flightPrice),
            hotelPrice: 0, // Will be replaced with real Booking.com price
            totalPrice: Math.round(flightPrice), // Temporary — updated after Booking.com
            departureDate,
            returnDate,
            imageUrl: CITY_IMAGES[destIata] || `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80`,
            temperature: AVG_TEMPS[destIata] || 25,
            flightDuration: formatDuration(outboundSlice?.duration),
            costOfLiving: COST_OF_LIVING[destIata] || 'Medio',
            visaFree,
            flightDetails,
          };

          results.push(destination);
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.errors?.[0]?.message || error.message;
        console.warn(`[Duffel] Error searching ${destIata}: ${errMsg}`);
      }
    });

    await Promise.allSettled(searchPromises);

    // If we already have enough results, stop searching
    if (results.length >= 6) break;
  }

  // Sort by price and return top 3
  const sorted = results.sort((a, b) => a.totalPrice - b.totalPrice);
  const top3 = sorted.slice(0, 3);

  // Assign badges
  if (top3.length > 0) top3[0].badge = 'cheapest';
  if (top3.length > 1) top3[1].badge = 'best-value';
  if (top3.length > 2) top3[2].badge = 'hidden-gem';

  console.log(`[Duffel] Returning ${top3.length} destinations`);
  return top3;
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
