import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { t } from '../services/i18n';
import { useLanguage } from '../services/language';

const FAQ_KEYS = [
  { q: 'help.faqQ1', a: 'help.faqA1' },
  { q: 'help.faqQ2', a: 'help.faqA2' },
  { q: 'help.faqQ3', a: 'help.faqA3' },
  { q: 'help.faqQ4', a: 'help.faqA4' },
  { q: 'help.faqQ5', a: 'help.faqA5' },
  { q: 'help.faqQ6', a: 'help.faqA6' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <View style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{q}</Text>
      <Text style={styles.faqAnswer}>{a}</Text>
    </View>
  );
}

function ContactRow({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.contactRow} onPress={onPress}>
      <View style={styles.contactIcon}>
        <Ionicons name={icon as any} size={22} color={Colors.primary} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.foregroundMuted} />
    </Pressable>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const FAQ = FAQ_KEYS.map((item) => ({ q: t(item.q), a: t(item.a) }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('help.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Section */}
        <Text style={styles.sectionTitle}>{t('help.contactUs')}</Text>
        <View style={styles.section}>
          <ContactRow
            icon="call-outline"
            label={t('help.phone')}
            value="+964 750 000 0000"
            onPress={() => Linking.openURL('tel:+9647500000000')}
          />
          <ContactRow
            icon="logo-whatsapp"
            label={t('help.whatsapp')}
            value="+964 750 000 0000"
            onPress={() => Linking.openURL('https://wa.me/9647500000000')}
          />
          <ContactRow
            icon="mail-outline"
            label={t('help.email')}
            value="support@yallarent.com"
            onPress={() => Linking.openURL('mailto:support@yallarent.com')}
          />
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>{t('help.faq')}</Text>
        <View style={styles.faqSection}>
          {FAQ.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('help.footerVersion')}</Text>
          <Text style={styles.footerText}>{t('help.footerCredit')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
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
    paddingBottom: Spacing['3xl'],
  },
  sectionTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surfacePrimary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
  contactValue: {
    fontSize: FontSize.body,
    color: Colors.foreground,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  faqSection: {
    backgroundColor: Colors.surfacePrimary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  faqItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  faqQuestion: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  faqAnswer: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
});
