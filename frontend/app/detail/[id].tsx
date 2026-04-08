import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Switch,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useSearchStore } from '../../src/store/searchStore';
import { TRENDING_DESTINATIONS } from '../../src/services/mockData';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Destination, FlightSegment } from '../../src/types';
import { searchAccommodations, Accommodation } from '../../src/services/dealsService';
import { useUserStore } from '../../src/store/userStore';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.4;

/** Format ISO datetime to readable time (e.g., "14:30") */
const formatTime = (isoString: string): string => {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return '--:--'; }
};

/** Format ISO datetime to readable date (e.g., "15 Abr") */
const formatShortDate = (isoString: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch { return ''; }
};

/** Calculate trip nights */
const calcNights = (dep: string, ret: string): number => {
  try {
    const d1 = new Date(dep);
    const d2 = new Date(ret);
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  } catch { return 7; }
};

export default function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { results } = useSearchStore();
  const { user } = useUserStore();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [esimEnabled, setEsimEnabled] = useState(false);
  const [accommodations, setAccommodations] = useState<{ budget: Accommodation | null; midrange: Accommodation | null; premium: Accommodation | null } | null>(null);
  const [loadingAccom, setLoadingAccom] = useState(false);
  const [selectedAccom, setSelectedAccom] = useState<'budget' | 'midrange' | 'premium'>('budget');
  const [expandedFlight, setExpandedFlight] = useState<'outbound' | 'inbound' | null>(null);

  useEffect(() => {
    // Find destination in results or trending
    const found = [...results, ...TRENDING_DESTINATIONS].find(d => d.id === id);
    if (found) {
      setDestination(found);
      // Load real accommodations from Booking.com
      loadAccommodations(found);
    }
  }, [id]);

  const loadAccommodations = async (dest: Destination) => {
    setLoadingAccom(true);
    try {
      const result = await searchAccommodations(
        dest.city,
        dest.departureDate,
        dest.returnDate,
        2,
        'EUR'
      );
      if (result?.accommodations) {
        setAccommodations(result.accommodations);
      }
    } catch (error) {
      console.warn('Error loading accommodations:', error);
    } finally {
      setLoadingAccom(false);
    }
  };

  if (!destination) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Destino no encontrado</Text>
          <Button title="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaved(!isSaved);
    Alert.alert(
      isSaved ? 'Eliminado' : 'Guardado',
      isSaved
        ? 'Viaje eliminado de guardados'
        : 'Viaje guardado. Lo encontrarás en tu sección Guardados'
    );
  };

  const handleBook = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push(`/booking/${destination.id}`);
  };

  const handleToggleInsurance = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInsuranceEnabled(value);
  };

  const handleToggleEsim = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEsimEnabled(value);
  };

  const calculateTotal = () => {
    let total = destination.totalPrice;
    if (insuranceEnabled) total += 8;
    if (esimEnabled) total += 5;
    return total;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: destination.imageUrl }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            locations={[0.5, 1]}
            style={styles.heroGradient}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={Colors.white}
              />
            </TouchableOpacity>

            {/* City Info */}
            <View style={styles.heroInfo}>
              <Text style={styles.heroCity}>{destination.city}</Text>
              <Text style={styles.heroCountry}>{destination.country}</Text>
              {destination.visaFree && (
                <View style={styles.visaBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.teal} />
                  <Text style={styles.visaText}>Sin visa requerida</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statEmoji}>🌡️</Text>
            <Text style={styles.statText}>{destination.temperature || 25}°C</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statEmoji}>✈️</Text>
            <Text style={styles.statText}>{destination.flightDuration || '2h 30m'}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statEmoji}>💶</Text>
            <Text style={styles.statText}>{destination.costOfLiving || 'Bajo'}</Text>
          </View>
        </View>

        {/* Flight Details - Expandable */}
        {destination.flightDetails && (
          <Card style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Detalles del vuelo</Text>
            <Text style={styles.flightAirlineMain}>
              {destination.flightDetails.airline} - {destination.flightDetails.totalPrice}{destination.flightDetails.currency === 'GBP' ? '£' : '€'}
            </Text>

            {/* OUTBOUND flight */}
            <TouchableOpacity
              style={styles.flightToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpandedFlight(expandedFlight === 'outbound' ? null : 'outbound');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.flightToggleLeft}>
                <Ionicons name="airplane" size={18} color={Colors.coral} />
                <View style={styles.flightToggleInfo}>
                  <Text style={styles.flightToggleLabel}>Ida</Text>
                  <Text style={styles.flightToggleRoute}>
                    {destination.flightDetails.outbound.segments?.[0]?.departureAirport || (user?.homeAirportIata || 'CDG')} → {destination.iata}
                  </Text>
                </View>
              </View>
              <View style={styles.flightToggleRight}>
                <Text style={styles.flightToggleDuration}>{destination.flightDetails.outbound.duration}</Text>
                <Text style={styles.flightToggleStops}>
                  {destination.flightDetails.outbound.stops === 0 ? 'Directo' : `${destination.flightDetails.outbound.stops} escala${destination.flightDetails.outbound.stops > 1 ? 's' : ''}`}
                </Text>
                <Ionicons
                  name={expandedFlight === 'outbound' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.onSurfaceDim}
                />
              </View>
            </TouchableOpacity>

            {expandedFlight === 'outbound' && destination.flightDetails.outbound.segments?.length > 0 && (
              <View style={styles.segmentsList}>
                {destination.flightDetails.outbound.segments.map((seg: FlightSegment, idx: number) => (
                  <View key={idx} style={styles.segmentCard}>
                    <View style={styles.segmentHeader}>
                      <Text style={styles.segmentAirline}>{seg.airline}</Text>
                      <Text style={styles.segmentFlightNum}>{seg.flightNumber}</Text>
                    </View>
                    <View style={styles.segmentRoute}>
                      <View style={styles.segmentPoint}>
                        <Text style={styles.segmentTime}>{formatTime(seg.departureTime)}</Text>
                        <Text style={styles.segmentDate}>{formatShortDate(seg.departureTime)}</Text>
                        <Text style={styles.segmentAirport}>{seg.departureAirport}</Text>
                        {seg.departureName ? <Text style={styles.segmentCityName}>{seg.departureName}</Text> : null}
                      </View>
                      <View style={styles.segmentLine}>
                        <View style={styles.segmentDot} />
                        <View style={styles.segmentDash} />
                        <Ionicons name="airplane" size={14} color={Colors.coral} />
                        <View style={styles.segmentDash} />
                        <View style={styles.segmentDot} />
                      </View>
                      <View style={[styles.segmentPoint, { alignItems: 'flex-end' }]}>
                        <Text style={styles.segmentTime}>{formatTime(seg.arrivalTime)}</Text>
                        <Text style={styles.segmentDate}>{formatShortDate(seg.arrivalTime)}</Text>
                        <Text style={styles.segmentAirport}>{seg.arrivalAirport}</Text>
                        {seg.arrivalName ? <Text style={styles.segmentCityName}>{seg.arrivalName}</Text> : null}
                      </View>
                    </View>
                    <View style={styles.segmentFooter}>
                      <Text style={styles.segmentDuration}>{seg.duration}</Text>
                      {seg.aircraft ? <Text style={styles.segmentAircraft}>{seg.aircraft}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* INBOUND flight */}
            <TouchableOpacity
              style={[styles.flightToggle, { marginTop: Spacing.sm }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpandedFlight(expandedFlight === 'inbound' ? null : 'inbound');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.flightToggleLeft}>
                <Ionicons name="airplane" size={18} color={Colors.teal} style={{ transform: [{ rotate: '180deg' }] }} />
                <View style={styles.flightToggleInfo}>
                  <Text style={styles.flightToggleLabel}>Vuelta</Text>
                  <Text style={styles.flightToggleRoute}>
                    {destination.iata} → {destination.flightDetails.inbound.segments?.[0]?.arrivalAirport || (user?.homeAirportIata || 'CDG')}
                  </Text>
                </View>
              </View>
              <View style={styles.flightToggleRight}>
                <Text style={styles.flightToggleDuration}>{destination.flightDetails.inbound.duration}</Text>
                <Text style={styles.flightToggleStops}>
                  {destination.flightDetails.inbound.stops === 0 ? 'Directo' : `${destination.flightDetails.inbound.stops} escala${destination.flightDetails.inbound.stops > 1 ? 's' : ''}`}
                </Text>
                <Ionicons
                  name={expandedFlight === 'inbound' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.onSurfaceDim}
                />
              </View>
            </TouchableOpacity>

            {expandedFlight === 'inbound' && destination.flightDetails.inbound.segments?.length > 0 && (
              <View style={styles.segmentsList}>
                {destination.flightDetails.inbound.segments.map((seg: FlightSegment, idx: number) => (
                  <View key={idx} style={styles.segmentCard}>
                    <View style={styles.segmentHeader}>
                      <Text style={styles.segmentAirline}>{seg.airline}</Text>
                      <Text style={styles.segmentFlightNum}>{seg.flightNumber}</Text>
                    </View>
                    <View style={styles.segmentRoute}>
                      <View style={styles.segmentPoint}>
                        <Text style={styles.segmentTime}>{formatTime(seg.departureTime)}</Text>
                        <Text style={styles.segmentDate}>{formatShortDate(seg.departureTime)}</Text>
                        <Text style={styles.segmentAirport}>{seg.departureAirport}</Text>
                        {seg.departureName ? <Text style={styles.segmentCityName}>{seg.departureName}</Text> : null}
                      </View>
                      <View style={styles.segmentLine}>
                        <View style={styles.segmentDot} />
                        <View style={styles.segmentDash} />
                        <Ionicons name="airplane" size={14} color={Colors.teal} />
                        <View style={styles.segmentDash} />
                        <View style={styles.segmentDot} />
                      </View>
                      <View style={[styles.segmentPoint, { alignItems: 'flex-end' }]}>
                        <Text style={styles.segmentTime}>{formatTime(seg.arrivalTime)}</Text>
                        <Text style={styles.segmentDate}>{formatShortDate(seg.arrivalTime)}</Text>
                        <Text style={styles.segmentAirport}>{seg.arrivalAirport}</Text>
                        {seg.arrivalName ? <Text style={styles.segmentCityName}>{seg.arrivalName}</Text> : null}
                      </View>
                    </View>
                    <View style={styles.segmentFooter}>
                      <Text style={styles.segmentDuration}>{seg.duration}</Text>
                      {seg.aircraft ? <Text style={styles.segmentAircraft}>{seg.aircraft}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Trip Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumen del viaje</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="airplane" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.summaryLabel}>Vuelo ({user?.homeAirportIata || 'CDG'} → {destination.iata})</Text>
            <Text style={styles.summaryValue}>{destination.flightPrice}€</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bed" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.summaryLabel}>Alojamiento ({calcNights(destination.departureDate, destination.returnDate)} noches)</Text>
            <Text style={styles.summaryValue}>{destination.hotelPrice}€</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="restaurant" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.summaryLabel}>Comidas estimadas</Text>
            <Text style={styles.summaryValue}>~150€</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bus" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.summaryLabel}>Transporte local</Text>
            <Text style={styles.summaryValue}>~30€</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total estimado</Text>
            <Text style={styles.summaryTotalValue}>{destination.totalPrice}€</Text>
          </View>
        </Card>

        {/* Accommodations from Booking.com */}
        <Card style={styles.accomCard}>
          <View style={styles.accomHeader}>
            <Text style={styles.cardTitle}>Alojamiento</Text>
            <Text style={styles.accomPowered}>via Booking.com</Text>
          </View>

          {loadingAccom ? (
            <View style={styles.accomLoading}>
              <ActivityIndicator size="small" color={Colors.coral} />
              <Text style={styles.accomLoadingText}>Buscando alojamientos...</Text>
            </View>
          ) : accommodations ? (
            <>
              {/* Category Tabs */}
              <View style={styles.accomTabs}>
                {([
                  { key: 'budget', label: 'Economico', icon: 'wallet-outline' },
                  { key: 'midrange', label: 'Confort', icon: 'star-half-outline' },
                  { key: 'premium', label: 'Premium', icon: 'diamond-outline' },
                ] as const).map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.accomTab, selectedAccom === tab.key && styles.accomTabActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAccom(tab.key);
                    }}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={16}
                      color={selectedAccom === tab.key ? '#fff' : Colors.onSurfaceDim}
                    />
                    <Text style={[styles.accomTabText, selectedAccom === tab.key && styles.accomTabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected Accommodation Card */}
              {accommodations[selectedAccom] ? (
                <TouchableOpacity
                  style={styles.accomDetail}
                  onPress={() => {
                    const url = accommodations[selectedAccom]?.booking_url;
                    if (url) Linking.openURL(url);
                  }}
                  activeOpacity={0.7}
                >
                  {accommodations[selectedAccom]!.photo_url ? (
                    <Image
                      source={{ uri: accommodations[selectedAccom]!.photo_url }}
                      style={styles.accomImage}
                    />
                  ) : null}
                  <View style={styles.accomInfo}>
                    <Text style={styles.accomName} numberOfLines={2}>
                      {accommodations[selectedAccom]!.name}
                    </Text>
                    <View style={styles.accomMeta}>
                      {accommodations[selectedAccom]!.stars > 0 && (
                        <View style={styles.accomStars}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.accomStarsText}>
                            {accommodations[selectedAccom]!.stars}
                          </Text>
                        </View>
                      )}
                      {accommodations[selectedAccom]!.review_score > 0 && (
                        <View style={styles.accomReview}>
                          <Text style={styles.accomReviewScore}>
                            {accommodations[selectedAccom]!.review_score}
                          </Text>
                          <Text style={styles.accomReviewWord}>
                            {accommodations[selectedAccom]!.review_word}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.accomPriceRow}>
                      <Text style={styles.accomPrice}>
                        {Math.round(accommodations[selectedAccom]!.total_price)}€
                      </Text>
                      <Text style={styles.accomPerNight}>
                        ({Math.round(accommodations[selectedAccom]!.price_per_night)}€/noche)
                      </Text>
                    </View>
                    <Text style={styles.accomType}>
                      {accommodations[selectedAccom]!.accommodation_type}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={styles.accomEmpty}>No disponible para esta categoria</Text>
              )}
            </>
          ) : (
            <Text style={styles.accomEmpty}>No se encontraron alojamientos</Text>
          )}
        </Card>

        {/* Add-ons */}
        <Card style={styles.addonsCard}>
          <Text style={styles.cardTitle}>Complementos</Text>
          
          <View style={styles.addonRow}>
            <View style={styles.addonLeft}>
              <Text style={styles.addonEmoji}>🛡️</Text>
              <View style={styles.addonInfo}>
                <Text style={styles.addonTitle}>Seguro de viaje</Text>
                <Text style={styles.addonPrice}>desde 8€</Text>
              </View>
            </View>
            <Switch
              value={insuranceEnabled}
              onValueChange={handleToggleInsurance}
              trackColor={{ false: Colors.surfaceMid, true: Colors.coral }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.surfaceMid}
            />
          </View>

          <View style={styles.addonRow}>
            <View style={styles.addonLeft}>
              <Text style={styles.addonEmoji}>📱</Text>
              <View style={styles.addonInfo}>
                <Text style={styles.addonTitle}>eSIM para {destination.country}</Text>
                <Text style={styles.addonPrice}>5GB desde 5€</Text>
              </View>
            </View>
            <Switch
              value={esimEnabled}
              onValueChange={handleToggleEsim}
              trackColor={{ false: Colors.surfaceMid, true: Colors.coral }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.surfaceMid}
            />
          </View>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer CTA */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerPrice}>{calculateTotal()}€</Text>
          </View>
          <Button
            title="Reservar este viaje"
            onPress={handleBook}
            style={styles.bookButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.xl + Spacing.lg,
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    marginBottom: Spacing.lg,
  },
  heroCity: {
    ...Typography.display,
    fontSize: 48,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  heroCountry: {
    ...Typography.bodyLarge,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  visaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 218, 196, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  visaText: {
    ...Typography.bodySemibold,
    color: Colors.teal,
    marginLeft: Spacing.xs,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statEmoji: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  statText: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 14,
  },
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  addonsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryIcon: {
    width: 32,
    marginRight: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.onSurface,
    flex: 1,
  },
  summaryValue: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.surfaceMid,
    marginVertical: Spacing.md,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  summaryTotalValue: {
    ...Typography.h1,
    color: Colors.coral,
  },
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addonEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  addonInfo: {
    flex: 1,
  },
  addonTitle: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    marginBottom: 2,
  },
  addonPrice: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
  },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMid,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  footerLabel: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
  },
  footerPrice: {
    ...Typography.h1,
    color: Colors.coral,
  },
  bookButton: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h2,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.xl,
  },
  // Accommodation styles
  accomCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  // Flight details styles
  flightAirlineMain: {
    ...Typography.bodySemibold,
    color: Colors.onSurfaceDim,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  flightToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceMid,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  flightToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flightToggleInfo: {
    marginLeft: Spacing.sm,
  },
  flightToggleLabel: {
    ...Typography.label,
    color: Colors.onSurfaceDim,
    fontSize: 10,
  },
  flightToggleRoute: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 14,
  },
  flightToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flightToggleDuration: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 13,
  },
  flightToggleStops: {
    fontSize: 11,
    color: Colors.teal,
    fontWeight: '600',
  },
  segmentsList: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  segmentCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.coral,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  segmentAirline: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 13,
  },
  segmentFlightNum: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
    fontWeight: '600',
  },
  segmentRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  segmentPoint: {
    alignItems: 'flex-start',
    minWidth: 60,
  },
  segmentTime: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  segmentDate: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
    marginTop: 2,
  },
  segmentAirport: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.coral,
    marginTop: 4,
  },
  segmentCityName: {
    fontSize: 10,
    color: Colors.onSurfaceDim,
  },
  segmentLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.sm,
    gap: 4,
  },
  segmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.onSurfaceDim,
  },
  segmentDash: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.onSurfaceDim,
    opacity: 0.3,
  },
  segmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  segmentDuration: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  segmentAircraft: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
    opacity: 0.7,
  },
  accomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  accomPowered: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
    opacity: 0.6,
  },
  accomLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  accomLoadingText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 13,
  },
  accomTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  accomTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceMid,
    gap: 4,
  },
  accomTabActive: {
    backgroundColor: Colors.coral,
  },
  accomTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceDim,
  },
  accomTabTextActive: {
    color: '#fff',
  },
  accomDetail: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceMid,
    overflow: 'hidden',
  },
  accomImage: {
    width: 100,
    height: 120,
  },
  accomInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  accomName: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 14,
  },
  accomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  accomStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  accomStarsText: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  accomReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accomReviewScore: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.coral,
    backgroundColor: Colors.coral + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  accomReviewWord: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
  },
  accomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  accomPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.coral,
  },
  accomPerNight: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
  },
  accomType: {
    fontSize: 10,
    color: Colors.onSurfaceDim,
    opacity: 0.7,
    marginTop: 2,
  },
  accomEmpty: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    fontSize: 13,
  },
});