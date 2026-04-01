import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { IRAQ_CITIES } from '../../constants/cities';
import { useCars } from '../../hooks/useCars';
import { carsApi, notificationsApi } from '../../services/api';
import { useAuth } from '../../services/auth';
import { t } from '../../services/i18n';
import { useLanguage } from '../../services/language';
import CarCard from '../../components/CarCard';
import CarCardSkeleton from '../../components/CarCardSkeleton';
import ErrorState from '../../components/ErrorState';

const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 22) TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

const CAR_CATEGORIES = [
  { key: '', label: 'All', icon: 'apps-outline' as const },
  { key: 'sedan', label: 'Sedan', icon: 'car-outline' as const },
  { key: 'suv', label: 'SUV', icon: 'car-sport-outline' as const },
  { key: 'pickup', label: 'Pickup', icon: 'bus-outline' as const },
  { key: 'luxury', label: 'Luxury', icon: 'diamond-outline' as const },
  { key: 'exotic', label: 'Exotic', icon: 'flame-outline' as const },
  { key: 'classic', label: 'Classic', icon: 'time-outline' as const },
  { key: 'limousine', label: 'Limousine', icon: 'train-outline' as const },
  { key: 'economy', label: 'Economy', icon: 'wallet-outline' as const },
  { key: 'van', label: 'Van', icon: 'people-outline' as const },
];

const PRICE_RANGES = [
  { key: '', label: 'Any Price', min: undefined, max: undefined },
  { key: 'under50', label: 'Under 50K', min: undefined, max: 50000 },
  { key: '50to75', label: '50K - 75K', min: 50000, max: 75000 },
  { key: '75to100', label: '75K - 100K', min: 75000, max: 100000 },
  { key: '100to150', label: '100K - 150K', min: 100000, max: 150000 },
  { key: 'over150', label: '150K+', min: 150000, max: undefined },
];

