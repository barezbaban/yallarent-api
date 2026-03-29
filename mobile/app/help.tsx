import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

const FAQ = [
  {
    q: 'How do I book a car?',
    a: 'Browse available cars on the home screen, tap on one you like, select your dates, times, and pickup/dropoff locations, then confirm your booking.',
  },
  {
    q: 'How do I cancel a booking?',
    a: 'Go to the Bookings tab, find the booking you want to cancel, and tap the Cancel button. Cancellations are subject to the rental company\'s policy.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Payment is handled directly with the rental company. Most companies accept cash (IQD) at pickup. Contact the company for other payment options.',
  },
  {
    q: 'How do I contact the rental company?',
    a: 'On the car detail page, you\'ll find the company name and contact information. You can call them directly for any questions.',
  },
  {
    q: 'Can I modify my booking?',
    a: 'Currently, you need to cancel the existing booking and create a new one with the updated details. We\'re working on adding direct modification.',
  },
  {
    q: 'What if the car is not as described?',
    a: 'Contact the rental company directly. If the issue is not resolved, reach out to our support team and we\'ll help mediate.',
  },
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Section */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.section}>
          <ContactRow
            icon="call-outline"
            label="Phone"
            value="+964 750 000 0000"
            onPress={() => Linking.openURL('tel:+9647500000000')}
          />
          <ContactRow
            icon="logo-whatsapp"
            label="WhatsApp"
            value="+964 750 000 0000"
            onPress={() => Linking.openURL('https://wa.me/9647500000000')}
          />
          <ContactRow
            icon="mail-outline"
            label="Email"
            value="support@yallarent.com"
            onPress={() => Linking.openURL('mailto:support@yallarent.com')}
          />
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqSection}>
          {FAQ.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>YallaRent v1.1.0</Text>
          <Text style={styles.footerText}>Made with love in Iraq</Text>
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
