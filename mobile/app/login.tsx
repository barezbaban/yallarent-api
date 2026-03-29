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
import { useAuth } from '../services/auth';
import { useAlert } from '../services/alert';

type Tab = 'login' | 'signup';

const COUNTRY_CODES = [
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+98', flag: '🇮🇷', name: 'Iran' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+963', flag: '🇸🇾', name: 'Syria' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const { showAlert } = useAlert();
  const [tab, setTab] = useState<Tab>('login');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone || !password) {
      showAlert({ title: 'Missing Fields', message: 'Phone and password are required', type: 'warning' });
      return;
    }
    if (tab === 'signup' && !fullName) {
      showAlert({ title: 'Missing Fields', message: 'Full name is required', type: 'warning' });
      return;
    }

    setLoading(true);
    const digits = phone.replace(/[\s\-()]/g, '');
    const cleanPhone = digits.startsWith('0')
      ? countryCode.code + digits.slice(1)
      : countryCode.code + digits;
    try {
      if (tab === 'login') {
        await login(cleanPhone, password);
      } else {
        await signup(fullName, cleanPhone, password, city);
      }
      router.back();
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
        <Text style={styles.logo}>YallaRent</Text>
        <Text style={styles.tagline}>Rent a car. Anytime. Anywhere.</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'login' && styles.tabActive]}
            onPress={() => setTab('login')}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
              Log In
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'signup' && styles.tabActive]}
            onPress={() => setTab('signup')}
          >
            <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
              Sign Up
            </Text>
          </Pressable>
        </View>

        {/* Sign Up extra fields */}
        {tab === 'signup' && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.foregroundMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.foregroundMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <Text style={styles.label}>City</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={Colors.foregroundMuted} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Erbil, Baghdad"
                placeholderTextColor={Colors.foregroundMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </>
        )}

        {/* Phone */}
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
            />
          </View>
        </View>

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.foregroundMuted} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={Colors.foregroundMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.foregroundMuted}
            />
          </Pressable>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Log In' : 'Sign Up'}
          </Text>
        </Pressable>

        {tab === 'login' && (
          <>
            <Pressable style={styles.forgotButton} onPress={() => router.push('/forgot-password')}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.linkText} onPress={() => setTab('signup')}>
                Sign Up
              </Text>
            </Text>
          </>
        )}

        {tab === 'signup' && (
          <Text style={[styles.switchText, { marginTop: Spacing.lg }]}>
            Already have an account?{' '}
            <Text style={styles.linkText} onPress={() => setTab('login')}>
              Log In
            </Text>
          </Text>
        )}
      </KeyboardAvoidingView>

      {/* Country Code Picker */}
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
                  style={[
                    styles.countryItem,
                    item.code === countryCode.code && styles.countryItemActive,
                  ]}
                  onPress={() => {
                    setCountryCode(item);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.surfacePrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
  },
  logo: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing['2xl'],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.foreground,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.surfacePrimary,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  linkText: {
    fontSize: FontSize.body,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
    marginHorizontal: Spacing.lg,
  },
  switchText: {
    fontSize: FontSize.body,
    color: Colors.foreground,
    textAlign: 'center',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: Colors.surfacePrimary,
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
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  countryItemActive: {
    backgroundColor: Colors.tealLight,
  },
  countryItemFlag: {
    fontSize: 22,
  },
  countryItemName: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.foreground,
  },
  countryItemCode: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    fontWeight: FontWeight.semibold,
  },
});
