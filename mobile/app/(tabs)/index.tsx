import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { useCars } from '../../hooks/useCars';
import { notificationsApi } from '../../services/api';
import { useAuth } from '../../services/auth';
import { t } from '../../services/i18n';
import { useLanguage } from '../../services/language';
import CarCard from '../../components/CarCard';
import CarCardSkeleton from '../../components/CarCardSkeleton';
import SearchBar from '../../components/SearchBar';
import FilterChips from '../../components/FilterChips';
import ErrorState from '../../components/ErrorState';

export default function CarsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const FILTERS = [t('search.allCities'), t('search.suv'), t('search.sedan'), t('search.under75k')];
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { cars, loading, loadingMore, error, refetch, loadMore, hasMore } = useCars();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        notificationsApi.unreadCount().then((r) => setUnreadCount(r.count)).catch(() => {});
      }
    }, [user])
  );

  const filtered = useMemo(() => {
    let result = cars;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.make.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.company_name.toLowerCase().includes(q)
      );
    }

    if (activeFilter === t('search.under75k')) {
      result = result.filter((c) => c.price_per_day < 75000);
    } else if (activeFilter !== t('search.allCities')) {
      const q = activeFilter.toLowerCase();
      result = result.filter(
        (c) =>
          c.make.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q)
      );
    }

    return result;
  }, [cars, search, activeFilter]);

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>{t('home.logo')}</Text>
        <Pressable onPress={() => router.push('/notifications')} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={26} color={Colors.foreground} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CarCard car={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ paddingVertical: Spacing.lg }} color={Colors.primary} /> : null
        }
        ListHeaderComponent={
          <>
            <SearchBar value={search} onChangeText={setSearch} />
            <FilterChips
              filters={FILTERS}
              selected={activeFilter}
              onSelect={setActiveFilter}
            />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.availableCars')}</Text>
              <Text style={styles.count}>
                {loading ? '...' : `${filtered.length} ${t('home.cars')}`}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View>
              <CarCardSkeleton />
              <CarCardSkeleton />
              <CarCardSkeleton />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('home.noCars')}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfacePrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logo: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  bellBtn: {
    padding: Spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  count: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
  },
  empty: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
  },
});
