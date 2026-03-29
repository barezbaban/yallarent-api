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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { passwordApi } from '../services/api';
import { useAlert } from '../services/alert';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { phone, resetToken } = useLocalSearchParams<{ phone: string; resetToken: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      showAlert({ title: 'Missing', message: 'Please fill in both fields', type: 'warning' });
      return;
    }
    if (password !== confirmPassword) {
      showAlert({ title: 'Mismatch', message: 'Passwords do not match', type: 'warning' });
      return;
    }
    if (password.length < 8) {
      showAlert({ title: 'Too Short', message: 'Password must be at least 8 characters', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await passwordApi.resetPassword(phone!, resetToken!, password);
      showAlert({
        title: 'Password Reset!',
        message: 'Your password has been changed successfully. Please log in with your new password.',
        type: 'success',
        buttons: [
          {
            text: 'Log In',
            onPress: () => {
              // Go back to login screen (dismiss all reset screens)
              router.dismissAll();
            },
          },
        ],
      });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Failed to reset password', type: 'error' });
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
          <Ionicons name="shield-checkmark-outline" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Create New Password</Text>
        <Text style={styles.subtitle}>
          Your new password must be at least 8 characters with one uppercase letter and one number.
        </Text>

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.foregroundMuted} />
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor={Colors.foregroundMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoFocus
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.foregroundMuted}
            />
          </Pressable>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.foregroundMuted} />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={Colors.foregroundMuted}
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Pressable onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.foregroundMuted}
            />
          </Pressable>
        </View>

        {/* Password requirements */}
        <View style={styles.requirements}>
          <Requirement met={password.length >= 8} text="At least 8 characters" />
          <Requirement met={/[A-Z]/.test(password)} text="One uppercase letter" />
          <Requirement met={/[0-9]/.test(password)} text="One number" />
          <Requirement met={password.length > 0 && password === confirmPassword} text="Passwords match" />
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={met ? Colors.success : Colors.foregroundMuted}
      />
      <Text style={[styles.reqText, met && styles.reqTextMet]}>{text}</Text>
    </View>
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
    alignSelf: 'center', marginTop: Spacing.xl, marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.pageTitle, fontWeight: FontWeight.bold,
    color: Colors.foreground, textAlign: 'center', marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.body, color: Colors.foregroundSecondary,
    textAlign: 'center', marginBottom: Spacing['2xl'], lineHeight: 22,
  },
  label: {
    fontSize: FontSize.body, fontWeight: FontWeight.semibold,
    color: Colors.foreground, marginBottom: Spacing.sm, marginTop: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  input: { flex: 1, fontSize: FontSize.body, color: Colors.foreground },
  requirements: { marginTop: Spacing.xl, gap: Spacing.sm },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reqText: { fontSize: FontSize.body, color: Colors.foregroundMuted },
  reqTextMet: { color: Colors.success },
  button: {
    backgroundColor: Colors.primary, borderRadius: Radius.button,
    paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing['2xl'],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontSize: FontSize.button, fontWeight: FontWeight.semibold, color: Colors.surfacePrimary,
  },
});
