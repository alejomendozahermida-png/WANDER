/**
 * Subsidy Service - Fetches European travel subsidies from backend
 */

import axios from 'axios';

const getBaseUrl = () => {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (backendUrl) return backendUrl;
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export interface Subsidy {
  name: string;
  emoji: string;
  description: string;
  amount: string;
  applies: boolean;
  how_to: string;
  next_deadline: string;
}

export interface SubsidyResult {
  subsidies: Subsidy[];
  total_potential_savings: number;
  applicable_count: number;
}

export const fetchSubsidies = async (params: {
  age?: number;
  is_student?: boolean;
  country?: string;
  has_erasmus?: boolean;
}): Promise<SubsidyResult> => {
  try {
    const response = await apiClient.get('/api/subsidies/calculate', {
      params: {
        age: params.age || 22,
        is_student: params.is_student !== false,
        country: params.country || 'FR',
        has_erasmus: params.has_erasmus || false,
      },
    });
    return response.data;
  } catch (error) {
    console.warn('[Subsidies] Error fetching:', error);
    return { subsidies: [], total_potential_savings: 0, applicable_count: 0 };
  }
};
