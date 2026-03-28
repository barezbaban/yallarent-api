import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertConfig {
  title: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'confirm';
  buttons?: AlertButton[];
}

interface Props {
  visible: boolean;
  config: AlertConfig;
  onDismiss: () => void;
}

const ICONS: Record<string, { name: string; color: string; bg: string }> = {
  error: { name: 'close-circle', color: Colors.error, bg: '#FEE2E2' },
  success: { name: 'checkmark-circle', color: Colors.success, bg: '#DCFCE7' },
  warning: { name: 'warning', color: Colors.amber, bg: '#FEF3C7' },
  confirm: { name: 'help-circle', color: Colors.primary, bg: Colors.tealLight },
};

export default function CustomAlert({ visible, config, onDismiss }: Props) {
  const { title, message, type = 'error', buttons } = config;
  const icon = ICONS[type];

  const alertButtons = buttons || [{ text: 'OK', style: 'default' as const }];

  const handlePress = (button: AlertButton) => {
    onDismiss();
    button.onPress?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name as any} size={32} color={icon.color} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            {alertButtons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isCancel && alertButtons.length > 1 && i === alertButtons.length - 1;

              return (
                <Pressable
                  key={i}
                  style={[
                    styles.button,
                    alertButtons.length === 1 && styles.buttonFull,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    isPrimary && !isDestructive && styles.buttonPrimary,
                    !isCancel && !isDestructive && !isPrimary && alertButtons.length === 1 && styles.buttonPrimary,
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                      (isPrimary || (!isCancel && !isDestructive && alertButtons.length === 1)) && styles.buttonTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  container: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: Radius.card,
    padding: Spacing['2xl'],
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.button,
    alignItems: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: Colors.surfaceSecondary,
  },
  buttonDestructive: {
    backgroundColor: '#FEE2E2',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
  },
  buttonTextCancel: {
    color: Colors.foregroundSecondary,
  },
  buttonTextDestructive: {
    color: Colors.error,
  },
  buttonTextPrimary: {
    color: Colors.surfacePrimary,
  },
});
