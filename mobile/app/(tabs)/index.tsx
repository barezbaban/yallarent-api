import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { useCars } from '../../hooks/useCars';
import CarCard from '../../components/CarCard';
import CarCardSkeleton from '../../components/CarCardSkeleton';
import SearchBar from '../../components/SearchBar';
import FilterChips from '../../components/FilterChips';
import ErrorState from '../../components/ErrorState';

const FILTERS = ['All Cities', 'SUV', 'Sedan', 'Under 75K'];

export default function CarsScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Cities');
  const { cars, loading, error, refetch } = useCars();

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

    if (activeFilter === 'Under 75K') {
      result = result.filter((c) => c.price_per_day < 75000);
    } else if (activeFilter !== 'All Cities') {
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
        <Text style={styles.logo}>YallaRent</Text>
        <Ionicons name="person-circle-outline" size={32} color={Colors.foregroundMuted} />
      </View>

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CarCard car={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <SearchBar value={search} onChangeText={setSearch} />
            <FilterChips
              filters={FILTERS}
              selected={activeFilter}
              onSelect={setActiveFilter}
            />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Cars</Text>
              <Text style={styles.count}>
                {loading ? '...' : `${filtered.length} cars`}
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
              <Text style={styles.emptyText}>No cars found</Text>
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
