/**
 * Smart Search Algorithm for Wander
 * Multi-factor scoring engine that pre-filters and ranks destinations globally
 */

import { Destination } from '../types';
import { GLOBAL_DESTINATIONS, GlobalDestination, MoodTag, Season } from '../data/globalDestinations';
import { getVisaStatus, VisaStatus } from '../data/visaData';
import { searchMultipleDestinations } from './flightService';
import { searchAccommodations } from './dealsService';

interface SearchParams {
  originIata: string;
  departureDate: string;
  returnDate: string;
  mood: string;
  budgetMax: number;
  passportCountry?: string;
  travelStyle?: string[];
}

interface ScoredCandidate {
  destination: GlobalDestination;
  preScore: number;
  visaStatus: VisaStatus;
}

/** Weights for the scoring algorithm */
const WEIGHTS = {
  price: 0.30,
  moodMatch: 0.25,
  flightDuration: 0.15,
  climate: 0.10,
  costOfLiving: 0.10,
  visaEase: 0.05,
  profileMatch: 0.05,
};

/**
 * Determine the current season based on a date string
 */
const getSeason = (dateStr: string): Season => {
  const month = new Date(dateStr).getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

/**
 * Calculate trip duration in days
 */
const getTripDays = (dep: string, ret: string): number => {
  const d1 = new Date(dep);
  const d2 = new Date(ret);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
};

/**
 * Haversine distance between two points (km)
 */
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

/**
 * Get origin coordinates from IATA code
 */
const getOriginCoords = (iata: string): { lat: number; lon: number } => {
  const dest = GLOBAL_DESTINATIONS.find(d => d.iata === iata);
  if (dest) return { lat: dest.latitude, lon: dest.longitude };
  // Default coords for common airports not in destinations list
  const AIRPORT_COORDS: Record<string, { lat: number; lon: number }> = {
    CDG: { lat: 49.01, lon: 2.55 }, LHR: { lat: 51.47, lon: -0.46 },
    FRA: { lat: 50.03, lon: 8.57 }, MUC: { lat: 48.35, lon: 11.79 },
    ZRH: { lat: 47.46, lon: 8.55 }, GVA: { lat: 46.24, lon: 6.11 },
    ORY: { lat: 48.73, lon: 2.37 },
  };
  return AIRPORT_COORDS[iata] || { lat: 48.86, lon: 2.35 }; // Default Paris
};

/**
 * STEP 1: Pre-filter destinations based on hard constraints
 * Reduces 150+ to ~20-30 candidates
 */
const preFilterDestinations = (params: SearchParams): ScoredCandidate[] => {
  const season = getSeason(params.departureDate);
  const tripDays = getTripDays(params.departureDate, params.returnDate);
  const originCoords = getOriginCoords(params.originIata);
  const mood = params.mood as MoodTag;

  const candidates: ScoredCandidate[] = [];

  for (const dest of GLOBAL_DESTINATIONS) {
    // Skip if same as origin airport
    if (dest.iata === params.originIata) continue;

    // Check visa status
    const visaStatus = params.passportCountry
      ? getVisaStatus(params.passportCountry, dest.countryCode)
      : 'free'; // Assume free if no passport set

    // Hard filter: skip destinations requiring traditional visa
    if (visaStatus === 'visa') continue;

    // Calculate distance from origin
    const distance = haversineDistance(
      originCoords.lat, originCoords.lon,
      dest.latitude, dest.longitude
    );

    // Filter by trip duration vs distance
    // Short trips (1-3 days): max ~3000km, Medium (4-7): max ~6000km, Long (8+): any distance
    if (tripDays <= 3 && distance > 4000) continue;
    if (tripDays <= 5 && distance > 8000) continue;

    // Budget pre-filter: estimate cost based on distance & budget level
    const estimatedFlightCost = estimateFlightCost(distance);
    const estimatedDailyCost = dest.costOfLivingIndex * 15; // Rough daily estimate
    const estimatedTotal = estimatedFlightCost + (estimatedDailyCost * tripDays);
    
    // Allow some budget flexibility (1.5x)
    if (estimatedTotal > params.budgetMax * 2.5) continue;

    // Calculate pre-score for ranking candidates
    let preScore = 0;

    // Mood match (0-1)
    const moodMatch = dest.moods.includes(mood) ? 1 : 0;
    const moodPosition = dest.moods.indexOf(mood);
    const moodScore = moodMatch ? 1 - (moodPosition * 0.15) : 0.1;
    preScore += moodScore * 40;

    // Season match (0-1)
    const seasonMatch = dest.bestSeasons.includes(season) ? 1 : 0.4;
    preScore += seasonMatch * 20;

    // Budget friendliness (inverse of cost)
    const budgetScore = Math.max(0, 1 - (estimatedTotal / (params.budgetMax * 2)));
    preScore += budgetScore * 25;

    // Visa ease
    const visaScore = visaStatus === 'free' ? 1 : 0.6;
    preScore += visaScore * 10;

    // Distance appropriateness (prefer closer for short trips, any for long)
    const idealDistance = tripDays <= 3 ? 1500 : tripDays <= 7 ? 4000 : 8000;
    const distScore = Math.max(0, 1 - Math.abs(distance - idealDistance) / idealDistance);
    preScore += distScore * 5;

    candidates.push({ destination: dest, preScore, visaStatus });
  }

  // Sort by pre-score and take top candidates
  candidates.sort((a, b) => b.preScore - a.preScore);
  
  // Take top 10 but ensure geographic diversity
  return ensureDiversity(candidates, 10);
};

/**
 * Estimate flight cost based on distance (rough heuristic)
 */
const estimateFlightCost = (distanceKm: number): number => {
  if (distanceKm < 1000) return 40 + distanceKm * 0.04;
  if (distanceKm < 3000) return 60 + distanceKm * 0.03;
  if (distanceKm < 6000) return 120 + distanceKm * 0.025;
  return 200 + distanceKm * 0.02;
};

/**
 * Ensure geographic diversity in candidates
 * At least 2-3 different regions represented
 */
const ensureDiversity = (candidates: ScoredCandidate[], maxCount: number): ScoredCandidate[] => {
  const result: ScoredCandidate[] = [];
  const regionCount: Record<string, number> = {};
  const countryCount: Record<string, number> = {};
  const maxPerRegion = Math.ceil(maxCount / 3);
  const maxPerCountry = 2;

  for (const candidate of candidates) {
    const region = candidate.destination.region;
    const country = candidate.destination.countryCode;
    
    if ((regionCount[region] || 0) >= maxPerRegion) continue;
    if ((countryCount[country] || 0) >= maxPerCountry) continue;

    result.push(candidate);
    regionCount[region] = (regionCount[region] || 0) + 1;
    countryCount[country] = (countryCount[country] || 0) + 1;

    if (result.length >= maxCount) break;
  }

  // If we don't have enough due to diversity constraints, fill from remaining
  if (result.length < maxCount) {
    for (const candidate of candidates) {
      if (!result.includes(candidate)) {
        result.push(candidate);
        if (result.length >= maxCount) break;
      }
    }
  }

  return result;
};

/**
 * STEP 2: Search Duffel API for pre-filtered candidates
 * Returns real flight prices for each candidate
 */
const searchCandidates = async (
  origin: string,
  candidates: ScoredCandidate[],
  departureDate: string,
  returnDate: string,
  budgetMax: number,
  passportCountry?: string
): Promise<Destination[]> => {
  const iatas = candidates.map(c => c.destination.iata);
  
  console.log(`[Algorithm] Searching ${iatas.length} candidates via Duffel: ${iatas.join(', ')}`);
  
  const results = await searchMultipleDestinations(
    origin,
    iatas,
    departureDate,
    returnDate,
    budgetMax * 3, // Allow wider budget for Duffel, we'll score later
    passportCountry
  );

  // Enrich results with data from our global database
  return results.map(dest => {
    const globalDest = candidates.find(c => c.destination.iata === dest.iata);
    if (globalDest) {
      return {
        ...dest,
        imageUrl: globalDest.destination.imageUrl,
        temperature: globalDest.destination.avgTemps[getSeason(departureDate)],
        costOfLiving: getCostLabel(globalDest.destination.costOfLivingIndex),
        visaFree: globalDest.visaStatus === 'free',
      };
    }
    return dest;
  });
};

const getCostLabel = (index: number): string => {
  if (index <= 2) return 'Muy bajo';
  if (index <= 4) return 'Bajo';
  if (index <= 6) return 'Medio';
  if (index <= 8) return 'Alto';
  return 'Muy alto';
};

/**
 * STEP 3: Apply final scoring to rank results
 */
const scoreResults = (
  results: Destination[],
  candidates: ScoredCandidate[],
  params: SearchParams
): Destination[] => {
  const season = getSeason(params.departureDate);
  const mood = params.mood as MoodTag;
  const originCoords = getOriginCoords(params.originIata);

  const scored = results.map(dest => {
    const globalDest = candidates.find(c => c.destination.iata === dest.iata);
    if (!globalDest) return { dest, score: 0 };

    const gd = globalDest.destination;
    let score = 0;

    // 1. Price score (30%) — lower price = higher score
    const priceRatio = dest.totalPrice / params.budgetMax;
    const priceScore = Math.max(0, 1 - priceRatio * 0.7);
    score += priceScore * WEIGHTS.price * 100;

    // 2. Mood match (25%)
    const moodIdx = gd.moods.indexOf(mood);
    const moodScore = moodIdx >= 0 ? 1 - (moodIdx * 0.2) : 0;
    score += moodScore * WEIGHTS.moodMatch * 100;

    // 3. Flight duration proxy via distance (15%)
    const dist = haversineDistance(originCoords.lat, originCoords.lon, gd.latitude, gd.longitude);
    const tripDays = getTripDays(params.departureDate, params.returnDate);
    const idealDist = tripDays <= 3 ? 1500 : tripDays <= 7 ? 4000 : 8000;
    const durationScore = Math.max(0, 1 - Math.abs(dist - idealDist) / (idealDist * 2));
    score += durationScore * WEIGHTS.flightDuration * 100;

    // 4. Climate (10%) — prefer good weather
    const temp = gd.avgTemps[season];
    const tempScore = temp >= 18 && temp <= 30 ? 1 : temp >= 10 && temp <= 35 ? 0.6 : 0.3;
    const seasonBonus = gd.bestSeasons.includes(season) ? 0.3 : 0;
    score += (tempScore + seasonBonus) * WEIGHTS.climate * 100;

    // 5. Cost of living (10%)
    const colScore = Math.max(0, 1 - (gd.costOfLivingIndex / 10));
    score += colScore * WEIGHTS.costOfLiving * 100;

    // 6. Visa ease (5%)
    const visaScore = globalDest.visaStatus === 'free' ? 1 : 0.5;
    score += visaScore * WEIGHTS.visaEase * 100;

    // 7. Profile match (5%)
    let profileScore = 0.5;
    if (params.travelStyle && params.travelStyle.length > 0) {
      const overlap = gd.moods.filter(m => params.travelStyle!.includes(m)).length;
      profileScore = overlap / Math.max(params.travelStyle.length, 1);
    }
    score += profileScore * WEIGHTS.profileMatch * 100;

    return { dest, score };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Ensure top 3 are from different regions if possible
  const finalResults: Destination[] = [];
  const usedRegions = new Set<string>();
  const usedCountries = new Set<string>();

  // First pass: pick best from each region
  for (const { dest } of scored) {
    const gd = GLOBAL_DESTINATIONS.find(g => g.iata === dest.iata);
    if (!gd) continue;
    
    if (!usedRegions.has(gd.region) && !usedCountries.has(gd.countryCode)) {
      finalResults.push(dest);
      usedRegions.add(gd.region);
      usedCountries.add(gd.countryCode);
    }
    if (finalResults.length >= 3) break;
  }

  // Fill remaining from scored results
  if (finalResults.length < 3) {
    for (const { dest } of scored) {
      if (!finalResults.find(r => r.iata === dest.iata)) {
        finalResults.push(dest);
      }
      if (finalResults.length >= 3) break;
    }
  }

  // Assign badges based on characteristics
  if (finalResults.length > 0) {
    const sorted = [...finalResults].sort((a, b) => a.totalPrice - b.totalPrice);
    finalResults.forEach(dest => {
      if (dest.iata === sorted[0]?.iata) dest.badge = 'cheapest';
      else if (finalResults.indexOf(dest) === 0 && dest.badge !== 'cheapest') dest.badge = 'best-value';
      else dest.badge = 'hidden-gem';
    });
    // Ensure at least one of each
    if (!finalResults.find(d => d.badge === 'cheapest') && finalResults.length > 0) finalResults[0].badge = 'cheapest';
    if (!finalResults.find(d => d.badge === 'best-value') && finalResults.length > 1) finalResults[1].badge = 'best-value';
    if (!finalResults.find(d => d.badge === 'hidden-gem') && finalResults.length > 2) finalResults[2].badge = 'hidden-gem';
  }

  return finalResults.slice(0, 3);
};

/**
 * MAIN ENTRY: Smart global search
 * 1. Pre-filter 150+ destinations → ~15 candidates
 * 2. Search candidates via Duffel API
 * 3. Score & rank with multi-factor algorithm
 * 4. Return top 3 diverse results
 */
export const smartSearch = async (params: SearchParams): Promise<Destination[]> => {
  console.log('[Algorithm] Starting smart search:', JSON.stringify({
    origin: params.originIata,
    dates: `${params.departureDate} → ${params.returnDate}`,
    mood: params.mood,
    budget: params.budgetMax,
    passport: params.passportCountry,
  }));

  // Step 1: Pre-filter
  const candidates = preFilterDestinations(params);
  console.log(`[Algorithm] Pre-filtered to ${candidates.length} candidates from ${GLOBAL_DESTINATIONS.length} destinations`);
  console.log(`[Algorithm] Candidates: ${candidates.map(c => `${c.destination.city}(${c.destination.iata})`).join(', ')}`);

  if (candidates.length === 0) {
    console.warn('[Algorithm] No candidates after pre-filter!');
    return [];
  }

  // Step 2: Search via Duffel
  const results = await searchCandidates(
    params.originIata,
    candidates,
    params.departureDate,
    params.returnDate,
    params.budgetMax,
    params.passportCountry
  );
  console.log(`[Algorithm] Duffel returned ${results.length} results with prices`);

  if (results.length === 0) {
    console.warn('[Algorithm] No Duffel results, returning pre-filtered mock data');
    // Return mock results from candidates
    return candidates.slice(0, 3).map((c, i) => ({
      id: c.destination.iata,
      city: c.destination.city,
      country: c.destination.country,
      iata: c.destination.iata,
      flightPrice: Math.round(estimateFlightCost(2000 + i * 1000)),
      hotelPrice: Math.round(c.destination.costOfLivingIndex * 15 * getTripDays(params.departureDate, params.returnDate)),
      totalPrice: 0,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      imageUrl: c.destination.imageUrl,
      temperature: c.destination.avgTemps[getSeason(params.departureDate)],
      flightDuration: 'N/A',
      costOfLiving: getCostLabel(c.destination.costOfLivingIndex),
      visaFree: c.visaStatus === 'free',
      badge: i === 0 ? 'cheapest' as const : i === 1 ? 'best-value' as const : 'hidden-gem' as const,
    })).map(d => ({ ...d, totalPrice: d.flightPrice + d.hotelPrice }));
  }

  // Step 3: Score & rank
  const ranked = scoreResults(results, candidates, params);
  console.log(`[Algorithm] Final top ${ranked.length}: ${ranked.map(r => `${r.city}(${r.flightPrice}€ flight)`).join(', ')}`);

  // Step 4: Load REAL hotel prices from Booking.com for the top 3
  console.log('[Algorithm] Loading real Booking.com prices for top results...');
  const accomPromises = ranked.map(async (dest) => {
    try {
      const accomResult = await searchAccommodations(
        dest.city,
        params.departureDate,
        params.returnDate,
        2,
        'EUR'
      );
      if (accomResult?.accommodations) {
        // Use budget hotel price as default, or midrange if budget unavailable
        const budgetAccom = accomResult.accommodations.budget;
        const midrangeAccom = accomResult.accommodations.midrange;
        const defaultAccom = budgetAccom || midrangeAccom;

        if (defaultAccom) {
          dest.hotelPrice = Math.round(defaultAccom.total_price);
          dest.totalPrice = dest.flightPrice + dest.hotelPrice;
        }

        // Store all 3 accommodation options
        dest.accommodations = {
          budget: budgetAccom ? {
            name: budgetAccom.name,
            category: 'budget',
            stars: budgetAccom.stars,
            reviewScore: budgetAccom.review_score,
            reviewWord: budgetAccom.review_word,
            totalPrice: budgetAccom.total_price,
            pricePerNight: budgetAccom.price_per_night,
            currency: budgetAccom.currency,
            photoUrl: budgetAccom.photo_url,
            address: budgetAccom.address,
            bookingUrl: budgetAccom.booking_url,
            type: budgetAccom.accommodation_type,
          } : undefined,
          midrange: midrangeAccom ? {
            name: midrangeAccom.name,
            category: 'midrange',
            stars: midrangeAccom.stars,
            reviewScore: midrangeAccom.review_score,
            reviewWord: midrangeAccom.review_word,
            totalPrice: midrangeAccom.total_price,
            pricePerNight: midrangeAccom.price_per_night,
            currency: midrangeAccom.currency,
            photoUrl: midrangeAccom.photo_url,
            address: midrangeAccom.address,
            bookingUrl: midrangeAccom.booking_url,
            type: midrangeAccom.accommodation_type,
          } : undefined,
          premium: accomResult.accommodations.premium ? {
            name: accomResult.accommodations.premium.name,
            category: 'premium',
            stars: accomResult.accommodations.premium.stars,
            reviewScore: accomResult.accommodations.premium.review_score,
            reviewWord: accomResult.accommodations.premium.review_word,
            totalPrice: accomResult.accommodations.premium.total_price,
            pricePerNight: accomResult.accommodations.premium.price_per_night,
            currency: accomResult.accommodations.premium.currency,
            photoUrl: accomResult.accommodations.premium.photo_url,
            address: accomResult.accommodations.premium.address,
            bookingUrl: accomResult.accommodations.premium.booking_url,
            type: accomResult.accommodations.premium.accommodation_type,
          } : undefined,
        };

        console.log(`[Algorithm] ${dest.city}: hotel ${dest.hotelPrice}€ → total ${dest.totalPrice}€`);
      }
    } catch (error) {
      console.warn(`[Algorithm] Failed to load Booking.com for ${dest.city}:`, error);
    }
  });

  await Promise.allSettled(accomPromises);

  // Re-sort by total real price and re-assign badges
  ranked.sort((a, b) => a.totalPrice - b.totalPrice);
  if (ranked.length > 0) ranked[0].badge = 'cheapest';
  if (ranked.length > 1) ranked[1].badge = 'best-value';
  if (ranked.length > 2) ranked[2].badge = 'hidden-gem';

  console.log(`[Algorithm] Final with REAL prices: ${ranked.map(r => `${r.city}(${r.totalPrice}€ = ${r.flightPrice}€ flight + ${r.hotelPrice}€ hotel)`).join(', ')}`);

  return ranked;
};
