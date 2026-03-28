import { useState } from 'react';
import {
  KeyboardAvoidingView,
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

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const { showAlert } = useAlert();
  const [tab, setTab] = useState<Tab>('login');
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
    try {
      if (tab === 'login') {
        await login(phone, password);
      } else {
        await signup(fullName, phone, password, city);
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
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color={Colors.foregroundMuted} />
          <TextInput
            style={styles.input}
            placeholder="0770 123 4567"
            placeholderTextColor={Colors.foregroundMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
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
            <Pressable style={styles.forgotButton}>
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
});
