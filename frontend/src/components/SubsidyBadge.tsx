import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SubsidyBadgeProps {
  totalSavings: number;
  applicableCount: number;
  onPress?: () => void;
}

export const SubsidyBadge: React.FC<SubsidyBadgeProps> = ({ totalSavings, applicableCount, onPress }) => {
  if (applicableCount <= 0) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="cash-outline" size={16} color={Colors.teal} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.mainText}>Hasta {totalSavings}€ en ayudas disponibles</Text>
        <Text style={styles.subText}>{applicableCount} ayuda{applicableCount > 1 ? 's' : ''} europea{applicableCount > 1 ? 's' : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.teal} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 218, 196, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96, 218, 196, 0.3)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(96, 218, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  icon: {
    fontSize: 14,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    ...Typography.bodySemibold,
    color: Colors.teal,
    fontSize: 13,
  },
  subText: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
    marginTop: 1,
  },
});
