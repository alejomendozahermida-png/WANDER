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
import { Destination } from '../../src/types';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.4;

export default function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { results } = useSearchStore();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [esimEnabled, setEsimEnabled] = useState(false);

  useEffect(() => {
    // Find destination in results or trending
    const found = [...results, ...TRENDING_DESTINATIONS].find(d => d.id === id);
    if (found) {
      setDestination(found);
    }
  }, [id]);

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

        {/* Trip Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumen del viaje</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="airplane" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.summaryLabel}>Vuelo (CDG → {destination.iata})</Text>
            <Text style={styles.summaryValue}>{destination.flightPrice}€</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bed" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.summaryLabel}>Alojamiento (7 noches)</Text>
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
});