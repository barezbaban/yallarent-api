import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';

function Bone({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: Colors.surfaceSecondary,
          borderRadius: Radius.tag,
          opacity,
        },
        style,
      ]}
    />
  );
}

export default function CarCardSkeleton() {
  return (
    <View style={styles.card}>
      <Bone width="100%" height={180} style={{ borderRadius: 0 }} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Bone width="55%" height={18} />
          <Bone width={70} height={22} />
        </View>
        <Bone width="35%" height={14} style={{ marginTop: 6 }} />
        <View style={styles.tags}>
          <Bone width={60} height={26} />
          <Bone width={75} height={26} />
          <Bone width={55} height={26} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
