import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/userStore';
import { getSavedTrips, deleteTrip, SavedTripRow } from '../../src/services/savedTripsService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

export default function SavedScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [trips, setTrips] = useState<SavedTripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) loadTrips();
    else setLoading(false);
  }, [user?.id]);

  const loadTrips = async () => {
    if (!user?.id) return;
    try {
      const data = await getSavedTrips(user.id);
      setTrips(data);
    } catch (err) {
      console.warn('Error loading saved trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [user?.id]);

  const handleDelete = (trip: SavedTripRow) => {
    Alert.alert(
      'Eliminar viaje',
      `¿Eliminar ${trip.destination_city} de tus guardados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteTrip(trip.id);
            if (result.success) {
              setTrips(prev => prev.filter(t => t.id !== trip.id));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    } catch { return ''; }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={80} color={Colors.onSurfaceDim} />
      <Text style={styles.emptyTitle}>Sin viajes guardados</Text>
      <Text style={styles.emptyText}>
        Guarda tus destinos favoritos para encontrarlos facilmente
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/home')}
      >
        <Text style={styles.exploreButtonText}>Explorar destinos</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Guardados</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Guardados</Text>
        {trips.length > 0 && (
          <Text style={styles.tripCount}>{trips.length} viaje{trips.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {trips.length === 0 ? (
        renderEmpty()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.coral}
              colors={[Colors.coral]}
            />
          }
        >
          <View style={styles.grid}>
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                activeOpacity={0.85}
                onPress={() => {
                  // Navigate to itinerary generation for saved trips
                  const days = trip.departure_date && trip.return_date
                    ? Math.max(1, Math.round((new Date(trip.return_date).getTime() - new Date(trip.departure_date).getTime()) / (1000 * 60 * 60 * 24)))
                    : 3;
                  router.push({
                    pathname: '/itinerary/[id]',
                    params: {
                      id: trip.id,
                      city: trip.destination_city,
                      country: trip.destination_country || '',
                      days: String(days),
                      mood: trip.mood || 'culture',
                    },
                  });
                }}
              >
                <Image
                  source={{ uri: trip.image_url || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400' }}
                  style={styles.tripImage}
                />
                <View style={styles.tripOverlay}>
                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleDelete(trip);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={16} color={Colors.white} />
                  </TouchableOpacity>

                  <View style={styles.tripInfo}>
                    <Text style={styles.tripCity} numberOfLines={1}>
                      {trip.destination_city}
                    </Text>
                    {trip.departure_date && trip.return_date && (
                      <Text style={styles.tripDates}>
                        {formatDate(trip.departure_date)} - {formatDate(trip.return_date)}
                      </Text>
                    )}
                    {trip.total_price ? (
                      <Text style={styles.tripPrice}>{Math.round(trip.total_price)}\u20AC</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 20 }} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    ...Typography.h1,
    color: Colors.onSurface,
  },
  tripCount: {
    fontSize: 14,
    color: Colors.onSurfaceDim,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  tripCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  tripOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripInfo: {
    padding: Spacing.sm + 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tripCity: {
    ...Typography.bodySemibold,
    color: Colors.white,
    fontSize: 15,
  },
  tripDates: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  tripPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.coral,
    marginTop: 4,
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