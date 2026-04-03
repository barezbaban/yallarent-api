import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import FilterChips from '../../components/FilterChips';
import BookingCard from '../../components/BookingCard';
import { bookingsApi, Booking } from '../../services/api';
import { useAuth } from '../../services/auth';
import { useAlert } from '../../services/alert';
import { t } from '../../services/i18n';
import { useLanguage } from '../../services/language';

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const TABS = [t('bookings.all'), t('bookings.upcoming'), t('bookings.past')];
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const { data: bookings = [], isLoading: loading, refetch: fetchBookings } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => bookingsApi.list(),
    enabled: !!user,
  });

  const filtered = useMemo(() => bookings.filter((b) => {
    if (activeTab === t('bookings.all')) return true;
    if (activeTab === t('bookings.upcoming')) return b.status === 'pending' || b.status === 'confirmed';
    if (activeTab === t('bookings.past')) return b.status === 'completed' || b.status === 'cancelled';
    return true;
  }), [bookings, activeTab]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{t('bookings.title')}</Text>
      <View style={styles.filterRow}>
        <FilterChips filters={TABS} selected={activeTab} onSelect={setActiveTab} />
      </View>

      {!loading && filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar-outline" size={40} color={Colors.foregroundMuted} />
          </View>
          <Text style={styles.emptyTitle}>{t('bookings.empty')}</Text>
          <Text style={styles.emptyMessage}>
            {t('bookings.emptyMessage')}
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="search" size={18} color={Colors.surfacePrimary} />
            <Text style={styles.buttonText}>{t('bookings.browseCars')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}

          renderItem={({ item }) => (
            <BookingCard
              carName={item.make && item.model ? `${item.make} ${item.model} ${item.year}` : `Booking`}
              company={item.company_name || ''}
              imageUrl={item.image_url || undefined}
              startDate={new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              endDate={new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              totalPrice={item.total_price}
              status={item.status}
              hasReview={item.has_review}
              onReview={() => router.push(`/write-review?bookingId=${item.id}&carName=${encodeURIComponent(`${item.make} ${item.model} ${item.year}`)}`)}
              onCancel={() => {
                showAlert({
                  title: t('bookings.cancelConfirm'),
                  message: t('bookings.cancelMessage'),
                  type: 'confirm',
                  buttons: [
                    { text: t('bookings.cancelNo'), style: 'cancel' },
                    {
                      text: t('bookings.cancelYes'),
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await bookingsApi.cancel(item.id);
                          queryClient.invalidateQueries({ queryKey: ['bookings'] });
                        } catch {
                          showAlert({ title: t('common.error'), message: t('bookings.cancelFailed'), type: 'error' });
                        }
                      },
                    },
                  ],
                });
              }}
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
  title: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    marginBottom: Spacing.sm,
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
