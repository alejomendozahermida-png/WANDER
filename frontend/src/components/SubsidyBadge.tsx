import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

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
        <Text style={styles.icon}>\uD83D\uDCB6</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.mainText}>Hasta {totalSavings}\u20AC en ayudas disponibles</Text>
        <Text style={styles.subText}>{applicableCount} ayuda{applicableCount > 1 ? 's' : ''} europea{applicableCount > 1 ? 's' : ''}</Text>
      </View>
      <Text style={styles.arrow}>\u203A</Text>
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
  arrow: {
    fontSize: 22,
    color: Colors.teal,
    fontWeight: '300',
    marginLeft: Spacing.sm,
  },
});
