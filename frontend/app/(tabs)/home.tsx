import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { useUserStore } from '../../src/store/userStore';
import { useSearchStore } from '../../src/store/searchStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { MOODS } from '../../src/constants/moods';
import { TRENDING_DESTINATIONS } from '../../src/services/mockData';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { setDates, setMood, selectedMood } = useSearchStore();
  
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!departureDate || !returnDate || !currentMood) {
      return;
    }

    setIsSearching(true);
    setDates(departureDate, returnDate);
    setMood(currentMood);

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
      router.push('/results');
    }, 1500);
  };

  const handleMoodSelect = (moodId: string) => {
    setCurrentMood(moodId);
  };

  const canSearch = departureDate && returnDate && currentMood;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hola {user?.firstName || 'viajero'},</Text>
            <Text style={styles.hero}>¿a dónde?</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Form */}
        <View style={styles.searchForm}>
          {/* Dates */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDeparturePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.coral} />
              <Text style={styles.dateLabel}>Salida</Text>
              <Text style={styles.dateValue}>
                {departureDate ? format(departureDate, 'dd MMM', { locale: es }) : 'Seleccionar'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dateDivider} />

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowReturnPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.coral} />
              <Text style={styles.dateLabel}>Regreso</Text>
              <Text style={styles.dateValue}>
                {returnDate ? format(returnDate, 'dd MMM', { locale: es }) : 'Seleccionar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mood Selector */}
          <View style={styles.moodContainer}>
            <Text style={styles.moodTitle}>Selecciona tu mood</Text>
            <View style={styles.moodGrid}>
              {MOODS.slice(0, 4).map(mood => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodButton,
                    currentMood === mood.id && styles.moodButtonActive,
                  ]}
                  onPress={() => handleMoodSelect(mood.id)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    currentMood === mood.id && styles.moodLabelActive,
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search Button */}
          <Button
            title="Encontrar mi viaje →"
            onPress={handleSearch}
            disabled={!canSearch}
            loading={isSearching}
            style={styles.searchButton}
          />
        </View>

        {/* Trending Section */}
        <View style={styles.trendingSection}>
          <View style={styles.trendingSectionHeader}>
            <Text style={styles.trendingLabel}>DESTINOS POPULARES</Text>
            <Text style={styles.trendingTitle}>Descubre Europa</Text>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}
          >
            {TRENDING_DESTINATIONS.slice(0, 6).map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={styles.trendingCard}
                onPress={() => router.push(`/detail/${dest.id}`)}
              >
                <Image
                  source={{ uri: dest.imageUrl }}
                  style={styles.trendingImage}
                />
                <View style={styles.trendingOverlay}>
                  <Text style={styles.trendingCity}>{dest.city}</Text>
                  <Text style={styles.trendingCountry}>{dest.country}</Text>
                  <View style={styles.trendingPrice}>
                    <Text style={styles.trendingPriceText}>desde {dest.totalPrice}€</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showDeparturePicker && (
        <DateTimePicker
          value={departureDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDeparturePicker(Platform.OS === 'ios');
            if (date) setDepartureDate(date);
          }}
        />
      )}
      {showReturnPicker && (
        <DateTimePicker
          value={returnDate || new Date()}
          mode="date"
          display="default"
          minimumDate={departureDate || new Date()}
          onChange={(event, date) => {
            setShowReturnPicker(Platform.OS === 'ios');
            if (date) setReturnDate(date);
          }}
        />
      )}
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.xs,
  },
  hero: {
    ...Typography.displayMedium,
    color: Colors.coral,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  searchForm: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
  dateContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.pill,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  dateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dateDivider: {
    width: 1,
    backgroundColor: Colors.surfaceMid,
    marginVertical: Spacing.sm,
  },
  dateLabel: {
    ...Typography.label,
    color: Colors.onSurfaceDim,
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  dateValue: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    marginTop: 4,
  },
  moodContainer: {
    marginBottom: Spacing.lg,
  },
  moodTitle: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  moodButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonActive: {
    backgroundColor: Colors.coral,
    borderColor: Colors.coral,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 12,
  },
  moodLabelActive: {
    color: Colors.white,
  },
  searchButton: {
    marginTop: Spacing.md,
  },
  trendingSection: {
    marginTop: Spacing.xl,
  },
  trendingSectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  trendingLabel: {
    ...Typography.label,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.xs,
  },
  trendingTitle: {
    ...Typography.displaySmall,
    color: Colors.onSurface,
  },
  trendingScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.lg,
  },
  trendingCard: {
    width: CARD_WIDTH,
    height: 300,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  trendingCity: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: 4,
  },
  trendingCountry: {
    ...Typography.body,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.sm,
  },
  trendingPrice: {
    backgroundColor: Colors.coral,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  trendingPriceText: {
    ...Typography.bodySemibold,
    color: Colors.white,
    fontSize: 14,
  },
});