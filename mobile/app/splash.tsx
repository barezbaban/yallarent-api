import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Colors, FontWeight, Spacing } from '../constants/theme';
import { t } from '../services/i18n';

const ONBOARDING_KEY = 'onboarding_complete';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const done = await SecureStore.getItemAsync(ONBOARDING_KEY);
      if (done) {
        router.replace('/');
      } else {
        router.replace('/onboarding');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="car" size={44} color={Colors.surfacePrimary} />
      </View>
      <Text style={styles.title}>{t('splash.title')}</Text>
      <Text style={styles.tagline}>{t('splash.tagline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.surfacePrimary,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: 16,
    color: Colors.foregroundMuted,
  },
});
