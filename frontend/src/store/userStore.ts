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
      const { error } = await supabase
        .from('profiles')
        .update(updates)
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
