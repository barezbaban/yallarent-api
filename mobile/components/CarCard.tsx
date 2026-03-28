import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { Car } from '../services/api';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&q=80';

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/car/${car.id}`)}
    >
      <Image
        source={{ uri: car.image_url || PLACEHOLDER_IMAGE }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {car.make} {car.model} {car.year}
          </Text>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>
              {car.price_per_day.toLocaleString()}
            </Text>
            <Text style={styles.priceUnit}>IQD/day</Text>
          </View>
        </View>
        <Text style={styles.company}>{car.company_name}</Text>
        <View style={styles.tags}>
          <View style={[styles.tag, styles.cityTag]}>
            <Ionicons name="location" size={12} color={Colors.primary} />
            <Text style={styles.cityTagText}>{car.city}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Automatic</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>5 seats</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.surfaceSecondary,
  },
  content: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    flex: 1,
    marginRight: Spacing.sm,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: FontSize.priceDisplay,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
  company: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.tag,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
  },
  cityTag: {
    backgroundColor: Colors.tealLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityTagText: {
    fontSize: FontSize.caption,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
