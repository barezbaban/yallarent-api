import { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Text, Platform, Animated, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 8);
  const tabCount = state.routes.length;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);
  const padding = 5;
  const tabW = barWidth > 0 ? (barWidth - padding * 2) / tabCount : 0;

  useEffect(() => {
    if (tabW > 0) {
      Animated.spring(slideAnim, {
        toValue: state.index * tabW + padding,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
        mass: 0.7,
      }).start();
    }
  }, [state.index, tabW]);

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View style={styles.outerShadow}>
        <BlurView intensity={150} tint="light" style={styles.blur}>
          <View style={styles.inner} onLayout={onBarLayout}>
            {/* Sliding dark highlight */}
            {tabW > 0 && (
              <Animated.View
                style={[
                  styles.highlight,
                  {
                    width: tabW - 4,
                    transform: [{ translateX: slideAnim }],
                  },
                ]}
              />
            )}

            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const label = typeof options.title === 'string' ? options.title : route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={styles.tab}
                >
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color: isFocused ? '#000000' : '#444444',
                    size: 21,
                  })}
                  <Text style={[styles.label, isFocused && styles.labelActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 999,
  },
  outerShadow: {
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 28,
  },
  highlight: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#444444',
  },
  labelActive: {
    color: '#000000',
    fontWeight: '700',
  },
});
