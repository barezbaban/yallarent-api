import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import FilterChips from '../../components/FilterChips';
import BookingCard from '../../components/BookingCard';
import { bookingsApi, Booking } from '../../services/api';
import { useAuth } from '../../services/auth';
import { useAlert } from '../../services/alert';

const TABS = ['All', 'Upcoming', 'Past'];

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState('All');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await bookingsApi.list();
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Upcoming') return b.status === 'pending' || b.status === 'confirmed';
    if (activeTab === 'Past') return b.status === 'completed' || b.status === 'cancelled';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>My Bookings</Text>
      <View style={styles.filterRow}>
        <FilterChips filters={TABS} selected={activeTab} onSelect={setActiveTab} />
      </View>

      {!loading && filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar-outline" size={40} color={Colors.foregroundMuted} />
          </View>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyMessage}>
            When you book a car, it will appear here. Browse available cars to get started.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="search" size={18} color={Colors.surfacePrimary} />
            <Text style={styles.buttonText}>Browse Cars</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
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
              onCancel={() => {
                showAlert({
                  title: 'Cancel Booking',
                  message: 'Are you sure you want to cancel this booking?',
                  type: 'confirm',
                  buttons: [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes, Cancel',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await bookingsApi.cancel(item.id);
                          fetchBookings();
                        } catch {
                          showAlert({ title: 'Error', message: 'Failed to cancel booking', type: 'error' });
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
