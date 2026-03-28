import { useCallback, useEffect, useState } from 'react';
import { carsApi, Car } from '../services/api';

export function useCars(filters?: { city?: string; max_price?: number }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await carsApi.list({
        city: filters?.city,
        max_price: filters?.max_price,
      });
      setCars(data);
    } catch {
      setError('Could not connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [filters?.city, filters?.max_price]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  return { cars, loading, error, refetch: fetchCars };
}
