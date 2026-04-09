import React, { useEffect, useState, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Toast } from '../../src/components/Toast';
import { useSearchStore } from '../../src/store/searchStore';
import { TRENDING_DESTINATIONS } from '../../src/services/mockData';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Destination, FlightSegment } from '../../src/types';
import { searchAccommodations, Accommodation } from '../../src/services/dealsService';
import { useUserStore } from '../../src/store/userStore';
import { GLOBAL_DESTINATIONS } from '../../src/data/globalDestinations';
import { saveTrip, isTripSaved } from '../../src/services/savedTripsService';

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
  const [savingTrip, setSavingTrip] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [esimEnabled, setEsimEnabled] = useState(false);
  const [accommodations, setAccommodations] = useState<{ budget: Accommodation | null; midrange: Accommodation | null; premium: Accommodation | null } | null>(null);
  const [loadingAccom, setLoadingAccom] = useState(false);
  const [selectedAccom, setSelectedAccom] = useState<'budget' | 'midrange' | 'premium'>('budget');
  const [expandedFlight, setExpandedFlight] = useState<'outbound' | 'inbound' | null>(null);
  const [showAccomModal, setShowAccomModal] = useState(false);
  const [modalAccom, setModalAccom] = useState<Accommodation | null>(null);

  // Look up cost of living index from global destinations
  const globalDest = useMemo(() => {
    if (!destination) return null;
    return GLOBAL_DESTINATIONS.find(gd => gd.iata === destination.iata) || null;
  }, [destination?.iata]);

  const nights = useMemo(() => {
    if (!destination) return 7;
    return calcNights(destination.departureDate, destination.returnDate);
  }, [destination?.departureDate, destination?.returnDate]);

  // Cost of living estimates (per day * nights)
  const costOfLivingIndex = globalDest?.costOfLivingIndex || 5;
  const dailyMealsCost = Math.round(costOfLivingIndex * 6.5);  // 6.5€-65€/day
  const dailyTransportCost = Math.round(costOfLivingIndex * 2.5); // 2.5€-25€/day
  const totalMealsCost = dailyMealsCost * nights;
  const totalTransportCost = dailyTransportCost * nights;

  // Dynamic accommodation price based on selected tab
  const currentAccomPrice = useMemo(() => {
    if (!accommodations || !accommodations[selectedAccom]) {
      return destination?.hotelPrice || 0;
    }
    return Math.round(accommodations[selectedAccom]!.total_price);
  }, [accommodations, selectedAccom, destination?.hotelPrice]);

  useEffect(() => {
    // Find destination in results or trending
    const found = [...results, ...TRENDING_DESTINATIONS].find(d => d.id === id);
    if (found) {
      setDestination(found);
      // Load real accommodations from Booking.com
      loadAccommodations(found);
      // Check if already saved
      if (user?.id) {
        isTripSaved(user.id, found.iata, found.departureDate).then(saved => setIsSaved(saved));
      }
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

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!user?.id) {
      Alert.alert('Inicia sesion', 'Necesitas estar logueado para guardar viajes');
      return;
    }

    if (isSaved) {
      setIsSaved(false);
      setToastMessage('Viaje eliminado de guardados');
      setToastType('info' as any);
      setToastVisible(true);
      return;
    }

    setSavingTrip(true);
    try {
      const result = await saveTrip({
        user_id: user.id,
        destination_city: destination.city,
        destination_iata: destination.iata,
        destination_country: destination.country,
        flight_price: destination.flightPrice,
        flight_details: destination.flightDetails || null,
        hotel_details: accommodations?.[selectedAccom] || null,
        departure_date: destination.departureDate,
        return_date: destination.returnDate,
        mood: null,
        image_url: destination.imageUrl,
        total_price: calculateTotal(),
      });

      if (result.success) {
        setIsSaved(true);
        setToastMessage('Viaje guardado exitosamente');
        setToastType('success');
        setToastVisible(true);
      } else {
        setToastMessage('Error al guardar el viaje');
        setToastType('error');
        setToastVisible(true);
      }
    } catch (error) {
      setToastMessage('Error al guardar el viaje');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setSavingTrip(false);
    }
  };

  const handleItinerary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/itinerary/[id]',
      params: {
        id: destination.id,
        city: destination.city,
        country: destination.country,
        days: String(nights),
        mood: 'culture',
      },
    });
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
    let total = (destination.flightPrice || 0) + currentAccomPrice + totalMealsCost + totalTransportCost;
    if (insuranceEnabled) total += 8;
    if (esimEnabled) total += 5;
    return Math.round(total);
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
            <Text style={styles.summaryLabel}>Alojamiento ({nights} noches)</Text>
            <Text style={styles.summaryValue}>{currentAccomPrice}€</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="restaurant" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.summaryLabel}>Comidas ({dailyMealsCost}€/dia x {nights})</Text>
            <Text style={styles.summaryValue}>{totalMealsCost}€</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bus" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.summaryLabel}>Transporte ({dailyTransportCost}€/dia x {nights})</Text>
            <Text style={styles.summaryValue}>{totalTransportCost}€</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total estimado</Text>
            <Text style={styles.summaryTotalValue}>{calculateTotal()}€</Text>
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setModalAccom(accommodations[selectedAccom]!);
                    setShowAccomModal(true);
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

        {/* AI Itinerary Button */}
        <Card style={styles.addonsCard}>
          <TouchableOpacity
            style={styles.itineraryButton}
            onPress={handleItinerary}
            activeOpacity={0.7}
          >
            <View style={styles.itineraryIcon}>
              <Ionicons name="sparkles" size={22} color={Colors.coral} />
            </View>
            <View style={styles.itineraryInfo}>
              <Text style={styles.itineraryTitle}>Generar itinerario con IA</Text>
              <Text style={styles.itinerarySubtitle}>
                Plan dia a dia personalizado para {destination.city}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.onSurfaceDim} />
          </TouchableOpacity>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Accommodation Detail Modal */}
      <Modal
        visible={showAccomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del alojamiento</Text>
              <TouchableOpacity
                onPress={() => setShowAccomModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            {modalAccom && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hotel Photo */}
                {modalAccom.photo_url ? (
                  <Image
                    source={{ uri: modalAccom.photo_url }}
                    style={styles.modalImage}
                  />
                ) : (
                  <View style={[styles.modalImage, { backgroundColor: Colors.surfaceMid, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="bed" size={48} color={Colors.onSurfaceDim} />
                  </View>
                )}

                {/* Hotel Info */}
                <View style={styles.modalBody}>
                  <Text style={styles.modalAccomName}>{modalAccom.name}</Text>
                  <Text style={styles.modalAccomType}>{modalAccom.accommodation_type}</Text>

                  {/* Rating Row */}
                  <View style={styles.modalRatingRow}>
                    {modalAccom.stars > 0 && (
                      <View style={styles.modalStars}>
                        {Array.from({ length: modalAccom.stars }).map((_, i) => (
                          <Ionicons key={i} name="star" size={16} color="#FFD700" />
                        ))}
                      </View>
                    )}
                    {modalAccom.review_score > 0 && (
                      <View style={styles.modalReviewBadge}>
                        <Text style={styles.modalReviewScore}>{modalAccom.review_score}</Text>
                        <Text style={styles.modalReviewWord}>{modalAccom.review_word}</Text>
                      </View>
                    )}
                  </View>

                  {/* Address */}
                  {modalAccom.address ? (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="location" size={18} color={Colors.coral} />
                      <Text style={styles.modalInfoText}>{modalAccom.address}</Text>
                    </View>
                  ) : null}

                  {/* Distance */}
                  {modalAccom.distance_to_center ? (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="navigate" size={18} color={Colors.teal} />
                      <Text style={styles.modalInfoText}>{modalAccom.distance_to_center} del centro</Text>
                    </View>
                  ) : null}

                  {/* Price Section */}
                  <View style={styles.modalPriceSection}>
                    <View style={styles.modalPriceMain}>
                      <Text style={styles.modalPriceTotal}>{Math.round(modalAccom.total_price)}€</Text>
                      <Text style={styles.modalPriceNights}>total ({nights} noches)</Text>
                    </View>
                    <View style={styles.modalPricePerNight}>
                      <Text style={styles.modalPricePerNightValue}>{Math.round(modalAccom.price_per_night)}€</Text>
                      <Text style={styles.modalPricePerNightLabel}>/noche</Text>
                    </View>
                  </View>

                  {/* Book on Booking.com button */}
                  <TouchableOpacity
                    style={styles.modalBookingBtn}
                    onPress={() => {
                      if (modalAccom.booking_url) Linking.openURL(modalAccom.booking_url);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="open-outline" size={18} color="#fff" />
                    <Text style={styles.modalBookingBtnText}>Ver en Booking.com</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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

      {/* Toast notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: 220,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalAccomName: {
    ...Typography.h2,
    color: Colors.onSurface,
    fontSize: 20,
    marginBottom: 4,
  },
  modalAccomType: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.md,
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalStars: {
    flexDirection: 'row',
    gap: 2,
  },
  modalReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalReviewScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: Colors.coral,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  modalReviewWord: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
    fontWeight: '600',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modalInfoText: {
    ...Typography.body,
    color: Colors.onSurface,
    flex: 1,
    fontSize: 14,
  },
  modalPriceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
  },
  modalPriceMain: {
    alignItems: 'flex-start',
  },
  modalPriceTotal: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.coral,
  },
  modalPriceNights: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
    marginTop: 2,
  },
  modalPricePerNight: {
    alignItems: 'flex-end',
  },
  modalPricePerNightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalPricePerNightLabel: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  modalBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003580',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  modalBookingBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  // AI Itinerary button
  itineraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  itineraryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  itineraryInfo: {
    flex: 1,
  },
  itineraryTitle: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    marginBottom: 2,
  },
  itinerarySubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
  },
});