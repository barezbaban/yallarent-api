import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { companiesApi, Company, Car } from '../../services/api';

const LOGO_COLORS = ['#0891B2', '#6366F1', '#F59E0B', '#EC4899', '#10B981', '#8B5CF6'];
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&q=80';

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function getLogoColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllCars, setShowAllCars] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [companyData, carsData] = await Promise.all([
        companiesApi.getById(id),
        companiesApi.getCars(id),
      ]);
      setCompany(companyData);
      setCars(carsData);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCall = () => {
    if (company?.phone) Linking.openURL(`tel:${company.phone}`);
  };

  if (loading || !company) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
          </Pressable>
          <Text style={styles.topBarTitle}>Partner Details</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.loadingCenter}>
          <Text style={{ color: Colors.foregroundMuted }}>{loading ? 'Loading...' : 'Partner not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const logoColor = getLogoColor(company.name);
  const displayCars = showAllCars ? cars : cars.slice(0, 2);

  const renderCarCard = ({ item }: { item: Car }) => (
    <Pressable
      style={styles.carCard}
      onPress={() => router.push(`/car/${item.id}`)}
    >
      <Image
        source={{ uri: item.image_url || PLACEHOLDER_IMAGE }}
        style={styles.carImage}
        resizeMode="cover"
      />
      <View style={styles.carInfo}>
        <View style={styles.carTitleRow}>
          <Text style={styles.carName} numberOfLines={1}>
            {item.make} {item.model} {item.year}
          </Text>
          <View style={styles.carPriceBlock}>
            <Text style={styles.carPrice}>{item.price_per_day.toLocaleString()}</Text>
            <Text style={styles.carPriceUnit}>IQD/day</Text>
          </View>
        </View>
        <View style={styles.specRow}>
          <View style={styles.specItem}>
            <Ionicons name="cog-outline" size={12} color={Colors.foregroundMuted} />
            <Text style={styles.specText}>{item.transmission === 'manual' ? 'Manual' : 'Auto'}</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="people-outline" size={12} color={Colors.foregroundMuted} />
            <Text style={styles.specText}>{item.passengers || 5} Seats</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="briefcase-outline" size={12} color={Colors.foregroundMuted} />
            <Text style={styles.specText}>{item.luggage || 2} Bags</Text>
          </View>
          {item.review_count > 0 && (
            <View style={styles.specItem}>
              <Ionicons name="star" size={12} color={Colors.amber} />
              <Text style={styles.specRating}>{item.average_rating?.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  const headerComponent = (
    <>
      {/* Hero Card */}
      <View style={styles.heroCard}>
        {company.logo_url ? (
          <Image source={{ uri: company.logo_url }} style={styles.heroLogoImage} />
        ) : (
          <View style={[styles.heroLogo, { backgroundColor: logoColor }]}>
            <Text style={styles.heroLogoLetter}>{getInitial(company.name)}</Text>
          </View>
        )}
        <Text style={styles.heroName}>{company.name}</Text>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={14} color={Colors.foregroundMuted} />
          <Text style={styles.locText}>{company.city}, Iraq</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{company.car_count}</Text>
            <Text style={styles.statLabel}>Cars</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.amber }]}>4.7</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>120+</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
        </View>
      </View>

      {/* Contact Card */}
      <View style={styles.contactCard}>
        {company.phone && (
          <Pressable style={styles.contactRow} onPress={handleCall}>
            <Ionicons name="call-outline" size={16} color={Colors.primary} />
            <Text style={styles.contactText}>{company.phone}</Text>
          </Pressable>
        )}
        {company.address ? (
          <View style={[styles.contactRow, styles.contactBorder]}>
            <Ionicons name="location-outline" size={16} color={Colors.primary} />
            <Text style={styles.contactText}>{company.address}</Text>
          </View>
        ) : null}
        <View style={[styles.contactRow, styles.contactBorder]}>
          <Ionicons name="time-outline" size={16} color={Colors.primary} />
          <Text style={styles.contactText}>Open 8:00 AM - 10:00 PM</Text>
        </View>
      </View>

      {/* Cars Section Header */}
      <View style={styles.carsHeader}>
        <Text style={styles.carsHeaderTitle}>Available Cars</Text>
        {cars.length > 2 && (
          <Pressable onPress={() => setShowAllCars(!showAllCars)}>
            <Text style={styles.seeAll}>{showAllCars ? 'Show Less' : 'See All'}</Text>
          </Pressable>
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.topBarTitle}>Partner Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={displayCars}
        renderItem={renderCarCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={headerComponent}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color={Colors.foregroundMuted} />
            <Text style={styles.emptyText}>No cars available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfacePrimary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  topBarTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    flex: 1,
  },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderRadius: Radius.card,
  },
  heroLogoImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  heroLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroLogoLetter: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  heroName: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  locText: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
  },
  statLabel: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },

  // Contact Card
  contactCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.button,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
  },
  contactBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  contactText: {
    fontSize: FontSize.body,
    color: Colors.foreground,
  },

  // Cars Section
  carsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  carsHeaderTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Car Cards
  carCard: {
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  carImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#D1D5DB',
  },
  carInfo: {
    padding: Spacing.md,
    gap: 6,
  },
  carTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  carName: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    flex: 1,
    marginRight: Spacing.sm,
  },
  carPriceBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  carPrice: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  carPriceUnit: {
    fontSize: 11,
    color: Colors.foregroundMuted,
  },
  specRow: {
    flexDirection: 'row',
    gap: 10,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  specText: {
    fontSize: 11,
    color: Colors.foregroundMuted,
  },
  specRating: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },

  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
  },
});
