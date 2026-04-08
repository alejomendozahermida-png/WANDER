import { Destination } from '../types';
import { searchMultipleDestinations, POPULAR_EU_DESTINATIONS } from './flightService';
import visaRules from '../assets/visa_rules.json';

// Mock popular European destinations for students
export const TRENDING_DESTINATIONS: Destination[] = [
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

// Function to search destinations with REAL Duffel API
export const searchDestinations = async (
  departureDate: string,
  returnDate: string,
  mood: string,
  budgetMax: number = 500,
  originIata: string = 'CDG',
  passportCountry?: string
): Promise<Destination[]> => {
  try {
    // Select destinations based on mood
    let destinationsToSearch = [...POPULAR_EU_DESTINATIONS];
    
    // Mood-based filtering
    if (mood === 'party') {
      destinationsToSearch = ['BCN', 'LIS', 'MAD', 'ATH', 'BER', 'AMS', 'PRG', 'OPO'];
    } else if (mood === 'culture') {
      destinationsToSearch = ['FCO', 'ATH', 'PRG', 'VIE', 'KRK', 'MAD', 'LIS', 'BER'];
    } else if (mood === 'relax') {
      destinationsToSearch = ['LIS', 'OPO', 'ATH', 'BCN', 'MAD'];
    } else if (mood === 'nature') {
      destinationsToSearch = ['KRK', 'BUD', 'OPO', 'VIE', 'PRG'];
    }

    // Remove origin from search destinations to avoid searching same city
    destinationsToSearch = destinationsToSearch.filter(d => d !== originIata);

    console.log(`[Search] Mood: ${mood}, Origin: ${originIata}, Budget: ${budgetMax}€, Destinations: ${destinationsToSearch.length}`);

    // Search using Duffel API
    const results = await searchMultipleDestinations(
      originIata,
      destinationsToSearch,
      departureDate,
      returnDate,
      budgetMax,
      passportCountry
    );

    // If we got less than 3, supplement with mock data
    if (results.length < 3) {
      console.log(`[Search] Only ${results.length} Duffel results, supplementing with mock data`);
      const existingIds = results.map(r => r.iata);
      const mockResults = TRENDING_DESTINATIONS
        .filter(d => !existingIds.includes(d.iata) && d.iata !== originIata)
        .sort((a, b) => a.totalPrice - b.totalPrice)
        .slice(0, 3 - results.length)
        .map((d, i) => ({
          ...d,
          departureDate,
          returnDate,
          badge: undefined as any,
        }));
      
      const combined = [...results, ...mockResults].slice(0, 3);
      // Re-assign badges
      if (combined.length > 0) combined[0].badge = 'cheapest';
      if (combined.length > 1) combined[1].badge = 'best-value';
      if (combined.length > 2) combined[2].badge = 'hidden-gem';
      return combined;
    }

    return results.slice(0, 3);
  } catch (error) {
    console.error('[Search] Error searching destinations:', error);
    // Fallback to mock data if API fails
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
