import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

interface BookingCardProps {
  carName: string;
  company: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  onPress?: () => void;
  onCancel?: () => void;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: '#FEF3C7', color: '#D97706' },
  confirmed: { label: 'Upcoming', bg: Colors.tealLight, color: Colors.primary },
  completed: { label: 'Completed', bg: Colors.surfaceSecondary, color: Colors.foregroundSecondary },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: Colors.error },
} as const;

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=200&q=80';

export default function BookingCard({
  carName,
  company,
  imageUrl,
  startDate,
  endDate,
  totalPrice,
  status,
  onPress,
  onCancel,
}: BookingCardProps) {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Image
          source={{ uri: imageUrl || PLACEHOLDER_IMAGE }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.carName} numberOfLines={1}>{carName}</Text>
          <Text style={styles.company}>{company}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.badgeText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.foregroundMuted} />
          <Text style={styles.dateText}>{startDate} – {endDate}</Text>
        </View>
        <Text style={styles.price}>{totalPrice.toLocaleString()} IQD</Text>
      </View>
      {(status === 'pending' || status === 'confirmed') && onCancel && (
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: Radius.tag,
    backgroundColor: Colors.surfaceSecondary,
  },
  info: {
    flex: 1,
  },
  carName: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  company: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
  },
  price: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
});
