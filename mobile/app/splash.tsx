import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontWeight, Spacing } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="car" size={44} color={Colors.surfacePrimary} />
      </View>
      <Text style={styles.title}>YallaRent</Text>
      <Text style={styles.tagline}>Rent a car. Anytime. Anywhere.</Text>
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
