import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SavedScreen() {
  const router = useRouter();

  // TODO: Fetch saved trips from Supabase when connected
  const savedTrips: any[] = [];

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={80} color={Colors.onSurfaceDim} />
      <Text style={styles.emptyTitle}>Sin viajes guardados</Text>
      <Text style={styles.emptyText}>
        Guarda tus destinos favoritos para encontrarlos fácilmente
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/home')}
      >
        <Text style={styles.exploreButtonText}>Explorar destinos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Guardados</Text>
      </View>

      {savedTrips.length === 0 ? (
        renderEmpty()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Grid of saved trips will go here */}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.onSurface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.onSurface,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  exploreButton: {
    backgroundColor: Colors.coral,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
  },
  exploreButtonText: {
    ...Typography.bodySemibold,
    color: Colors.white,
  },
});