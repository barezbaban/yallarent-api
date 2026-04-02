import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { companiesApi, Company } from '../../services/api';

const LOGO_COLORS = ['#0891B2', '#6366F1', '#F59E0B', '#EC4899', '#10B981', '#8B5CF6', '#EF4444'];
const CITIES = ['All', 'Erbil', 'Baghdad', 'Basra', 'Sulaymaniyah', 'Duhok'];

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

export default function PartnersScreen() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All');

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await companiesApi.list();
      setCompanies(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanies();
  };

  const filtered = selectedCity === 'All'
    ? companies
    : companies.filter((c) => c.city === selectedCity);

  const renderCompany = ({ item, index }: { item: Company; index: number }) => {
    const color = LOGO_COLORS[index % LOGO_COLORS.length];
    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/partner/${item.id}`)}
      >
        <View style={[styles.logoCircle, { backgroundColor: color }]}>
          <Text style={styles.logoLetter}>{getInitial(item.name)}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={Colors.foregroundMuted} />
              <Text style={styles.metaText}>{item.city}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="car-outline" size={12} color={Colors.foregroundMuted} />
              <Text style={styles.metaText}>{item.car_count} cars</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={12} color={Colors.amber} />
              <Text style={styles.ratingText}>4.{5 + (index % 4)}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.foregroundMuted} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Our Partners</Text>
        <Ionicons name="search" size={22} color={Colors.foregroundSecondary} />
      </View>

      <Text style={styles.subtitle}>Trusted rental companies across Iraq</Text>

      <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CITIES.map((city) => (
          <Pressable
            key={city}
            style={[styles.filterPill, selectedCity === city && styles.filterPillActive]}
            onPress={() => setSelectedCity(city)}
          >
            <Text style={[styles.filterText, selectedCity === city && styles.filterTextActive]}>
              {city}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      </View>

      {loading ? (
        <View style={styles.listPadding}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.card, { opacity: 0.5 }]}>
              <View style={[styles.logoCircle, { backgroundColor: Colors.surfaceSecondary }]} />
              <View style={styles.cardContent}>
                <View style={{ width: 140, height: 16, borderRadius: 4, backgroundColor: Colors.surfaceSecondary }} />
                <View style={{ width: 180, height: 12, borderRadius: 4, backgroundColor: Colors.surfaceSecondary, marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderCompany}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color={Colors.foregroundMuted} />
              <Text style={styles.emptyText}>No partners in this city</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfacePrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  filterRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listPadding: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: Spacing.md,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  companyName: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
  ratingText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
  },
});
