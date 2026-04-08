import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  
  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },
  
  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;

    try {
      // Convert camelCase to snake_case for database
      const dbUpdates: any = {};
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.nationality !== undefined) dbUpdates.nationality = updates.nationality;
      if (updates.passportCountry !== undefined) dbUpdates.passport_country = updates.passportCountry;
      if (updates.homeAirportIata !== undefined) dbUpdates.home_airport_iata = updates.homeAirportIata;
      if (updates.homeCity !== undefined) dbUpdates.home_city = updates.homeCity;
      if (updates.budgetMin !== undefined) dbUpdates.budget_min = updates.budgetMin;
      if (updates.budgetMax !== undefined) dbUpdates.budget_max = updates.budgetMax;
      if (updates.travelStyle !== undefined) dbUpdates.travel_style = updates.travelStyle;
      if (updates.travelsAlone !== undefined) dbUpdates.travels_alone = updates.travelsAlone;
      if (updates.onboardingComplete !== undefined) dbUpdates.onboarding_complete = updates.onboardingComplete;
      // New personalization fields
      if (updates.languages !== undefined) dbUpdates.languages = updates.languages;
      if (updates.travelExperience !== undefined) dbUpdates.travel_experience = updates.travelExperience;
      if (updates.travelCompanion !== undefined) dbUpdates.travel_companion = updates.travelCompanion;
      if (updates.climatePref !== undefined) dbUpdates.climate_pref = updates.climatePref;
      if (updates.topPriority !== undefined) dbUpdates.top_priority = updates.topPriority;
      if (updates.accomPreference !== undefined) dbUpdates.accom_preference = updates.accomPreference;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', currentUser.id);

      if (error) throw error;

      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        if (profile) {
          const userData: User = {
            id: profile.id,
            email: session.user.email || '',
            firstName: profile.first_name || '',
            nationality: profile.nationality || '',
            passportCountry: profile.passport_country || '',
            homeAirportIata: profile.home_airport_iata || '',
            homeCity: profile.home_city || '',
            budgetMin: profile.budget_min || 50,
            budgetMax: profile.budget_max || 500,
            travelStyle: profile.travel_style || [],
            travelsAlone: profile.travels_alone || false,
            onboardingComplete: profile.onboarding_complete || false,
            languages: profile.languages || [],
            travelExperience: profile.travel_experience || 'beginner',
            travelCompanion: profile.travel_companion || 'solo',
            climatePref: profile.climate_pref || 'any',
            topPriority: profile.top_priority || 'price',
            accomPreference: profile.accom_preference || 'budget_hotel',
          };
          set({ user: userData, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
