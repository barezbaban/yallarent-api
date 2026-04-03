import { useCallback, useEffect, useState } from 'react';
import { carsApi, Car } from '../services/api';

export function useCars(filters?: { city?: string; max_price?: number; min_price?: number; category?: string; transmission?: string; min_passengers?: number; min_luggage?: number }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = useCallback(async (pageNum = 1, append = false, silent = false) => {
    if (append) {
      setLoadingMore(true);
    } else if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await carsApi.list({
        city: filters?.city,
        min_price: filters?.min_price,
        max_price: filters?.max_price,
        category: filters?.category,
        transmission: filters?.transmission,
        min_passengers: filters?.min_passengers,
        min_luggage: filters?.min_luggage,
        page: pageNum,
        limit: 20,
      });
      setCars((prev) => (append ? [...prev, ...result.data] : result.data));
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch {
      if (!silent) {
        setError('Could not connect to the server. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters?.city, filters?.min_price, filters?.max_price, filters?.category, filters?.transmission, filters?.min_passengers, filters?.min_luggage]);

  useEffect(() => {
    fetchCars(1, false);
  }, [fetchCars]);

  const loadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) {
      fetchCars(page + 1, true);
    }
  }, [fetchCars, page, totalPages, loadingMore]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCars(1, false);
    setRefreshing(false);
  }, [fetchCars]);

  return { cars, loading, loadingMore, refreshing, error, refetch: () => fetchCars(1, false, true), onRefresh, loadMore, hasMore: page < totalPages };
}
