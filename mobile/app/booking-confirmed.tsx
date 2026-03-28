import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

function generateRef(): string {
  const date = new Date();
  const d = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `YR-${d}-${rand}`;
}

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    carName: string;
    company: string;
    startDate: string;
    endDate: string;
    days: string;
    pickup: string;
    total: string;
  }>();

  const ref = generateRef();
  const totalFormatted = Number(params.total || 0).toLocaleString();

  const details = [
    { label: 'Car', value: params.carName },
    { label: 'Company', value: params.company },
    { label: 'Dates', value: `${params.startDate} – ${params.endDate}` },
    { label: 'Duration', value: `${params.days} days` },
    { label: 'Pickup', value: params.pickup },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your car is reserved. Show this screen at pickup.
        </Text>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          {details.map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalFormatted} IQD</Text>
          </View>
        </View>

        {/* Booking Ref */}
        <View style={styles.refCard}>
          <Text style={styles.refLabel}>Booking Ref:</Text>
          <Text style={styles.refCode}>{ref}</Text>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottom}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/bookings')}
        >
          <Text style={styles.primaryButtonText}>View My Bookings</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfacePrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    padding: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
  },
  detailValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    maxWidth: '60%',
    textAlign: 'right',
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
  refCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    width: '100%',
    justifyContent: 'center',
  },
  refLabel: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
  },
  refCode: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bottom: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.button,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.surfacePrimary,
  },
  secondaryButton: {
    backgroundColor: Colors.surfacePrimary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
});
