import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

const PRESET_LOCATIONS = [
  { label: 'Company Office', icon: 'business-outline' as const },
  { label: 'Airport', icon: 'airplane-outline' as const },
  { label: 'Hotel', icon: 'bed-outline' as const },
];

interface LocationPickerProps {
  visible: boolean;
  title: string;
  companyAddress: string;
  selectedLocation: string;
  onSelect: (location: string) => void;
  onClose: () => void;
}

export default function LocationPicker({
  visible,
  title,
  companyAddress,
  selectedLocation,
  onSelect,
  onClose,
}: LocationPickerProps) {
  const [customText, setCustomText] = useState('');

  const handlePreset = (label: string) => {
    const value = label === 'Company Office' ? companyAddress : label;
    onSelect(value);
    onClose();
  };

  const handleCustom = () => {
    if (customText.trim()) {
      onSelect(customText.trim());
      setCustomText('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.foreground} />
            </Pressable>
          </View>

          {PRESET_LOCATIONS.map((loc) => {
            const value = loc.label === 'Company Office' ? companyAddress : loc.label;
            const isActive = selectedLocation === value;
            return (
              <Pressable
                key={loc.label}
                style={[styles.option, isActive && styles.optionActive]}
                onPress={() => handlePreset(loc.label)}
              >
                <Ionicons name={loc.icon} size={22} color={isActive ? Colors.primary : Colors.foregroundSecondary} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>{loc.label}</Text>
                  {loc.label === 'Company Office' && (
                    <Text style={styles.optionSub}>{companyAddress}</Text>
                  )}
                </View>
                {isActive && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
              </Pressable>
            );
          })}

          <View style={styles.customSection}>
            <Text style={styles.customLabel}>Or enter a custom location</Text>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="e.g. My hotel on 60m street"
                placeholderTextColor={Colors.foregroundMuted}
                value={customText}
                onChangeText={setCustomText}
              />
              <Pressable
                style={[styles.customButton, !customText.trim() && { opacity: 0.4 }]}
                onPress={handleCustom}
                disabled={!customText.trim()}
              >
                <Text style={styles.customButtonText}>Set</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.surfacePrimary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionActive: {
    backgroundColor: Colors.tealLight,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSize.body,
    color: Colors.foreground,
    fontWeight: FontWeight.semibold,
  },
  optionLabelActive: {
    color: Colors.primary,
  },
  optionSub: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
    marginTop: 2,
  },
  customSection: {
    padding: Spacing.lg,
  },
  customLabel: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginBottom: Spacing.sm,
  },
  customRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.foreground,
  },
  customButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.button,
    justifyContent: 'center',
  },
  customButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.surfacePrimary,
  },
});
