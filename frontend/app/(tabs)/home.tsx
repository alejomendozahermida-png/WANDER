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
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../src/store/userStore';
import { useSearchStore } from '../../src/store/searchStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { MOODS } from '../../src/constants/moods';
import { TRENDING_DESTINATIONS } from '../../src/services/mockData';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.65;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { setDates, setMood, selectedMood } = useSearchStore();

  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'departure' | 'return'>('departure');
  const [currentMood, setCurrentMood] = useState<string | null>(null);

  const handleDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);

    if (calendarMode === 'departure') {
      setDepartureDate(selectedDate);
      if (returnDate && returnDate <= selectedDate) {
        setReturnDate(null);
      }
      setTimeout(() => {
        setCalendarMode('return');
      }, 300);
    } else {
      setReturnDate(selectedDate);
      setShowCalendar(false);
    }
  };

  const openCalendar = (mode: 'departure' | 'return') => {
    setCalendarMode(mode);
    setShowCalendar(true);
  };

  const getMarkedDates = () => {
    const marked: any = {};

    if (departureDate) {
      const depKey = format(departureDate, 'yyyy-MM-dd');
      marked[depKey] = {
        startingDay: true,
        color: Colors.coral,
        textColor: Colors.white,
      };
    }

    if (returnDate) {
      const retKey = format(returnDate, 'yyyy-MM-dd');
      marked[retKey] = {
        endingDay: true,
        color: Colors.teal,
        textColor: Colors.white,
      };
    }

    if (departureDate && returnDate) {
      const start = new Date(departureDate);
      const end = new Date(returnDate);
      const current = new Date(start);
      current.setDate(current.getDate() + 1);
      while (current < end) {
        const key = format(current, 'yyyy-MM-dd');
        marked[key] = {
          color: 'rgba(216, 90, 48, 0.12)',
          textColor: Colors.onSurface,
        };
        current.setDate(current.getDate() + 1);
      }
    }

    return marked;
  };

  const handleSearch = async () => {
    if (!departureDate || !returnDate || !currentMood) return;
    if (returnDate <= departureDate) {
      alert('La fecha de regreso debe ser despues de la fecha de salida');
      return;
    }
    setDates(departureDate, returnDate);
    setMood(currentMood);
    router.push('/results');
  };

  const handleMoodSelect = (moodId: string) => {
    setCurrentMood(moodId);
  };

  const canSearch = departureDate && returnDate && currentMood && returnDate > departureDate;

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
            <Text style={styles.hero}>¿a donde?</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
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
              onPress={() => openCalendar('departure')}
              activeOpacity={0.7}
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
              onPress={() => openCalendar('return')}
              activeOpacity={0.7}
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
                  activeOpacity={0.7}
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
          <TouchableOpacity
            style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
            onPress={handleSearch}
            disabled={!canSearch}
            activeOpacity={0.8}
          >
            <Text style={styles.searchBtnText}>Encontrar mi viaje</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Trending Section */}
        <View style={styles.trendingSection}>
          <View style={styles.trendingHeader}>
            <View>
              <Text style={styles.trendingLabel}>POPULARES</Text>
              <Text style={styles.trendingTitle}>Descubre el mundo</Text>
            </View>
            <Ionicons name="compass-outline" size={22} color={Colors.onSurfaceDim} />
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
                activeOpacity={0.9}
                onPress={() => router.push(`/detail/${dest.id}`)}
              >
                <Image
                  source={{ uri: dest.imageUrl }}
                  style={styles.trendingImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={styles.trendingGradient}
                >
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingCity}>{dest.city}</Text>
                    <Text style={styles.trendingCountry}>{dest.country}</Text>
                  </View>
                  <View style={styles.trendingPricePill}>
                    <Text style={styles.trendingPriceText}>desde {dest.totalPrice}€</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View style={styles.calendarModal}>
            <View style={styles.calendarHandle} />
            <View style={styles.calendarHeader}>
              <View>
                <Text style={styles.calendarTitle}>
                  {calendarMode === 'departure' ? 'Fecha de salida' : 'Fecha de regreso'}
                </Text>
                <Text style={styles.calendarSubtitle}>
                  {calendarMode === 'departure' ? 'Selecciona cuando sales' : 'Selecciona cuando vuelves'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={28} color={Colors.onSurfaceDim} />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              markingType="period"
              minDate={calendarMode === 'departure' ? format(new Date(), 'yyyy-MM-dd') : (departureDate ? format(new Date(departureDate.getTime() + 86400000), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))}
              theme={{
                backgroundColor: Colors.surface,
                calendarBackground: Colors.surface,
                textSectionTitleColor: Colors.onSurfaceDim,
                selectedDayBackgroundColor: Colors.coral,
                selectedDayTextColor: Colors.white,
                todayTextColor: Colors.coral,
                dayTextColor: Colors.onSurface,
                textDisabledColor: Colors.onSurfaceDim + '40',
                monthTextColor: Colors.onSurface,
                textMonthFontWeight: '700',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                arrowColor: Colors.coral,
              }}
              style={styles.calendar}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxl + 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerLeft: { flex: 1 },
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

  // Search Form
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

  // Search Button
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.coral,
    borderRadius: BorderRadius.pill,
    paddingVertical: 16,
    marginTop: Spacing.md,
  },
  searchBtnDisabled: { opacity: 0.4 },
  searchBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },

  // Trending
  trendingSection: { marginTop: Spacing.sm },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  trendingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSurfaceDim,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  trendingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  trendingScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
  },
  trendingCard: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceMid,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  trendingInfo: {
    marginBottom: 6,
  },
  trendingCity: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  trendingCountry: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  trendingPricePill: {
    backgroundColor: Colors.coral,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendingPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // Calendar Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  calendarModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Spacing.xl,
  },
  calendarHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceMid,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  calendarSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
    marginTop: 2,
  },
  calendar: {
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
  },
});
