import { useState } from 'react';
import {
  NearestTrainsRequest,
  NearestTrainsResponse,
  SuccessResponse,
  ErrorResponse
} from '@what-train/shared';
import { API_CONFIG } from '../constants/api';

interface UseFindNearestTrainsReturn {
  findNearestTrains: (params: NearestTrainsRequest) => Promise<NearestTrainsResponse | null>;
  loading: boolean;
  error: string | null;
  results: NearestTrainsResponse | null;
  clearError: () => void;
}

export function useFindNearestTrains(): UseFindNearestTrainsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NearestTrainsResponse | null>(null);

  const findNearestTrains = async (params: NearestTrainsRequest): Promise<NearestTrainsResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        ...params,
        radiusMeters: params.radiusMeters || API_CONFIG.DEFAULT_SEARCH_RADIUS_METERS
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/trains/nearest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: SuccessResponse<NearestTrainsResponse> | ErrorResponse = await response.json();

      if (data.success && 'data' in data) {
        setResults(data.data);
        return data.data;
      } else {
        setError(data.error || `Failed to find trains within ${API_CONFIG.DEFAULT_SEARCH_RADIUS_METERS}m`);
        setResults(null);
        return null;
      }
    } catch {
      setError('Failed to connect to the server. Please check your connection.');
      setResults(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    findNearestTrains,
    loading,
    error,
    results,
    clearError
  };
}