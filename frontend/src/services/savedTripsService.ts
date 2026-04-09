/**
 * Saved Trips Service - CRUD operations with Supabase
 */

import { supabase } from './supabase';

export interface SavedTripRow {
  id: string;
  user_id: string;
  destination_city: string;
  destination_iata: string | null;
  destination_country: string | null;
  flight_price: number | null;
  flight_details: any | null;
  hotel_details: any | null;
  departure_date: string | null;
  return_date: string | null;
  mood: string | null;
  image_url: string | null;
  total_price: number | null;
  created_at: string;
}

export const getSavedTrips = async (userId: string): Promise<SavedTripRow[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SavedTrips] Error fetching:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('[SavedTrips] Unexpected error:', error);
    return [];
  }
};

export const saveTrip = async (trip: Omit<SavedTripRow, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('saved_trips')
      .insert([trip]);

    if (error) {
      console.error('[SavedTrips] Error saving:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    console.error('[SavedTrips] Unexpected error saving:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

export const deleteTrip = async (tripId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('saved_trips')
      .delete()
      .eq('id', tripId);

    if (error) {
      console.error('[SavedTrips] Error deleting:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    console.error('[SavedTrips] Unexpected error deleting:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

export const isTripSaved = async (userId: string, destinationIata: string, departureDate: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('saved_trips')
      .select('id')
      .eq('user_id', userId)
      .eq('destination_iata', destinationIata)
      .eq('departure_date', departureDate)
      .limit(1);

    if (error) return false;
    return (data?.length || 0) > 0;
  } catch {
    return false;
  }
};
