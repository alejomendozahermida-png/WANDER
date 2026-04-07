import { create } from 'zustand';
import { Destination } from '../types';

interface SearchState {
  departureDate: Date | null;
  returnDate: Date | null;
  selectedMood: string | null;
  results: Destination[];
  isSearching: boolean;
  setDates: (departure: Date, returnDate: Date) => void;
  setMood: (mood: string) => void;
  setResults: (results: Destination[]) => void;
  setSearching: (isSearching: boolean) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  departureDate: null,
  returnDate: null,
  selectedMood: null,
  results: [],
  isSearching: false,
  setDates: (departureDate, returnDate) => set({ departureDate, returnDate }),
  setMood: (selectedMood) => set({ selectedMood }),
  setResults: (results) => set({ results }),
  setSearching: (isSearching) => set({ isSearching }),
  clearSearch: () => set({ 
    departureDate: null, 
    returnDate: null, 
    selectedMood: null, 
    results: [] 
  }),
}));
