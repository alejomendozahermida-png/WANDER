import { Destination } from '../types';
import { searchMultipleDestinations, POPULAR_EU_DESTINATIONS } from './flightService';
import { smartSearch } from './searchAlgorithm';
import { GLOBAL_DESTINATIONS } from '../data/globalDestinations';

// Trending destinations from global database (first 8 popular ones)
const TRENDING_IATAS = ['LIS', 'BCN', 'BKK', 'RAK', 'PRG', 'MEX', 'DPS', 'FCO'];
export const TRENDING_DESTINATIONS: Destination[] = GLOBAL_DESTINATIONS
  .filter(d => TRENDING_IATAS.includes(d.iata))
  .map((d, i) => ({
    id: String(i + 1),
    city: d.city,
    country: d.country,
    iata: d.iata,
    flightPrice: [89, 95, 180, 65, 78, 220, 250, 115][i] || 100,
    hotelPrice: [120, 140, 45, 80, 95, 60, 50, 155][i] || 100,
    totalPrice: [209, 235, 225, 145, 173, 280, 300, 270][i] || 200,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: d.imageUrl,
    temperature: d.avgTemps.summer,
    flightDuration: ['2h 30m', '2h 15m', '11h 20m', '3h 00m', '2h 00m', '10h 30m', '13h 00m', '2h 45m'][i] || '3h',
    costOfLiving: d.costOfLivingIndex <= 3 ? 'Low' : d.costOfLivingIndex <= 6 ? 'Medium' : 'High',
    visaFree: true,
  }));

// Legacy trending list for backwards compatibility
const LEGACY_TRENDING: Destination[] = [
  {
    id: '1',
    city: 'Lisbon',
    country: 'Portugal',
    iata: 'LIS',
    flightPrice: 89,
    hotelPrice: 120,
    totalPrice: 209,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
    temperature: 28,
    flightDuration: '2h 30m',
    costOfLiving: 'Low',
    visaFree: true,
  },
  {
    id: '2',
    city: 'Barcelona',
    country: 'Spain',
    iata: 'BCN',
    flightPrice: 95,
    hotelPrice: 140,
    totalPrice: 235,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    temperature: 30,
    flightDuration: '2h 15m',
    costOfLiving: 'Medium',
    visaFree: true,
  },
  {
    id: '3',
    city: 'Athens',
    country: 'Greece',
    iata: 'ATH',
    flightPrice: 125,
    hotelPrice: 110,
    totalPrice: 235,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
    temperature: 32,
    flightDuration: '3h 20m',
    costOfLiving: 'Low',
    visaFree: true,
  },
  {
    id: '4',
    city: 'Prague',
    country: 'Czech Republic',
    iata: 'PRG',
    flightPrice: 78,
    hotelPrice: 95,
    totalPrice: 173,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
    temperature: 24,
    flightDuration: '2h 00m',
    costOfLiving: 'Low',
    visaFree: true,
  },
  {
    id: '5',
    city: 'Budapest',
    country: 'Hungary',
    iata: 'BUD',
    flightPrice: 82,
    hotelPrice: 88,
    totalPrice: 170,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
    temperature: 26,
    flightDuration: '2h 30m',
    costOfLiving: 'Low',
    visaFree: true,
  },
  {
    id: '6',
    city: 'Rome',
    country: 'Italy',
    iata: 'FCO',
    flightPrice: 115,
    hotelPrice: 155,
    totalPrice: 270,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    temperature: 31,
    flightDuration: '2h 45m',
    costOfLiving: 'Medium',
    visaFree: true,
  },
  {
    id: '7',
    city: 'Krakow',
    country: 'Poland',
    iata: 'KRK',
    flightPrice: 68,
    hotelPrice: 75,
    totalPrice: 143,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
    temperature: 23,
    flightDuration: '2h 20m',
    costOfLiving: 'Very Low',
    visaFree: true,
  },
  {
    id: '8',
    city: 'Porto',
    country: 'Portugal',
    iata: 'OPO',
    flightPrice: 85,
    hotelPrice: 100,
    totalPrice: 185,
    departureDate: '2025-08-15',
    returnDate: '2025-08-22',
    imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
    temperature: 27,
    flightDuration: '2h 40m',
    costOfLiving: 'Low',
    visaFree: true,
  },
];

