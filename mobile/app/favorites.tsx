import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import CarCard from '../components/CarCard';
import { favoritesApi } from '../services/api';
import { useAuth } from '../services/auth';
import { t } from '../services/i18n';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: favorites = [], isLoading: loading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => favoritesApi.list(),
    enabled: !!user,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!loading && favorites.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart-outline" size={40} color={Colors.foregroundMuted} />
          </View>
          <Text style={styles.emptyTitle}>{t('favorites.noFavorites')}</Text>
          <Text style={styles.emptyMessage}>
            {t('favorites.noFavoritesMessage')}
          </Text>
          <Pressable style={styles.button} onPress={() => router.replace('/')}>
            <Ionicons name="search" size={18} color={Colors.surfacePrimary} />
            <Text style={styles.buttonText}>{t('favorites.browseCars')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={favorites}
          keyExtractor={(item) => item.car_id}

          renderItem={({ item }) => (
            <CarCard
              car={{
                id: item.car_id,
                make: item.make,
                model: item.model,
                year: item.year,
                price_per_day: item.price_per_day,
                city: item.city,
                image_url: item.image_url,
                company_name: item.company_name,
              } as any}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfacePrimary,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  list: {
    paddingBottom: Spacing['3xl'],
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: Radius.button,
  },
  buttonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.surfacePrimary,
  },
});
