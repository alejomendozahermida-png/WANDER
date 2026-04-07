export interface User {
  id: string;
  email: string;
  firstName: string;
  nationality: string;
  passportCountry: string;
  homeAirportIata: string;
  homeCity: string;
  budgetMin: number;
  budgetMax: number;
  travelStyle: string[];
  travelsAlone: boolean;
  onboardingComplete: boolean;
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  iata: string;
  flightPrice: number;
  hotelPrice: number;
  totalPrice: number;
  departureDate: string;
  returnDate: string;
  imageUrl: string;
  badge?: 'cheapest' | 'best-value' | 'hidden-gem';
  temperature?: number;
  flightDuration?: string;
  costOfLiving?: string;
  visaFree: boolean;
}

export interface SavedTrip {
  id: string;
  userId: string;
  destinationCity: string;
  destinationCountry: string;
  destinationIata: string;
  flightPrice: number;
  hotelPrice: number;
  totalPrice: number;
  departureDate: string;
  returnDate: string;
  savedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  destinationCity: string;
  flightDeepLink: string;
  hotelDeepLink: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  stripePaymentIntent?: string;
  createdAt: string;
}

export type TravelStyle = 'culture' | 'nature' | 'party' | 'relax' | 'adventure' | 'gastronomy';
export type Mood = 'relax' | 'party' | 'culture' | 'nature';
