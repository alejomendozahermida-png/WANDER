import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSearchStore } from '../src/store/searchStore';
import { useUserStore } from '../src/store/userStore';
import { searchDestinations } from '../src/services/mockData';
import { fetchSubsidies, SubsidyResult } from '../src/services/subsidyService';
import { SubsidyBadge } from '../src/components/SubsidyBadge';
import { Colors, Spacing, BorderRadius, Typography } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const { height, width } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.62;

interface Badge {
  type: 'cheapest' | 'best-value' | 'hidden-gem';
  emoji: string;
  label: string;
  color: string;
}

const BADGES: Record<string, Badge> = {
  cheapest: { type: 'cheapest', emoji: '🔥', label: 'Mas economica', color: Colors.coral },
  'best-value': { type: 'best-value', emoji: '⭐', label: 'Mejor calidad-precio', color: Colors.sand },
  'hidden-gem': { type: 'hidden-gem', emoji: '💎', label: 'Joya oculta', color: Colors.teal },
};

export default function ResultsScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { departureDate, returnDate, selectedMood, results, setResults, setSearching } = useSearchStore();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Conectando con aerolineas...');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [subsidyData, setSubsidyData] = useState<SubsidyResult | null>(null);

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!loading) return;
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    );
    float.start();
    pulse.start();
    return () => { float.stop(); pulse.stop(); };
  }, [loading]);

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

    const messages = [
      'Conectando con aerolineas...',
      'Buscando vuelos baratos...',
      'Comparando precios...',
      'Buscando hoteles en Booking.com...',
      'Calculando precio total real...',
      'Seleccionando las mejores opciones...',
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, messages.length - 1);
      setLoadingMessage(messages[msgIdx]);
    }, 6000);

    try {
      const [destinations, subsidies] = await Promise.all([
        searchDestinations(
          format(departureDate, 'yyyy-MM-dd'),
          format(returnDate, 'yyyy-MM-dd'),
          selectedMood,
          user?.budgetMax || 500,
          user?.homeAirportIata || 'CDG',
          user?.passportCountry
        ),
        fetchSubsidies({
          age: 22,
          is_student: true,
          country: user?.passportCountry || 'FR',
          has_erasmus: false,
        }).catch(() => null),
      ]);

      setResults(destinations);
      setSubsidyData(subsidies);

      if (destinations.length === 0) {
        setSearchError('No encontramos vuelos para estas fechas. Prueba con otras fechas o un presupuesto mayor.');
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setSearchError('Hubo un error al buscar destinos. Intentalo de nuevo.');
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
      setSearching(false);
    }
  };

  if (loading) {
    const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Ionicons name="airplane" size={52} color={Colors.coral} />
          </Animated.View>
          <Text style={styles.loadingTitle}>Buscando tu destino ideal</Text>
          <Text style={styles.loadingMsg}>{loadingMessage}</Text>
          <View style={styles.loadingDotsRow}>
            {[0, 1, 2].map(i => (
              <Animated.View
                key={i}
                style={[styles.loadingDot, { opacity: pulseAnim, transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.8, 1] }) }] }]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (searchError || results.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resultados</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.onSurfaceDim + '50'} />
          <Text style={styles.errorTitle}>
            {searchError || 'No encontramos vuelos para estas fechas'}
          </Text>
          <Text style={styles.errorSubtitle}>Prueba con otras fechas o un presupuesto mayor</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setSearchError(null); loadResults(); }}>
            <Ionicons name="refresh" size={18} color={Colors.white} />
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.changeSearchBtn} onPress={() => router.back()}>
            <Text style={styles.changeSearchText}>Cambiar busqueda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wander</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Subheader */}
      <View style={styles.subHeader}>
        <Text style={styles.subLabel}>3 DESTINOS PERFECTOS</Text>
        <Text style={styles.subTitle}>Tus escapadas curadas</Text>
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
                defaultSource={require('../assets/images/icon.png')}
              />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface, zIndex: -1 }]} />

              <LinearGradient
                colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.85)']}
                locations={[0, 0.3, 1]}
                style={styles.gradient}
              >
                {/* Top badges */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badgePill, { backgroundColor: badge.color }]}>
                    <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                    <Text style={styles.badgeLabel}>{badge.label}</Text>
                  </View>
                  {destination.budgetTag === 'stretch' && (
                    <View style={[styles.budgetPill, { backgroundColor: '#FF9800' }]}>
                      <Text style={styles.budgetPillText}>Supera presupuesto</Text>
                    </View>
                  )}
                  {destination.budgetTag === 'worth-it' && (
                    <View style={[styles.budgetPill, { backgroundColor: '#4CAF50' }]}>
                      <Text style={styles.budgetPillText}>Vale la pena</Text>
                    </View>
                  )}
                </View>

                {/* Bottom content */}
                <View style={styles.cardBottom}>
                  {/* Visa */}
                  <View style={styles.visaPill}>
                    <Text style={styles.visaEmoji}>🇪🇺</Text>
                    <Text style={styles.visaText}>
                      {destination.visaFree ? 'Sin visa' : 'Visa requerida'}
                    </Text>
                  </View>

                  {/* City */}
                  <Text style={styles.cityName}>{destination.city}</Text>
                  <Text style={styles.countryName}>{destination.country}</Text>

                  {/* Price Box */}
                  <View style={styles.priceBox}>
                    <View style={styles.priceRow}>
                      <Ionicons name="airplane" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.priceLabel}>
                        Vuelo{destination.flightDetails?.airline ? ` · ${destination.flightDetails.airline}` : ''}
                      </Text>
                      <Text style={styles.priceVal}>{destination.flightPrice}€</Text>
                    </View>
                    {destination.flightDetails && (
                      <Text style={styles.flightMini}>
                        {destination.flightDetails.outbound.duration} · {destination.flightDetails.outbound.stops === 0 ? 'Directo' : `${destination.flightDetails.outbound.stops} escala${destination.flightDetails.outbound.stops > 1 ? 's' : ''}`}
                      </Text>
                    )}
                    <View style={styles.priceRow}>
                      <Ionicons name="bed" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.priceLabel}>Alojamiento</Text>
                      <Text style={styles.priceVal}>{destination.hotelPrice}€</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalVal}>{destination.totalPrice}€</Text>
                    </View>
                  </View>

                  {/* CTA */}
                  <TouchableOpacity
                    style={styles.ctaBtn}
                    onPress={() => router.push(`/detail/${destination.id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.ctaBtnText}>Ver detalles</Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* Subsidy Badge */}
        {subsidyData && subsidyData.applicable_count > 0 && (
          <SubsidyBadge
            totalSavings={subsidyData.total_potential_savings}
            applicableCount={subsidyData.applicable_count}
            onPress={() => router.push({
              pathname: '/subsidies',
              params: { budget: String(user?.budgetMax || 500) },
            })}
          />
        )}

        {/* Search Again */}
        <View style={styles.searchAgain}>
          <Text style={styles.searchAgainTitle}>¿Ninguno te convence?</Text>
          <TouchableOpacity style={styles.searchAgainBtn} onPress={() => router.back()}>
            <Ionicons name="refresh" size={20} color={Colors.coral} />
            <Text style={styles.searchAgainText}>Buscar de nuevo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  subHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSurfaceDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  loadingMsg: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coral,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  loadingDotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xl,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.coral,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // Card
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
    padding: Spacing.md + 4,
    justifyContent: 'space-between',
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeEmoji: { fontSize: 14 },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.background,
  },
  budgetPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  budgetPillText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },

  // Bottom
  cardBottom: { marginTop: 'auto' },
  visaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  visaEmoji: { fontSize: 14 },
  visaText: { fontSize: 11, color: Colors.white, fontWeight: '600' },

  cityName: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  countryName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: Spacing.md,
  },

  // Price
  priceBox: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  priceLabel: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  flightMini: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginLeft: 22,
    marginBottom: 6,
    marginTop: -4,
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.coral,
  },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.coral,
    borderRadius: BorderRadius.pill,
    paddingVertical: 14,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },

  // Search Again
  searchAgain: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  searchAgainTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.md,
  },
  searchAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    borderColor: Colors.coral,
  },
  searchAgainText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.coral,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: 8,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    textAlign: 'center',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceDim,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.coral,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.pill,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  changeSearchBtn: {
    paddingVertical: 8,
  },
  changeSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.teal,
  },
});
