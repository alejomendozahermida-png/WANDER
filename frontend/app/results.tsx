import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSearchStore } from '../src/store/searchStore';
import { useUserStore } from '../src/store/userStore';
import { searchDestinations } from '../src/services/mockData';
import { Colors, Spacing, BorderRadius, Typography } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const { height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.65;

interface Badge {
  type: 'cheapest' | 'best-value' | 'hidden-gem';
  emoji: string;
  label: string;
  color: string;
}

const BADGES: Record<string, Badge> = {
  cheapest: {
    type: 'cheapest',
    emoji: '🔥',
    label: 'Opción más económica',
    color: Colors.coral,
  },
  'best-value': {
    type: 'best-value',
    emoji: '⭐',
    label: 'Mejor relación calidad-precio',
    color: Colors.sand,
  },
  'hidden-gem': {
    type: 'hidden-gem',
    emoji: '💎',
    label: 'Joya oculta',
    color: Colors.teal,
  },
};

export default function ResultsScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { departureDate, returnDate, selectedMood, results, setResults, setSearching } = useSearchStore();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Conectando con aerolíneas...');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    if (!departureDate || !returnDate || !selectedMood) {
      router.back();
      return;
    }

    setLoading(true);
    setSearching(true);

    // Rotate loading messages for better UX during long API calls
    const messages = [
      'Conectando con aerolíneas...',
      'Buscando vuelos baratos...',
      'Comparando precios de vuelos...',
      'Buscando hoteles en Booking.com...',
      'Calculando precio total real...',
      'Casi listo, seleccionando las mejores opciones...',
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, messages.length - 1);
      setLoadingMessage(messages[msgIdx]);
    }, 6000);

    try {
      const destinations = await searchDestinations(
        format(departureDate, 'yyyy-MM-dd'),
        format(returnDate, 'yyyy-MM-dd'),
        selectedMood,
        user?.budgetMax || 500,
        user?.homeAirportIata || 'CDG',
        user?.passportCountry
      );
      setResults(destinations);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
      setSearching(false);
    }
  };

  const renderLoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.coral} />
      <Text style={styles.loadingText}>{loadingMessage}</Text>
      <Text style={styles.loadingSubtext}>Esto puede tomar unos segundos</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderLoadingSkeleton()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wander</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderLabel}>3 DESTINOS PERFECTOS</Text>
        <Text style={styles.subHeaderTitle}>Tus escapadas curadas</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {results.map((destination, index) => {
          const badge = BADGES[destination.badge || 'best-value'];
          
          return (
            <TouchableOpacity
              key={destination.id}
              style={styles.card}
              activeOpacity={0.95}
              onPress={() => router.push(`/detail/${destination.id}`)}
            >
              <Image
                source={{ uri: destination.imageUrl }}
                style={styles.cardImage}
              />
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                locations={[0.3, 1]}
                style={styles.gradient}
              >
                {/* Badge - Top Left */}
                <View style={[styles.badge, { backgroundColor: badge.color }]}>
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={styles.badgeText}>{badge.label}</Text>
                </View>

                {/* Content Container - Bottom */}
                <View style={styles.cardContent}>
                  {/* Visa Status */}
                  <View style={styles.visaContainer}>
                    <Text style={styles.visaEmoji}>🇪🇺</Text>
                    <Text style={styles.visaText}>
                      {destination.visaFree ? 'Sin visa requerida' : 'Visa requerida'}
                    </Text>
                  </View>

                  {/* City Name */}
                  <Text style={styles.cityName}>{destination.city}</Text>
                  <Text style={styles.countryName}>{destination.country}</Text>

                  {/* Price Breakdown */}
                  <View style={styles.priceContainer}>
                    <View style={styles.priceRow}>
                      <Ionicons name="airplane" size={16} color={Colors.white} />
                      <Text style={styles.priceLabel}>Vuelo</Text>
                      <Text style={styles.priceValue}>{destination.flightPrice}€</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Ionicons name="bed" size={16} color={Colors.white} />
                      <Text style={styles.priceLabel}>Alojamiento</Text>
                      <Text style={styles.priceValue}>{destination.hotelPrice}€</Text>
                    </View>
                    <View style={[styles.priceRow, styles.priceTotalRow]}>
                      <Text style={styles.priceTotalLabel}>Total</Text>
                      <Text style={styles.priceTotalValue}>{destination.totalPrice}€</Text>
                    </View>
                  </View>

                  {/* Arrow Button - Inside content */}
                  <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={() => router.push(`/detail/${destination.id}`)}
                  >
                    <Ionicons name="arrow-forward" size={24} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* Search Again Button */}
        <View style={styles.searchAgainContainer}>
          <Text style={styles.searchAgainTitle}>¿Ninguno te convence?</Text>
          <TouchableOpacity
            style={styles.searchAgainButton}
            onPress={() => router.back()}
          >
            <Ionicons name="refresh" size={24} color={Colors.coral} />
            <Text style={styles.searchAgainText}>Buscar de nuevo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.onSurface,
  },
  subHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  subHeaderLabel: {
    ...Typography.label,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.xs,
  },
  subHeaderTitle: {
    ...Typography.displaySmall,
    color: Colors.onSurface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.lg,
  },
  loadingSubtext: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.sm,
    fontSize: 13,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  cardContent: {
    marginTop: 'auto',
  },
  badge: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
  },
  badgeEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  badgeText: {
    ...Typography.bodySemibold,
    color: Colors.background,
    fontSize: 12,
  },
  visaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  visaEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  visaText: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 12,
  },
  cityName: {
    ...Typography.display,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  countryName: {
    ...Typography.bodyLarge,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.md,
  },
  priceContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.white,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  priceValue: {
    ...Typography.bodySemibold,
    color: Colors.white,
  },
  priceTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: Spacing.sm,
    marginBottom: 0,
    marginTop: Spacing.xs,
  },
  priceTotalLabel: {
    ...Typography.bodySemibold,
    color: Colors.white,
    flex: 1,
  },
  priceTotalValue: {
    ...Typography.h2,
    color: Colors.coral,
  },
  arrowButton: {
    alignSelf: 'flex-end',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  searchAgainContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  searchAgainTitle: {
    ...Typography.h3,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  searchAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 2,
    borderColor: Colors.coral,
  },
  searchAgainText: {
    ...Typography.bodySemibold,
    color: Colors.coral,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
});