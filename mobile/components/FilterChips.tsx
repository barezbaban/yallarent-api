import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';

interface FilterChipsProps {
  filters: string[];
  selected: string;
  onSelect: (filter: string) => void;
}

function FilterChips({ filters, selected, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive = filter === selected;
        return (
          <Pressable
            key={filter}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(filter)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {filter}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default React.memo(FilterChips);

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundSecondary,
  },
  chipTextActive: {
    color: Colors.surfacePrimary,
  },
});
