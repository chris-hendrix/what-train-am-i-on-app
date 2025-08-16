import { useState } from 'react';
import {
  NearestTrainsRequest,
  NearestTrainsResponse,
  SuccessResponse,
  ErrorResponse
} from '@what-train/shared';

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
      const response = await fetch('http://localhost:3000/trains/nearest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data: SuccessResponse<NearestTrainsResponse> | ErrorResponse = await response.json();

      if (data.success && 'data' in data) {
        setResults(data.data);
        return data.data;
      } else {
        setError(data.error || 'Failed to find nearby trains');
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