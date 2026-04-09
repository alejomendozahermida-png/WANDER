import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { fetchAIItinerary, AIItineraryResponse, AIItineraryDay } from '../../src/services/aiService';

const ACTIVITY_ICONS: Record<string, string> = {
  culture: 'library',
  food: 'restaurant',
  leisure: 'sunny',
  nightlife: 'moon',
  nature: 'leaf',
  shopping: 'bag-handle',
};

const ACTIVITY_COLORS: Record<string, string> = {
  culture: '#9B59B6',
  food: '#E67E22',
  leisure: '#3498DB',
  nightlife: '#8E44AD',
  nature: '#27AE60',
  shopping: '#F39C12',
};

export default function ItineraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    city?: string;
    country?: string;
    days?: string;
    mood?: string;
  }>();
  
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<AIItineraryResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const city = params.city || 'Ciudad';
  const country = params.country || '';
  const tripDays = params.days ? parseInt(params.days) : 3;
  const mood = params.mood || 'culture';

  useEffect(() => {
    generateItinerary();
  }, []);

  const generateItinerary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAIItinerary({
        city,
        country,
        trip_days: tripDays,
        mood,
        budget_level: 'student',
      });
      if (data.error) {
        setError(data.error);
      } else {
        setItinerary(data);
      }
    } catch (err) {
      setError('Error al generar el itinerario');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!itinerary) return;
    try {
      let text = `Itinerario de ${tripDays} dias en ${city}\n\n`;
      itinerary.days.forEach(day => {
        text += `--- Dia ${day.day}: ${day.title} ---\n`;
        day.activities.forEach(act => {
          text += `${act.time} - ${act.title} (${act.cost})\n`;
        });
        text += '\n';
      });
      if (itinerary.local_tips?.length > 0) {
        text += 'Tips locales:\n';
        itinerary.local_tips.forEach(tip => {
          text += `- ${tip}\n`;
        });
      }
      await Share.share({
        message: text,
        title: `Itinerario ${city} - Wander`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const currentDay = itinerary?.days?.[selectedDay];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerCity}>{city}</Text>
          <Text style={styles.headerSub}>{tripDays} dias \u00B7 Itinerario IA</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
          <Text style={styles.loadingTitle}>Generando itinerario con IA</Text>
          <Text style={styles.loadingText}>
            Creando actividades personalizadas para {city}...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={Colors.coral} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generateItinerary}>
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : itinerary ? (
        <>
          {/* Day Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabs}
            contentContainerStyle={styles.dayTabsContent}
          >
            {itinerary.days.map((day, idx) => (
              <TouchableOpacity
                key={day.day}
                style={[
                  styles.dayTab,
                  selectedDay === idx && styles.dayTabActive,
                ]}
                onPress={() => setSelectedDay(idx)}
              >
                <Text style={[
                  styles.dayTabNumber,
                  selectedDay === idx && styles.dayTabNumberActive,
                ]}>
                  Dia {day.day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Day Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {currentDay && (
              <>
                <Text style={styles.dayTitle}>{currentDay.title}</Text>

                {currentDay.activities.map((activity, idx) => {
                  const iconName = ACTIVITY_ICONS[activity.type] || 'ellipse';
                  const accentColor = ACTIVITY_COLORS[activity.type] || Colors.coral;

                  return (
                    <View key={idx} style={styles.activityCard}>
                      <View style={styles.timelineContainer}>
                        <View style={[styles.timelineDot, { backgroundColor: accentColor }]}>
                          <Ionicons name={iconName as any} size={14} color="#fff" />
                        </View>
                        {idx < currentDay.activities.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>

                      <View style={styles.activityContent}>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityDesc}>{activity.description}</Text>

                        <View style={styles.activityMeta}>
                          <View style={styles.activityMetaItem}>
                            <Ionicons name="cash-outline" size={14} color={Colors.teal} />
                            <Text style={styles.activityMetaText}>{activity.cost}</Text>
                          </View>
                          <View style={styles.activityMetaItem}>
                            <Ionicons name="location-outline" size={14} color={Colors.coral} />
                            <Text style={styles.activityMetaText}>{activity.location}</Text>
                          </View>
                        </View>

                        {activity.insider_tip ? (
                          <View style={styles.tipContainer}>
                            <Text style={styles.tipLabel}>Tip local</Text>
                            <Text style={styles.tipText}>{activity.insider_tip}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* Local Tips Section */}
            {itinerary.local_tips && itinerary.local_tips.length > 0 && (
              <View style={styles.tipsSection}>
                <Text style={styles.tipsSectionTitle}>Consejos locales</Text>
                {itinerary.local_tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItem}>
                    <Text style={styles.tipBullet}>\u2022</Text>
                    <Text style={styles.tipItemText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* PDF Coming Soon */}
            <View style={styles.pdfBanner}>
              <Ionicons name="document-text-outline" size={20} color={Colors.onSurfaceDim} />
              <Text style={styles.pdfText}>Guardar en PDF \u2014 Proximamente</Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      ) : null}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerCity: {
    ...Typography.h2,
    color: Colors.onSurface,
    fontSize: 20,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingTitle: {
    ...Typography.h2,
    color: Colors.onSurface,
    marginTop: Spacing.xl,
    textAlign: 'center',
    fontSize: 20,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.coral,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    gap: Spacing.sm,
  },
  retryText: {
    ...Typography.bodySemibold,
    color: Colors.white,
  },
  dayTabs: {
    maxHeight: 52,
  },
  dayTabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  dayTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
  },
  dayTabActive: {
    backgroundColor: Colors.coral,
    borderColor: Colors.coral,
  },
  dayTabNumber: {
    ...Typography.bodySemibold,
    fontSize: 14,
    color: Colors.onSurfaceDim,
  },
  dayTabNumberActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  dayTitle: {
    ...Typography.h2,
    color: Colors.onSurface,
    fontSize: 22,
    marginBottom: Spacing.lg,
  },
  activityCard: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  timelineContainer: {
    alignItems: 'center',
    width: 36,
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.surfaceMid,
    marginTop: 4,
  },
  activityContent: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.coral,
    marginBottom: 4,
  },
  activityTitle: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  activityDesc: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityMetaText: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  tipContainer: {
    backgroundColor: 'rgba(96, 218, 196, 0.08)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: 4,
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: Colors.onSurface,
    lineHeight: 17,
  },
  tipsSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  tipsSectionTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    paddingRight: Spacing.md,
  },
  tipBullet: {
    color: Colors.teal,
    fontSize: 16,
    marginRight: Spacing.sm,
    lineHeight: 20,
  },
  tipItemText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  pdfBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
    borderStyle: 'dashed',
  },
  pdfText: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
    fontWeight: '500',
  },
});
