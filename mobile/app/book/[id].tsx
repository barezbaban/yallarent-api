import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { useAlert } from '../../services/alert';
import { bookingsApi } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { Car, carsApi } from '../../services/api';
import { Calendar, DateData } from 'react-native-calendars';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&q=80';
const SERVICE_FEE = 10000;

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getMarkedDates(start: Date | null, end: Date | null) {
  if (!start) return {};
  const startStr = toDateString(start);
  if (!end) {
    return { [startStr]: { startingDay: true, endingDay: true, color: Colors.primary, textColor: '#fff' } };
  }

  const marks: Record<string, any> = {};
  const current = new Date(start);
  const endStr = toDateString(end);
  while (toDateString(current) <= endStr) {
    const key = toDateString(current);
    marks[key] = {
      color: key === startStr || key === endStr ? Colors.primary : Colors.tealLight,
      textColor: key === startStr || key === endStr ? '#fff' : Colors.foreground,
      startingDay: key === startStr,
      endingDay: key === endStr,
    };
    current.setDate(current.getDate() + 1);
  }
  return marks;
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingField, setSelectingField] = useState<'start' | 'end'>('start');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!id) return;
    carsApi.getById(id).then(setCar).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const days = useMemo(
    () => (startDate && endDate ? daysBetween(startDate, endDate) : 0),
    [startDate, endDate]
  );
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

  const handleDayPress = (day: DateData) => {
    const selected = new Date(day.dateString + 'T00:00:00');
    if (selectingField === 'start') {
      setStartDate(selected);
      if (endDate && selected >= endDate) {
        setEndDate(null);
      }
      setSelectingField('end');
    } else {
      if (startDate && selected <= startDate) {
        setStartDate(selected);
        setEndDate(null);
        setSelectingField('end');
      } else {
        setEndDate(selected);
        setShowCalendar(false);
        setSelectingField('start');
      }
    }
  };

  const handleConfirm = async () => {
    if (!startDate || !endDate) {
      showAlert({ title: 'Select Dates', message: 'Please select both start and end dates.', type: 'warning' });
      return;
    }

    if (!user) {
      showAlert({
        title: 'Login Required',
        message: 'Please sign up or log in to book a car.',
        type: 'confirm',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/login') },
        ],
      });
      return;
    }

    setSubmitting(true);
    try {
      const isoStart = toDateString(startDate);
      const isoEnd = toDateString(endDate);
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
      showAlert({ title: 'Booking Failed', message: err.message || 'Something went wrong', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const datesSelected = startDate && endDate;

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
          <Pressable
            style={[styles.dateBox, selectingField === 'start' && showCalendar && styles.dateBoxActive]}
            onPress={() => { setSelectingField('start'); setShowCalendar(true); }}
          >
            <Text style={styles.dateLabel}>Start Date</Text>
            <View style={styles.dateValue}>
              <Ionicons name="calendar-outline" size={16} color={startDate ? Colors.primary : Colors.foregroundMuted} />
              <Text style={[styles.dateText, !startDate && styles.datePlaceholder]}>
                {startDate ? formatDate(startDate) : 'Pick date'}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.dateBox, selectingField === 'end' && showCalendar && styles.dateBoxActive]}
            onPress={() => { setSelectingField('end'); setShowCalendar(true); }}
          >
            <Text style={styles.dateLabel}>End Date</Text>
            <View style={styles.dateValue}>
              <Ionicons name="calendar-outline" size={16} color={endDate ? Colors.primary : Colors.foregroundMuted} />
              <Text style={[styles.dateText, !endDate && styles.datePlaceholder]}>
                {endDate ? formatDate(endDate) : 'Pick date'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Price Summary */}
        {datesSelected && (
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
        )}
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        <Pressable
          style={[styles.confirmButton, (!datesSelected || submitting) && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={!datesSelected || submitting}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.surfacePrimary} />
          <Text style={styles.confirmButtonText}>
            {submitting ? 'Booking...' : datesSelected ? `Confirm Booking • ${total.toLocaleString()} IQD` : 'Select dates to book'}
          </Text>
        </Pressable>
        <View style={styles.noPayment}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.success} />
          <Text style={styles.noPaymentText}>No payment required in Phase 1</Text>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectingField === 'start' ? 'Select Start Date' : 'Select End Date'}
              </Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </Pressable>
            </View>
            <Calendar
              minDate={toDateString(tomorrow)}
              markedDates={getMarkedDates(startDate, endDate)}
              markingType="period"
              onDayPress={handleDayPress}
              theme={{
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
                textDayFontSize: 15,
                textMonthFontSize: 16,
                textMonthFontWeight: '600',
                textDayHeaderFontSize: 13,
              }}
            />
          </View>
        </View>
      </Modal>
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
  datePlaceholder: {
    color: Colors.foregroundMuted,
    fontWeight: '400' as const,
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
  // Calendar Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surfacePrimary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
});
