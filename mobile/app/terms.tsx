import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing } from '../constants/theme';
import { t } from '../services/i18n';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('terms.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>{t('terms.lastUpdated')}</Text>

        <Text style={styles.sectionTitle}>{t('terms.s1Title')}</Text>
        <Text style={styles.body}>{t('terms.s1Body')}</Text>

        <Text style={styles.sectionTitle}>{t('terms.s2Title')}</Text>
        <Text style={styles.body}>{t('terms.s2Body')}</Text>

        <Text style={styles.sectionTitle}>{t('terms.s3Title')}</Text>
        <Text style={styles.body}>{t('terms.s3Body')}</Text>

        <Text style={styles.sectionTitle}>{t('terms.s4Title')}</Text>
        <Text style={styles.body}>{t('terms.s4Body')}</Text>

        <Text style={styles.sectionTitle}>{t('terms.s5Title')}</Text>
        <Text style={styles.body}>{t('terms.s5Body')}</Text>

        <Text style={styles.sectionTitle}>{t('terms.s6Title')}</Text>
        <Text style={styles.body}>{t('terms.s6Body')}</Text>

        <Text style={styles.sectionTitle}>{t('terms.s7Title')}</Text>
        <Text style={styles.body}>{t('terms.s7Body')}</Text>

        <Text style={styles.sectionTitle}>{t('terms.s8Title')}</Text>
        <Text style={styles.body}>{t('terms.s8Body')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfacePrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfacePrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  updated: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    lineHeight: 22,
  },
});
