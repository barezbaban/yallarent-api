import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius } from '../constants/theme';

function Bone({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: Colors.surfaceSecondary,
          borderRadius: Radius.tag,
        },
        style,
        animStyle,
      ]}
    />
  );
}

function CarCardSkeleton() {
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

export default React.memo(CarCardSkeleton);

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
