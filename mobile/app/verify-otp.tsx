import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { passwordApi } from '../services/api';
import { useAuth } from '../services/auth';
import { useAlert } from '../services/alert';

const CODE_LENGTH = 6;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { verifySignup } = useAuth();
  const { showAlert } = useAlert();
  const { phone, flow, returnTo } = useLocalSearchParams<{ phone: string; flow?: string; returnTo?: string }>();
  const isSignupFlow = flow === 'signup';
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length !== CODE_LENGTH) {
      showAlert({ title: 'Incomplete', message: 'Please enter the full 6-digit code', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      if (isSignupFlow) {
        await verifySignup(phone!, otp);
        router.replace(returnTo || '/');
      } else {
        const { resetToken } = await passwordApi.verifyOtp(phone!, otp);
        router.push({
          pathname: '/reset-password',
          params: { phone: phone!, resetToken },
        });
      }
    } catch (err: any) {
      showAlert({ title: 'Invalid Code', message: err.message || 'The code you entered is incorrect', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await passwordApi.requestReset(phone!);
      showAlert({ title: 'Code Sent', message: 'A new verification code has been sent', type: 'success' });
    } catch {}
  };

  const maskedPhone = phone
    ? phone.slice(0, 5) + '****' + phone.slice(-2)
    : '';

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
          <Ionicons name="chatbubble-outline" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputs.current[i] = ref; }}
              style={[styles.codeBox, digit ? styles.codeBoxFilled : null]}
              value={digit}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              autoFocus={i === 0}
            />
          ))}
        </View>

        <Text style={styles.hint}>
          Default code: <Text style={styles.hintCode}>1 2 3 4 5 6</Text>
        </Text>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Text>
        </Pressable>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <Pressable onPress={handleResend}>
            <Text style={styles.resendLink}>Resend</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  phoneHighlight: {
    fontWeight: FontWeight.semibold, color: Colors.foreground,
  },
  codeRow: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  codeBox: {
    width: 48, height: 56, borderRadius: Radius.button,
    borderWidth: 2, borderColor: Colors.border,
    textAlign: 'center', fontSize: 22, fontWeight: FontWeight.bold,
    color: Colors.foreground,
  },
  codeBoxFilled: {
    borderColor: Colors.primary, backgroundColor: Colors.tealLight,
  },
  hint: {
    fontSize: FontSize.caption, color: Colors.foregroundMuted,
    textAlign: 'center', marginBottom: Spacing.xl,
  },
  hintCode: {
    fontWeight: FontWeight.bold, color: Colors.primary,
    letterSpacing: 2,
  },
  button: {
    backgroundColor: Colors.primary, borderRadius: Radius.button,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontSize: FontSize.button, fontWeight: FontWeight.semibold, color: Colors.surfacePrimary,
  },
  resendRow: {
    flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl,
  },
  resendText: { fontSize: FontSize.body, color: Colors.foregroundSecondary },
  resendLink: { fontSize: FontSize.body, color: Colors.primary, fontWeight: FontWeight.semibold },
});