// Function to search destinations with SMART GLOBAL ALGORITHM + Duffel API
export const searchDestinations = async (
  departureDate: string,
  returnDate: string,
  mood: string,
  budgetMax: number = 500,
  originIata: string = 'CDG',
  passportCountry?: string
): Promise<Destination[]> => {
  try {
    console.log(`[Search] Smart global search: mood=${mood}, origin=${originIata}, budget=${budgetMax}€, passport=${passportCountry}`);

    // Use the smart search algorithm
    const results = await smartSearch({
      originIata,
      departureDate,
      returnDate,
      mood,
      budgetMax,
      passportCountry,
    });

    // If we got less than 3, supplement with trending data
    if (results.length < 3) {
      console.log(`[Search] Only ${results.length} results, supplementing with trending data`);
      const existingIatas = results.map(r => r.iata);
      const supplements = TRENDING_DESTINATIONS
        .filter(d => !existingIatas.includes(d.iata) && d.iata !== originIata)
        .slice(0, 3 - results.length)
        .map(d => ({ ...d, departureDate, returnDate }));
      
      const combined = [...results, ...supplements].slice(0, 3);
      if (combined.length > 0 && !combined.find(c => c.badge === 'cheapest')) combined[0].badge = 'cheapest';
      if (combined.length > 1 && !combined.find(c => c.badge === 'best-value')) combined[1].badge = 'best-value';
      if (combined.length > 2 && !combined.find(c => c.badge === 'hidden-gem')) combined[2].badge = 'hidden-gem';
      return combined;
    }

    return results;
  } catch (error) {
    console.error('[Search] Error in smart search:', error);
    // Fallback to mock data if everything fails
    return searchDestinationsMock(departureDate, returnDate, mood, budgetMax);
  }
};

// Fallback mock function
const searchDestinationsMock = async (
  departureDate: string,
  returnDate: string,
  mood: string,
  budgetMax: number = 500
): Promise<Destination[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let withinBudget = TRENDING_DESTINATIONS.filter(d => d.totalPrice <= budgetMax);
  
  if (withinBudget.length < 3) {
    const overBudget = TRENDING_DESTINATIONS
      .filter(d => d.totalPrice > budgetMax)
      .sort((a, b) => a.totalPrice - b.totalPrice);
    withinBudget = [...withinBudget, ...overBudget].slice(0, 8);
  }
  
  const scored = withinBudget.map(dest => {
    let score = Math.random() * 0.5;
    
    if (mood === 'party' && ['Barcelona', 'Lisbon', 'Athens'].includes(dest.city)) {
      score += 0.4;
    }
    if (mood === 'culture' && ['Rome', 'Athens', 'Prague', 'Krakow'].includes(dest.city)) {
      score += 0.4;
    }
    if (mood === 'relax' && ['Porto', 'Lisbon'].includes(dest.city)) {
      score += 0.4;
    }
    if (mood === 'nature' && ['Krakow', 'Budapest', 'Porto'].includes(dest.city)) {
      score += 0.4;
    }
    
    return { ...dest, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);
  
  top3[0].badge = 'cheapest';
  top3[1].badge = 'best-value';
  top3[2].badge = 'hidden-gem';
  
  return top3;
};

// Mock IATA codes for airport search
export const POPULAR_AIRPORTS = [
  { iata: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' },
  { iata: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Madrid-Barajas', country: 'Spain' },
  { iata: 'BCN', city: 'Barcelona', name: 'El Prat Airport', country: 'Spain' },
  { iata: 'LIS', city: 'Lisbon', name: 'Humberto Delgado Airport', country: 'Portugal' },
  { iata: 'FCO', city: 'Rome', name: 'Leonardo da Vinci-Fiumicino', country: 'Italy' },
  { iata: 'AMS', city: 'Amsterdam', name: 'Schiphol Airport', country: 'Netherlands' },
  { iata: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'Germany' },
  { iata: 'MUC', city: 'Munich', name: 'Franz Josef Strauss Airport', country: 'Germany' },
  { iata: 'BER', city: 'Berlin', name: 'Berlin Brandenburg Airport', country: 'Germany' },
  { iata: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'United Kingdom' },
  { iata: 'VIE', city: 'Vienna', name: 'Vienna International Airport', country: 'Austria' },
  { iata: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland' },
  { iata: 'CPH', city: 'Copenhagen', name: 'Copenhagen Airport', country: 'Denmark' },
  { iata: 'OSL', city: 'Oslo', name: 'Oslo Airport', country: 'Norway' },
  { iata: 'ARN', city: 'Stockholm', name: 'Arlanda Airport', country: 'Sweden' },
];

export const NATIONALITIES = [
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PL', name: 'Poland' },
  { code: 'GR', name: 'Greece' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'TR', name: 'Turkey' },
  { code: 'IL', name: 'Israel' },
  { code: 'SA', name: 'Saudi Arabia' },
];
