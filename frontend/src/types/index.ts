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
  // NEW: Personalization fields
  languages: string[];
  travelExperience: 'beginner' | 'intermediate' | 'expert';
  travelCompanion: 'solo' | 'couple' | 'friends' | 'family';
  climatePref: 'hot' | 'warm' | 'mild' | 'cold' | 'any';
  topPriority: 'price' | 'experience' | 'climate' | 'safety' | 'food';
  accomPreference: 'hostel_dorm' | 'hostel_private' | 'budget_hotel' | 'boutique';
}

export interface FlightSegment {
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  departureAirport: string;
  departureName: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalName: string;
  arrivalTime: string;
  duration: string;
  aircraft?: string;
}

export interface FlightDetail {
  offerId: string;
  airline: string;
  totalPrice: number;
  currency: string;
  outbound: {
    departure: string;
    arrival: string;
    duration: string;
    stops: number;
    segments: FlightSegment[];
  };
  inbound: {
    departure: string;
    arrival: string;
    duration: string;
    stops: number;
    segments: FlightSegment[];
  };
}

export interface AccommodationInfo {
  name: string;
  category: 'budget' | 'midrange' | 'premium';
  stars: number;
  reviewScore: number;
  reviewWord: string;
  totalPrice: number;
  pricePerNight: number;
  currency: string;
  photoUrl: string;
  address: string;
  bookingUrl: string;
  type: string;
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
  budgetTag?: 'within' | 'stretch' | 'worth-it';
  temperature?: number;
  flightDuration?: string;
  costOfLiving?: string;
  visaFree: boolean;
  // NEW: Rich flight details
  flightDetails?: FlightDetail;
  // NEW: Real accommodations from Booking.com
  accommodations?: {
    budget?: AccommodationInfo;
    midrange?: AccommodationInfo;
    premium?: AccommodationInfo;
  };
  // NEW: Weather data
  weather?: {
    temp: number;
    description: string;
    icon: string;
  };
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
