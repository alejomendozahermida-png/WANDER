import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@wander_user_prefs';

// Fields that exist in Supabase profiles table
const DB_FIELD_MAP: Record<string, string> = {
  firstName: 'first_name',
  nationality: 'nationality',
  passportCountry: 'passport_country',
  homeAirportIata: 'home_airport_iata',
  homeCity: 'home_city',
  budgetMin: 'budget_min',
  budgetMax: 'budget_max',
  travelStyle: 'travel_style',
  travelsAlone: 'travels_alone',
  onboardingComplete: 'onboarding_complete',
};

// New personalization fields stored locally
const LOCAL_FIELDS = ['languages', 'travelExperience', 'travelCompanion', 'climatePref', 'topPriority', 'accomPreference'];

async function saveLocalPrefs(prefs: Record<string, any>) {
  try {
    const existing = await AsyncStorage.getItem(PREFS_KEY);
    const merged = { ...(existing ? JSON.parse(existing) : {}), ...prefs };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  } catch (e) { console.warn('Failed to save local prefs:', e); }
}

async function loadLocalPrefs(): Promise<Record<string, any>> {
  try {
    const val = await AsyncStorage.getItem(PREFS_KEY);
    return val ? JSON.parse(val) : {};
  } catch { return {}; }
}

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
      // Split into DB fields and local fields
      const dbUpdates: any = {};
      const localUpdates: any = {};

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue;
        if (DB_FIELD_MAP[key]) {
          dbUpdates[DB_FIELD_MAP[key]] = value;
        } else if (LOCAL_FIELDS.includes(key)) {
          localUpdates[key] = value;
        }
      }

      // Update Supabase (only DB fields)
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', currentUser.id);

        if (error) throw error;
      }

      // Save new personalization fields locally
      if (Object.keys(localUpdates).length > 0) {
        await saveLocalPrefs(localUpdates);
      }

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
            // Load local personalization prefs
            languages: [] as string[],
            travelExperience: 'beginner' as const,
            travelCompanion: 'solo' as const,
            climatePref: 'any' as const,
            topPriority: 'price' as const,
            accomPreference: 'budget_hotel' as const,
          };

          // Merge with locally stored preferences
          const localPrefs = await loadLocalPrefs();
          if (localPrefs.languages) userData.languages = localPrefs.languages;
          if (localPrefs.travelExperience) userData.travelExperience = localPrefs.travelExperience;
          if (localPrefs.travelCompanion) userData.travelCompanion = localPrefs.travelCompanion;
          if (localPrefs.climatePref) userData.climatePref = localPrefs.climatePref;
          if (localPrefs.topPriority) userData.topPriority = localPrefs.topPriority;
          if (localPrefs.accomPreference) userData.accomPreference = localPrefs.accomPreference;

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