function formatTime12(t24: string): string {
  const [hStr, mStr] = t24.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

function formatDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

export default function CarsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  // Booking form state
  const [selectedCity, setSelectedCity] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [pickupDate, setPickupDate] = useState(new Date());
  const [dropoffDate, setDropoffDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  });
  const [pickupTime, setPickupTime] = useState('12:00');
  const [dropoffTime, setDropoffTime] = useState('12:00');
  const [showPickupDate, setShowPickupDate] = useState(false);
  const [showDropoffDate, setShowDropoffDate] = useState(false);
  const [showPickupTime, setShowPickupTime] = useState(false);
  const [showDropoffTime, setShowDropoffTime] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state (applied)
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [transmissionFilter, setTransmissionFilter] = useState<string | undefined>(undefined);
  const [passengersFilter, setPassengersFilter] = useState<number | undefined>(undefined);
  const [luggageFilter, setLuggageFilter] = useState<number | undefined>(undefined);

  // Filter state (pending in modal)
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const [pendingPriceKey, setPendingPriceKey] = useState('');
  const [pendingTransmission, setPendingTransmission] = useState('');
  const [pendingPassengers, setPendingPassengers] = useState('');
  const [pendingLuggage, setPendingLuggage] = useState('');
  const [filterResultCount, setFilterResultCount] = useState<number | null>(null);
  const filterCountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilterCount =
    (cityFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) +
    (transmissionFilter ? 1 : 0) + (passengersFilter ? 1 : 0) + (luggageFilter ? 1 : 0);

  const { cars, loading, loadingMore, refreshing, error, refetch, onRefresh, loadMore } = useCars({
    city: cityFilter,
    category: categoryFilter,
    min_price: minPrice,
    max_price: maxPrice,
    transmission: transmissionFilter,
    min_passengers: passengersFilter,
    min_luggage: luggageFilter,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
      if (user) {
        notificationsApi.unreadCount().then((r) => setUnreadCount(r.count)).catch(() => {});
      }
    }, [user])
  );

  const handleSearch = () => {
    setCityFilter(selectedCity || undefined);
  };

  const togglePendingCategory = (key: string) => {
    setPendingCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const openFilters = () => {
    setPendingCategories(categoryFilter ? categoryFilter.split(',') : []);
    const priceMatch = PRICE_RANGES.find(
      (p) => p.min === minPrice && p.max === maxPrice
    );
    setPendingPriceKey(priceMatch?.key || '');
    setPendingTransmission(transmissionFilter || '');
    setPendingPassengers(passengersFilter ? String(passengersFilter) : '');
    setPendingLuggage(luggageFilter ? String(luggageFilter) : '');
    setFilterResultCount(null);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setCategoryFilter(pendingCategories.length > 0 ? pendingCategories.join(',') : undefined);
    const price = PRICE_RANGES.find((p) => p.key === pendingPriceKey);
    setMinPrice(price?.min);
    setMaxPrice(price?.max);
    setTransmissionFilter(pendingTransmission || undefined);
    setPassengersFilter(pendingPassengers ? Number(pendingPassengers) : undefined);
    setLuggageFilter(pendingLuggage ? Number(pendingLuggage) : undefined);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPendingCategories([]);
    setPendingPriceKey('');
    setPendingTransmission('');
    setPendingPassengers('');
    setPendingLuggage('');
  };

  // Preview result count when pending filters change
  useEffect(() => {
    if (!showFilters) return;
    if (filterCountTimer.current) clearTimeout(filterCountTimer.current);
    filterCountTimer.current = setTimeout(async () => {
      try {
        const price = PRICE_RANGES.find((p) => p.key === pendingPriceKey);
        const result = await carsApi.list({
          city: cityFilter,
          category: pendingCategories.length > 0 ? pendingCategories.join(',') : undefined,
          min_price: price?.min,
          max_price: price?.max,
          transmission: pendingTransmission || undefined,
          min_passengers: pendingPassengers ? Number(pendingPassengers) : undefined,
          min_luggage: pendingLuggage ? Number(pendingLuggage) : undefined,
          page: 1,
          limit: 1,
        });
        setFilterResultCount(result.total);
      } catch {
        setFilterResultCount(null);
      }
    }, 300);
    return () => { if (filterCountTimer.current) clearTimeout(filterCountTimer.current); };
  }, [showFilters, pendingCategories, pendingPriceKey, pendingTransmission, pendingPassengers, pendingLuggage, cityFilter]);

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={loading ? [] : cars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <CarCard car={item} />
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ paddingVertical: Spacing.lg }} color={Colors.primary} /> : null
        }
        ListHeaderComponent={
          <>
            {/* Hero Header */}
            <View style={styles.heroSection}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.heroTitle}>{t('home.logo')}</Text>
                  <Text style={styles.heroSubtitle}>Find your perfect ride.</Text>
                </View>
                <Pressable onPress={() => router.push('/notifications')} style={styles.bellBtn}>
                  <Ionicons name="notifications-outline" size={26} color="#FFF" />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Booking Form Card */}
            <View style={styles.formCard}>
              {/* City */}
              <Pressable style={styles.formField} onPress={() => setShowCityPicker(true)}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <View style={styles.formFieldContent}>
                  <Text style={styles.formFieldLabel}>City</Text>
                  <Text style={styles.formFieldValue}>
                    {selectedCity || 'All Cities'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={Colors.foregroundMuted} />
              </Pressable>

              <View style={styles.formDivider} />

              {/* Pickup */}
              <View style={styles.dateTimeRow}>
                <Pressable style={styles.dateField} onPress={() => setShowPickupDate(true)}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  <View style={styles.formFieldContent}>
                    <Text style={styles.formFieldLabel}>Pickup</Text>
                    <Text style={styles.formFieldValue}>{formatDate(pickupDate)}</Text>
                  </View>
                </Pressable>
                <Pressable style={styles.timeField} onPress={() => setShowPickupTime(true)}>
                  <Text style={styles.timeText}>{formatTime12(pickupTime)}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.foregroundMuted} />
                </Pressable>
              </View>

              <View style={styles.formDivider} />

              {/* Dropoff */}
              <View style={styles.dateTimeRow}>
                <Pressable style={styles.dateField} onPress={() => setShowDropoffDate(true)}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  <View style={styles.formFieldContent}>
                    <Text style={styles.formFieldLabel}>Drop-off</Text>
                    <Text style={styles.formFieldValue}>{formatDate(dropoffDate)}</Text>
                  </View>
                </Pressable>
                <Pressable style={styles.timeField} onPress={() => setShowDropoffTime(true)}>
                  <Text style={styles.timeText}>{formatTime12(dropoffTime)}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.foregroundMuted} />
                </Pressable>
              </View>

              {/* Search Button */}
              <Pressable style={styles.searchButton} onPress={handleSearch}>
                <Ionicons name="search" size={20} color="#FFF" />
                <Text style={styles.searchButtonText}>Search Cars</Text>
              </Pressable>
            </View>

            {/* Filter Bar */}
            <View style={styles.filterBar}>
              <Pressable style={styles.filterButton} onPress={openFilters}>
                <Ionicons name="options-outline" size={18} color={Colors.foreground} />
                <Text style={styles.filterButtonText}>Filters</Text>
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </Pressable>

              {/* Quick category chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                {CAR_CATEGORIES.map((cat) => {
                  const activeCats = categoryFilter ? categoryFilter.split(',') : [];
                  const active = cat.key === '' ? !categoryFilter : activeCats.includes(cat.key);
                  return (
                    <Pressable
                      key={cat.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        if (cat.key === '') {
                          setCategoryFilter(undefined);
                        } else {
                          const cats = categoryFilter ? categoryFilter.split(',') : [];
                          const updated = cats.includes(cat.key)
                            ? cats.filter((c) => c !== cat.key)
                            : [...cats, cat.key];
                          setCategoryFilter(updated.length > 0 ? updated.join(',') : undefined);
                        }
                      }}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={14}
                        color={active ? '#FFF' : Colors.foregroundSecondary}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Results header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.availableCars')}</Text>
              <Text style={styles.count}>
                {loading ? '...' : `${cars.length} ${t('home.cars')}`}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingHorizontal: Spacing.lg }}>
              <CarCardSkeleton />
              <CarCardSkeleton />
              <CarCardSkeleton />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={48} color={Colors.foregroundMuted} />
              <Text style={styles.emptyText}>{t('home.noCars')}</Text>
            </View>
          )
        }
      />

      {/* ===== MODALS ===== */}

      {/* City Picker */}
      <Modal visible={showCityPicker} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select City</Text>
              <Pressable onPress={() => setShowCityPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </Pressable>
            </View>
            <Pressable
              style={[styles.cityRow, !selectedCity && styles.cityRowActive]}
              onPress={() => { setSelectedCity(''); setShowCityPicker(false); }}
            >
              <View style={[styles.cityIcon, !selectedCity && styles.cityIconActive]}>
                <Ionicons name="globe" size={18} color={!selectedCity ? '#FFF' : Colors.primary} />
              </View>
              <Text style={[styles.cityName, !selectedCity && styles.cityNameActive]}>All Cities</Text>
              {!selectedCity && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
            </Pressable>
            <FlatList
              data={IRAQ_CITIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = item === selectedCity;
                return (
                  <Pressable
                    style={[styles.cityRow, selected && styles.cityRowActive]}
                    onPress={() => { setSelectedCity(item); setShowCityPicker(false); }}
                  >
                    <View style={[styles.cityIcon, selected && styles.cityIconActive]}>
                      <Ionicons name="location" size={18} color={selected ? '#FFF' : Colors.primary} />
                    </View>
                    <Text style={[styles.cityName, selected && styles.cityNameActive]}>{item}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Pickup Date Calendar */}
      <Modal visible={showPickupDate} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Pickup Date</Text>
              <Pressable onPress={() => setShowPickupDate(false)}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </Pressable>
            </View>
            <Calendar
              minDate={new Date().toISOString().split('T')[0]}
              markedDates={{
                [pickupDate.toISOString().split('T')[0]]: { selected: true, selectedColor: Colors.primary },
              }}
              onDayPress={(day: { dateString: string }) => {
                const selected = new Date(day.dateString + 'T00:00:00');
                setPickupDate(selected);
                if (selected >= dropoffDate) {
                  const next = new Date(selected);
                  next.setDate(next.getDate() + 1);
                  setDropoffDate(next);
                }
                setShowPickupDate(false);
              }}
              theme={{
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
                selectedDayBackgroundColor: Colors.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Dropoff Date Calendar */}
      <Modal visible={showDropoffDate} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Drop-off Date</Text>
              <Pressable onPress={() => setShowDropoffDate(false)}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </Pressable>
            </View>
            <Calendar
              minDate={(() => { const d = new Date(pickupDate); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
              markedDates={{
                [dropoffDate.toISOString().split('T')[0]]: { selected: true, selectedColor: Colors.primary },
              }}
              onDayPress={(day: { dateString: string }) => {
                setDropoffDate(new Date(day.dateString + 'T00:00:00'));
                setShowDropoffDate(false);
              }}
              theme={{
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
                selectedDayBackgroundColor: Colors.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Time Picker Modals */}
      {[
        { visible: showPickupTime, setVisible: setShowPickupTime, title: 'Pickup Time', value: pickupTime, setValue: setPickupTime },
        { visible: showDropoffTime, setVisible: setShowDropoffTime, title: 'Drop-off Time', value: dropoffTime, setValue: setDropoffTime },
      ].map((tp) => (
        <Modal key={tp.title} visible={tp.visible} animationType="slide" transparent>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{tp.title}</Text>
                <Pressable onPress={() => tp.setVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.foreground} />
                </Pressable>
              </View>
              <FlatList
                data={TIME_SLOTS}
                keyExtractor={(item) => `${tp.title}-${item}`}
                renderItem={({ item }) => {
                  const selected = item === tp.value;
                  return (
                    <Pressable
                      style={[styles.listRow, selected && styles.listRowActive]}
                      onPress={() => { tp.setValue(item); tp.setVisible(false); }}
                    >
                      <Ionicons name="time-outline" size={18} color={selected ? Colors.primary : Colors.foregroundMuted} />
                      <Text style={[styles.listRowText, selected && styles.listRowTextActive]}>
                        {formatTime12(item)}
                      </Text>
                      {selected && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      ))}

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Vehicle Filters</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </Pressable>
            </View>

            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              {/* Vehicle Type - multi-select 2-column grid */}
              <Text style={styles.filterSectionTitle}>Vehicle Type</Text>
              <View style={styles.vehicleGrid}>
                {CAR_CATEGORIES.filter((c) => c.key !== '').map((cat) => {
                  const active = pendingCategories.includes(cat.key);
                  return (
                    <Pressable
                      key={cat.key}
                      style={[styles.vehicleGridItem, active && styles.vehicleGridItemActive]}
                      onPress={() => togglePendingCategory(cat.key)}
                    >
                      {active && (
                        <View style={styles.vehicleCheckmark}>
                          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                        </View>
                      )}
                      <Ionicons
                        name={cat.icon}
                        size={28}
                        color={active ? Colors.primary : Colors.foregroundMuted}
                      />
                      <Text style={[styles.vehicleGridLabel, active && styles.vehicleGridLabelActive]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Transmission */}
              <Text style={styles.filterSectionTitle}>Transmission</Text>
              <View style={styles.chipRow}>
                {[
                  { key: '', label: 'Any' },
                  { key: 'manual', label: 'Manual' },
                  { key: 'automatic', label: 'Automatic' },
                ].map((item) => {
                  const active = pendingTransmission === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setPendingTransmission(item.key)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Price Range */}
              <Text style={styles.filterSectionTitle}>Price Range (IQD/day)</Text>
              <View style={styles.chipRow}>
                {PRICE_RANGES.map((price) => {
                  const active = pendingPriceKey === price.key;
                  return (
                    <Pressable
                      key={price.key}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setPendingPriceKey(price.key)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {price.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Passengers */}
              <Text style={styles.filterSectionTitle}>Passengers</Text>
              <View style={styles.chipRow}>
                {[
                  { key: '', label: 'Any' },
                  { key: '2', label: '2+' },
                  { key: '4', label: '4+' },
                  { key: '6', label: '6+' },
                  { key: '8', label: '8+' },
                ].map((item) => {
                  const active = pendingPassengers === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setPendingPassengers(item.key)}
                    >
                      <Ionicons
                        name="person"
                        size={14}
                        color={active ? '#FFF' : Colors.foregroundMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Luggage */}
              <Text style={styles.filterSectionTitle}>Luggage</Text>
              <View style={styles.chipRow}>
                {[
                  { key: '', label: 'Any' },
                  { key: '2', label: '2+' },
                  { key: '4', label: '4+' },
                  { key: '6', label: '6+' },
                  { key: '8', label: '8+' },
                ].map((item) => {
                  const active = pendingLuggage === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setPendingLuggage(item.key)}
                    >
                      <Ionicons
                        name="briefcase"
                        size={14}
                        color={active ? '#FFF' : Colors.foregroundMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ height: Spacing.xl }} />
            </ScrollView>

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <Pressable style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>
                  {filterResultCount !== null
                    ? `View ${filterResultCount} Result${filterResultCount !== 1 ? 's' : ''}`
                    : 'Apply Filters'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  list: {
    paddingBottom: Spacing['3xl'],
  },
  // Hero
  heroSection: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: '#FFF',
  },
  heroSubtitle: {
    fontSize: FontSize.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  bellBtn: {
    padding: Spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  // Form Card
  formCard: {
    backgroundColor: '#FFF',
    marginHorizontal: Spacing.lg,
    marginTop: -30,
    borderRadius: Radius.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  formField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  formFieldContent: {
    flex: 1,
  },
  formFieldLabel: {
    fontSize: 12,
    color: Colors.foregroundMuted,
    marginBottom: 2,
  },
  formFieldValue: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  formDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  timeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: Spacing.lg,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingVertical: 14,
  },
  timeText: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.button,
    gap: Spacing.sm,
  },
  searchButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },
  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  filterBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  chipScroll: {
    gap: Spacing.xs,
    paddingRight: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  count: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
  },
  empty: {
    paddingVertical: Spacing['3xl'] * 2,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
  },
  // Shared picker styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: Spacing['3xl'],
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  // City picker rows
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityRowActive: {
    backgroundColor: Colors.tealLight,
  },
  cityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityIconActive: {
    backgroundColor: Colors.primary,
  },
  cityName: {
    flex: 1,
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  cityNameActive: {
    color: Colors.primary,
  },
  // List rows (time, price)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listRowActive: {
    backgroundColor: Colors.tealLight,
  },
  listRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  listRowTextActive: {
    color: Colors.primary,
  },
  // Filter modal
  filterModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  filterScroll: {
    paddingBottom: Spacing.lg,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  // Vehicle type 2-column grid
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  vehicleGridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.sm,
    position: 'relative',
  },
  vehicleGridItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.tealLight,
  },
  vehicleCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  vehicleGridLabel: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundSecondary,
  },
  vehicleGridLabelActive: {
    color: Colors.primary,
  },
  // Chip rows for transmission, price, passengers, luggage
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFF',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  clearButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.button,
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },
});
