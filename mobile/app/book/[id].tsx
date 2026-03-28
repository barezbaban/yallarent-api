import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { bookingsApi } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { Car, carsApi } from '../../services/api';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&q=80';
const SERVICE_FEE = 10000;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const [startDate] = useState(addDays(today, 1));
  const [endDate] = useState(addDays(today, 4));

  useEffect(() => {
    if (!id) return;
    carsApi.getById(id).then(setCar).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const subtotal = car ? car.price_per_day * days : 0;
  const total = subtotal + SERVICE_FEE;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!car) return null;

  const handleConfirm = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign up or log in to book a car.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => router.push('/login') },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      const isoStart = startDate.toISOString().split('T')[0];
      const isoEnd = endDate.toISOString().split('T')[0];
      await bookingsApi.create({ carId: car.id, startDate: isoStart, endDate: isoEnd });
      router.replace({
        pathname: '/booking-confirmed',
        params: {
          carName: `${car.make} ${car.model} ${car.year}`,
          company: car.company_name,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          days: String(days),
          pickup: `${car.company_name}, ${car.city}`,
          total: String(total),
        },
      });
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Book This Car</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Car Summary */}
        <View style={styles.carCard}>
          <Image
            source={{ uri: car.image_url || PLACEHOLDER_IMAGE }}
            style={styles.carImage}
            resizeMode="cover"
          />
          <View style={styles.carInfo}>
            <Text style={styles.carName}>
              {car.make} {car.model} {car.year}
            </Text>
            <Text style={styles.carCompany}>
              {car.company_name} • {car.city}
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <Text style={styles.sectionTitle}>Select Dates</Text>
        <View style={styles.dateRow}>
          <View style={[styles.dateBox, styles.dateBoxActive]}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <View style={styles.dateValue}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            </View>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>End Date</Text>
            <View style={styles.dateValue}>
              <Ionicons name="calendar-outline" size={16} color={Colors.foregroundMuted} />
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            </View>
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {car.price_per_day.toLocaleString()} IQD × {days} days
            </Text>
            <Text style={styles.priceValue}>{subtotal.toLocaleString()} IQD</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service fee</Text>
            <Text style={styles.priceValue}>{SERVICE_FEE.toLocaleString()} IQD</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} IQD</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        <Pressable
          style={[styles.confirmButton, submitting && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.surfacePrimary} />
          <Text style={styles.confirmButtonText}>
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </Text>
        </Pressable>
        <View style={styles.noPayment}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.success} />
          <Text style={styles.noPaymentText}>No payment required in Phase 1</Text>
        </View>
      </View>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  carCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  carImage: {
    width: 70,
    height: 50,
    borderRadius: Radius.tag,
    backgroundColor: Colors.border,
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  carCompany: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    padding: Spacing.md,
  },
  dateBoxActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dateLabel: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginBottom: Spacing.xs,
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  priceCard: {
    marginTop: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    padding: Spacing.lg,
  },
  priceCardTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  priceLabel: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
  },
  priceValue: {
    fontSize: FontSize.body,
    color: Colors.foreground,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  totalLabel: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
  },
  totalValue: {
    fontSize: FontSize.priceDisplay,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  bottom: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.button,
  },
  confirmButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.surfacePrimary,
  },
  noPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  noPaymentText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
  },
});
