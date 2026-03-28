import { useCallback, useEffect, useState } from 'react';
import { carsApi, Car } from '../services/api';

export function useCars(filters?: { city?: string; max_price?: number }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = useCallback(async (pageNum = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await carsApi.list({
        city: filters?.city,
        max_price: filters?.max_price,
        page: pageNum,
        limit: 20,
      });
      setCars((prev) => (append ? [...prev, ...result.data] : result.data));
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch {
      setError('Could not connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters?.city, filters?.max_price]);

  useEffect(() => {
    fetchCars(1, false);
  }, [fetchCars]);

  const loadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) {
      fetchCars(page + 1, true);
    }
  }, [fetchCars, page, totalPages, loadingMore]);

  return { cars, loading, loadingMore, error, refetch: () => fetchCars(1, false), loadMore, hasMore: page < totalPages };
}
