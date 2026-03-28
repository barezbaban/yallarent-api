import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { Car, carsApi } from '../../services/api';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80';

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    carsApi.getById(id).then(setCar).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!car) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Car not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const specs = [
    { icon: 'sync-outline' as const, label: 'Automatic' },
    { icon: 'people-outline' as const, label: '5 Seats' },
    { icon: 'water-outline' as const, label: 'Petrol' },
    { icon: 'location-outline' as const, label: car.city },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: car.image_url || PLACEHOLDER_IMAGE }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <SafeAreaView style={styles.imageOverlay} edges={['top']}>
            <Pressable style={styles.roundButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
            </Pressable>
            <Pressable style={styles.roundButton}>
              <Ionicons name="heart-outline" size={22} color={Colors.foreground} />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Title + Price */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {car.make} {car.model} {car.year}
              </Text>
              <View style={styles.companyRow}>
                <Ionicons name="business-outline" size={14} color={Colors.foregroundSecondary} />
                <Text style={styles.company}>{car.company_name}</Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.price}>{car.price_per_day.toLocaleString()}</Text>
              <Text style={styles.priceUnit}>IQD/day</Text>
            </View>
          </View>

          {/* Spec Chips */}
          <View style={styles.specs}>
            {specs.map((spec) => (
              <View key={spec.label} style={styles.specChip}>
                <Ionicons name={spec.icon} size={20} color={Colors.foregroundSecondary} />
                <Text style={styles.specText}>{spec.label}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {car.description && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{car.description}</Text>
            </>
          )}

          {/* Pickup Location */}
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <View>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              <Text style={styles.locationValue}>{car.company_name}, {car.city}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>
            {car.price_per_day.toLocaleString()} IQD
          </Text>
          <Text style={styles.bottomPriceUnit}>per day</Text>
        </View>
        <Pressable
          style={styles.bookButton}
          onPress={() => router.push(`/book/${car.id}`)}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.surfacePrimary} />
          <Text style={styles.bookButtonText}>Book Now</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfacePrimary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
  },
  errorText: {
    fontSize: FontSize.sectionHeader,
    color: Colors.foreground,
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: Radius.button,
  },
  backButtonText: {
    color: Colors.surfacePrimary,
    fontWeight: FontWeight.semibold,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.surfaceSecondary,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  company: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: FontSize.priceLarge,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
  specs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  specChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.button,
    gap: Spacing.xs,
  },
  specText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    lineHeight: 22,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.card,
  },
  locationLabel: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
  locationValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.surfacePrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomPrice: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
  },
  bottomPriceUnit: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.lg,
    borderRadius: Radius.button,
  },
  bookButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.surfacePrimary,
  },
});
