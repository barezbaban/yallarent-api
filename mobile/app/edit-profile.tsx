import { useState } from 'react';
import {
  FlatList,
  Modal,
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
import { IRAQ_CITIES } from '../constants/cities';
import { authApi } from '../services/api';
import { useAuth } from '../services/auth';
import { useAlert } from '../services/alert';
import { t } from '../services/i18n';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { showAlert } = useAlert();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [city, setCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert({ title: 'Error', message: 'Name is required', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        fullName: fullName.trim(),
        city: city.trim() || undefined,
      });
      updateUser(updated);
      router.back();
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your name"
            placeholderTextColor={Colors.foregroundMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.phone || ''}
            editable={false}
          />
          <Text style={styles.hint}>Phone number cannot be changed</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('editProfile.city')}</Text>
          <Pressable style={styles.cityPicker} onPress={() => setShowCityPicker(true)}>
            <Ionicons name="location-outline" size={20} color={Colors.foregroundMuted} />
            <Text style={[styles.cityPickerText, !city && { color: Colors.foregroundMuted }]}>
              {city || t('editProfile.cityPlaceholder')}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.foregroundMuted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t('editProfile.saving') : t('editProfile.saveChanges')}
          </Text>
        </Pressable>
      </View>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('login.selectCity')}</Text>
              <Pressable onPress={() => setShowCityPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </Pressable>
            </View>
            <FlatList
              data={IRAQ_CITIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = item === city;
                return (
                  <Pressable
                    style={[styles.cityRow, selected && styles.cityRowActive]}
                    onPress={() => {
                      setCity(item);
                      setShowCityPicker(false);
                    }}
                  >
                    <View style={[styles.cityIcon, selected && styles.cityIconActive]}>
                      <Ionicons name="location" size={18} color={selected ? Colors.surfacePrimary : Colors.primary} />
                    </View>
                    <Text style={[styles.cityName, selected && styles.cityNameActive]}>{item}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                  </Pressable>
                );
              }}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
  },
  field: {},
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.foreground,
    backgroundColor: Colors.surfacePrimary,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceSecondary,
    color: Colors.foregroundMuted,
  },
  hint: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginTop: Spacing.xs,
  },
  bottom: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing['3xl'],
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.button,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: Colors.surfacePrimary,
  },
  cityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  cityPickerText: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.foreground,
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
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityRowActive: {
    backgroundColor: Colors.tealLight,
  },
  cityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityIconActive: {
    backgroundColor: Colors.primary,
  },
  cityName: {
    flex: 1,
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  cityNameActive: {
    color: Colors.primary,
  },
});
