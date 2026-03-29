import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { passwordApi } from '../services/api';
import { useAlert } from '../services/alert';

const COUNTRY_CODES = [
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+98', flag: '🇮🇷', name: 'Iran' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
];

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone) {
      showAlert({ title: 'Missing', message: 'Please enter your phone number', type: 'warning' });
      return;
    }

    setLoading(true);
    const digits = phone.replace(/[\s\-()]/g, '');
    const cleanPhone = digits.startsWith('0')
      ? countryCode.code + digits.slice(1)
      : countryCode.code + digits;

    try {
      await passwordApi.requestReset(cleanPhone);
      router.push({
        pathname: '/verify-otp',
        params: { phone: cleanPhone },
      });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Something went wrong', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>

        <View style={styles.iconCircle}>
          <Ionicons name="lock-open-outline" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your phone number and we'll send you a verification code to reset your password.
        </Text>

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <Pressable
            style={styles.countryCodeButton}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={styles.countryFlag}>{countryCode.flag}</Text>
            <Text style={styles.countryCodeText}>{countryCode.code}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.foregroundMuted} />
          </Pressable>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="770 123 4567"
              placeholderTextColor={Colors.foregroundMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Send Code'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to Login</Text>
        </Pressable>
      </KeyboardAvoidingView>

      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Country</Text>
              <Pressable onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </Pressable>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.countryItem, item.code === countryCode.code && styles.countryItemActive]}
                  onPress={() => { setCountryCode(item); setShowCountryPicker(false); }}
                >
                  <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemCode}>{item.code}</Text>
                  {item.code === countryCode.code && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfacePrimary },
  content: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  backRow: { paddingVertical: Spacing.md },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.tealLight,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginTop: Spacing['2xl'], marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.pageTitle, fontWeight: FontWeight.bold,
    color: Colors.foreground, textAlign: 'center', marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.body, color: Colors.foregroundSecondary,
    textAlign: 'center', marginBottom: Spacing['3xl'], lineHeight: 22,
  },
  label: {
    fontSize: FontSize.body, fontWeight: FontWeight.semibold,
    color: Colors.foreground, marginBottom: Spacing.sm,
  },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm },
  countryCodeButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  countryFlag: { fontSize: 18 },
  countryCodeText: {
    fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.foreground,
  },
  phoneInputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  input: { flex: 1, fontSize: FontSize.body, color: Colors.foreground },
  button: {
    backgroundColor: Colors.primary, borderRadius: Radius.button,
    paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing['2xl'],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontSize: FontSize.button, fontWeight: FontWeight.semibold, color: Colors.surfacePrimary,
  },
  backLink: { alignItems: 'center', marginTop: Spacing.xl },
  backLinkText: { fontSize: FontSize.body, color: Colors.primary, fontWeight: FontWeight.semibold },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerContent: {
    backgroundColor: Colors.surfacePrimary, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '50%', paddingBottom: Spacing['3xl'],
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerTitle: { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.semibold, color: Colors.foreground },
  countryItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.md,
  },
  countryItemActive: { backgroundColor: Colors.tealLight },
  countryItemName: { flex: 1, fontSize: FontSize.body, color: Colors.foreground },
  countryItemCode: { fontSize: FontSize.body, color: Colors.foregroundSecondary, fontWeight: FontWeight.semibold },
});
