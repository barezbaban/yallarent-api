import { useRef, useState, useCallback } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../services/auth';
import { t } from '../services/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_HEIGHT = 420;

interface Slide {
  image: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
}

const slides: Slide[] = [
  {
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80',
    icon: 'car-sport',
    titleKey: 'welcome.slide1Title',
    subtitleKey: 'welcome.slide1Subtitle',
  },
  {
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    icon: 'shield-checkmark',
    titleKey: 'welcome.slide2Title',
    subtitleKey: 'welcome.slide2Subtitle',
  },
  {
    image: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80',
    icon: 'pricetag',
    titleKey: 'welcome.slide3Title',
    subtitleKey: 'welcome.slide3Subtitle',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { enterGuestMode } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Ionicons name="car" size={24} color={Colors.surfacePrimary} />
        </View>
        <Text style={styles.logoText}>{t('welcome.logo')}</Text>
      </View>

      {/* Marketing Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(_, i) => String(i)}
        style={styles.carousel}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, alignItems: 'center', paddingHorizontal: 32 }}>
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletIcon}>
                    <Ionicons name={item.icon} size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.bulletText}>
                    <Text style={styles.bulletTitle}>{t(item.titleKey)}</Text>
                    <Text style={styles.bulletSubtitle}>{t(item.subtitleKey)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Promo Card */}
      <View style={styles.promoCard}>
        <Text style={styles.promoQuestion}>{t('welcome.notMember')}</Text>
        <Text style={styles.promoTitle}>{t('welcome.joinTitle')}</Text>
        <View style={styles.promoBullets}>
          <View style={styles.promoBulletRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            <Text style={styles.promoBulletText}>{t('welcome.benefit1')}</Text>
          </View>
          <View style={styles.promoBulletRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            <Text style={styles.promoBulletText}>{t('welcome.benefit2')}</Text>
          </View>
          <View style={styles.promoBulletRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            <Text style={styles.promoBulletText}>{t('welcome.benefit3')}</Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.bottom}>
        <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>{t('welcome.logIn')}</Text>
        </Pressable>
        <Pressable onPress={async () => {
          await enterGuestMode();
          router.replace('/');
        }}>
          <Text style={styles.guestText}>{t('welcome.continueGuest')}</Text>
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  carousel: {
    flexGrow: 0,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: Radius.card,
    backgroundColor: Colors.surfacePrimary,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: CARD_HEIGHT * 0.7,
  },
  cardContent: {
    padding: Spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  bulletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  bulletSubtitle: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  promoCard: {
    marginHorizontal: 32,
    marginTop: Spacing.xl,
    backgroundColor: Colors.tealLight,
    borderRadius: Radius.card,
    padding: Spacing.lg,
  },
  promoQuestion: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  promoBullets: {
    gap: Spacing.sm,
  },
  promoBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  promoBulletText: {
    fontSize: FontSize.body,
    color: Colors.foreground,
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: Spacing.xl,
    marginTop: 'auto',
    gap: Spacing.lg,
  },
  loginButton: {
    backgroundColor: Colors.darkNavy,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.bold,
    color: Colors.surfacePrimary,
  },
  guestText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    textAlign: 'center',
  },
});
