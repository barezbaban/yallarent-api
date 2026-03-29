import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../services/auth';
import { useAlert } from '../services/alert';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons
        name={icon as any}
        size={22}
        color={destructive ? Colors.error : Colors.foregroundSecondary}
      />
      <Text style={[styles.rowLabel, destructive && { color: Colors.error }]}>{label}</Text>
      {value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.foregroundMuted} />
      )}
    </Pressable>
  );
}

function SettingsToggle({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={22} color={Colors.foregroundSecondary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await SecureStore.setItemAsync(NOTIFICATIONS_ENABLED_KEY, value ? 'true' : 'false');
  };

  const handleChangePassword = () => {
    router.push('/forgot-password');
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: 'Delete Account',
      message:
        'Are you sure you want to delete your account? This action cannot be undone. All your data including bookings will be permanently removed.',
      type: 'confirm',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // For now just log out — full deletion requires backend endpoint
            logout();
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/edit-profile')}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={handleChangePassword}
          />
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.section}>
          <SettingsToggle
            icon="notifications-outline"
            label="Push Notifications"
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />
          <SettingsRow icon="language-outline" label="Language" value="English" />
          <SettingsRow icon="cash-outline" label="Currency" value="IQD" />
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <SettingsRow icon="information-circle-outline" label="App Version" value="1.1.0" />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://yallarent.com/terms')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://yallarent.com/privacy')}
          />
        </View>

        {/* Danger Zone */}
        {user && (
          <>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <View style={styles.section}>
              <SettingsRow
                icon="trash-outline"
                label="Delete Account"
                onPress={handleDeleteAccount}
                destructive
              />
            </View>
          </>
        )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.foreground,
  },
  rowValue: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
  },
});
