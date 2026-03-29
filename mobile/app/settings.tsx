import { useState } from 'react';
import {
  Linking,
  Modal,
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
import { t } from '../services/i18n';
import { LANGUAGES, type Language } from '../services/i18n';
import { useLanguage } from '../services/language';

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
  const { language, changeLanguage } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await SecureStore.setItemAsync(NOTIFICATIONS_ENABLED_KEY, value ? 'true' : 'false');
  };

  const handleSelectLanguage = async (lang: Language) => {
    await changeLanguage(lang);
    setShowLangPicker(false);
  };

  const handleChangePassword = () => {
    router.push('/forgot-password');
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: t('settings.deleteAccount'),
      message: t('settings.deleteMessage'),
      type: 'confirm',
      buttons: [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.delete'),
          style: 'destructive',
          onPress: () => {
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
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="person-outline"
            label={t('settings.editProfile')}
            onPress={() => router.push('/edit-profile')}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label={t('settings.changePassword')}
            onPress={handleChangePassword}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
        <View style={styles.section}>
          <SettingsToggle
            icon="notifications-outline"
            label={t('settings.pushNotifications')}
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />
          <SettingsRow
            icon="language-outline"
            label={t('settings.language')}
            value={currentLang?.nativeLabel || 'English'}
            onPress={() => setShowLangPicker(true)}
          />
          <SettingsRow icon="cash-outline" label={t('settings.currency')} value={t('settings.currencyValue')} />
        </View>

        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.section}>
          <SettingsRow icon="information-circle-outline" label={t('settings.appVersion')} value="1.1.0" />
          <SettingsRow
            icon="document-text-outline"
            label={t('settings.termsOfService')}
            onPress={() => Linking.openURL('https://yallarent.com/terms')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label={t('settings.privacyPolicy')}
            onPress={() => Linking.openURL('https://yallarent.com/privacy')}
          />
        </View>

        {user && (
          <>
            <Text style={styles.sectionTitle}>{t('settings.dangerZone')}</Text>
            <View style={styles.section}>
              <SettingsRow
                icon="trash-outline"
                label={t('settings.deleteAccount')}
                onPress={handleDeleteAccount}
                destructive
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal visible={showLangPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.language')}</Text>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={styles.langOption}
                onPress={() => handleSelectLanguage(lang.code)}
              >
                <View>
                  <Text style={styles.langLabel}>{lang.nativeLabel}</Text>
                  <Text style={styles.langSub}>{lang.label}</Text>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: Radius.card,
    width: '80%',
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langLabel: {
    fontSize: FontSize.cardTitle,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  langSub: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginTop: 2,
  },
});
