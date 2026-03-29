import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { useAuth } from '../../services/auth';
import { useAlert } from '../../services/alert';
import { t } from '../../services/i18n';
import { useLanguage } from '../../services/language';

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon as any} size={22} color={Colors.foregroundSecondary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.foregroundMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { language } = useLanguage();

  const handleLogout = () => {
    showAlert({
      title: t('profile.logout'),
      message: t('profile.logoutConfirm'),
      type: 'confirm',
      buttons: [
        { text: t('profile.cancel'), style: 'cancel' },
        { text: t('profile.logout'), style: 'destructive', onPress: logout },
      ],
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <View style={styles.loginPrompt}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-outline" size={40} color={Colors.foregroundMuted} />
          </View>
          <Text style={styles.promptTitle}>{t('profile.signIn')}</Text>
          <Text style={styles.promptMessage}>
            {t('profile.loginMessage')}
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.buttonText}>{t('profile.logIn')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{t('profile.title')}</Text>

      {/* User Info */}
      <Pressable style={styles.userCard} onPress={() => router.push('/edit-profile')}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          {user.city && <Text style={styles.userCity}>{user.city}</Text>}
        </View>
        <Ionicons name="create-outline" size={20} color={Colors.foregroundMuted} />
      </Pressable>

      {/* Menu */}
      <View style={styles.menu}>
        <MenuItem icon="car-outline" label={t('profile.myBookings')} onPress={() => router.push('/(tabs)/bookings')} />
        <MenuItem icon="heart-outline" label={t('profile.favorites')} onPress={() => router.push('/favorites')} />
        <MenuItem icon="notifications-outline" label={t('profile.notifications')} onPress={() => router.push('/notifications')} />
        <MenuItem icon="settings-outline" label={t('profile.settings')} onPress={() => router.push('/settings')} />
        <MenuItem icon="help-circle-outline" label={t('profile.helpSupport')} onPress={() => router.push('/help')} />
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfacePrimary,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  // Logged-in state
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.card,
    marginBottom: Spacing['2xl'],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.surfacePrimary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  userPhone: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    marginTop: 2,
  },
  userCity: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginTop: 2,
  },
  menu: {
    gap: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.foreground,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing['3xl'],
    paddingVertical: Spacing.lg,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  // Logged-out state
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  promptTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  promptMessage: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.md,
    borderRadius: Radius.button,
  },
  buttonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.surfacePrimary,
  },
});
