import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { fetchSubsidies, SubsidyResult } from '../src/services/subsidyService';
import { useUserStore } from '../src/store/userStore';

const { width } = Dimensions.get('window');

export default function SubsidiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ budget?: string }>();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SubsidyResult | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const userBudget = params.budget ? parseFloat(params.budget) : (user?.budgetMax || 500);

  useEffect(() => {
    loadSubsidies();
  }, []);

  const loadSubsidies = async () => {
    setLoading(true);
    try {
      const data = await fetchSubsidies({
        age: 22,
        is_student: true,
        country: user?.passportCountry || 'FR',
        has_erasmus: false,
      });
      setResult(data);
    } catch (error) {
      console.error('Error loading subsidies:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = result?.total_potential_savings || 0;
  const realBudget = userBudget + totalSavings;

  const applicableSubsidies = result?.subsidies.filter(s => s.applies) || [];
  const otherSubsidies = result?.subsidies.filter(s => !s.applies) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayudas para viajar</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
          <Text style={styles.loadingText}>Buscando ayudas...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Budget Calculator - Vertical layout */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetTop}>
              <View style={styles.budgetBox}>
                <Text style={styles.budgetSmallLabel}>Tu presupuesto</Text>
                <Text style={styles.budgetSmallValue}>{Math.round(userBudget)}{'\u20AC'}</Text>
              </View>
              <View style={styles.budgetPlusIcon}>
                <Ionicons name="add-circle" size={24} color={Colors.teal} />
              </View>
              <View style={styles.budgetBox}>
                <Text style={styles.budgetSmallLabel}>Ayudas</Text>
                <Text style={[styles.budgetSmallValue, { color: Colors.teal }]}>+{totalSavings}{'\u20AC'}</Text>
              </View>
            </View>
            <View style={styles.budgetDivider} />
            <View style={styles.budgetBottom}>
              <Text style={styles.budgetTotalLabel}>Poder real de tu presupuesto</Text>
              <Text style={styles.budgetTotalValue}>{Math.round(realBudget)}{'\u20AC'}</Text>
            </View>
          </View>

          {/* Eligible subsidies */}
          {applicableSubsidies.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Puedes acceder a estas ayudas
              </Text>

              {applicableSubsidies.map((subsidy, index) => {
                const isExpanded = expandedCard === index;
                return (
                  <TouchableOpacity
                    key={`applicable-${index}`}
                    style={styles.subsidyCard}
                    activeOpacity={0.8}
                    onPress={() => setExpandedCard(isExpanded ? null : index)}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.cardEmoji}>{(subsidy as any).emoji || '\uD83D\uDCB6'}</Text>
                      <View style={styles.cardMainInfo}>
                        <Text style={styles.cardName}>{subsidy.name}</Text>
                        <Text style={styles.cardAmount}>{subsidy.amount}</Text>
                      </View>
                      <View style={styles.eligiblePill}>
                        <Ionicons name="checkmark" size={12} color={Colors.teal} />
                      </View>
                    </View>

                    <Text style={styles.cardDescription}>{subsidy.description}</Text>

                    {isExpanded && (subsidy as any).how_to ? (
                      <View style={styles.howToBox}>
                        <Text style={styles.howToLabel}>Como conseguirlo:</Text>
                        <Text style={styles.howToText}>{(subsidy as any).how_to}</Text>
                        <View style={styles.deadlineRow}>
                          <Ionicons name="time-outline" size={14} color={Colors.onSurfaceDim} />
                          <Text style={styles.deadlineText}>{subsidy.next_deadline}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.tapHint}>Toca para ver como aplicar</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Other subsidies */}
          {otherSubsidies.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
                Otras ayudas europeas
              </Text>
              <Text style={styles.sectionSubtitle}>
                No aplican a tu perfil actual, pero podrian en el futuro
              </Text>

              {otherSubsidies.map((subsidy, index) => (
                <View key={`other-${index}`} style={styles.subsidyCardInactive}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardEmoji}>{(subsidy as any).emoji || '\uD83D\uDCB6'}</Text>
                    <View style={styles.cardMainInfo}>
                      <Text style={[styles.cardName, { color: Colors.onSurfaceDim }]}>{subsidy.name}</Text>
                      <Text style={[styles.cardAmount, { color: Colors.onSurfaceDim }]}>{subsidy.amount}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardDescription, { color: Colors.onSurfaceDim, opacity: 0.7 }]}>
                    {subsidy.description}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Info note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.onSurfaceDim} />
            <Text style={styles.infoNoteText}>
              Las ayudas son para jovenes europeos de 18-30 anos. Montos y condiciones pueden variar.
            </Text>
          </View>

          <View style={{ height: 40 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.onSurface,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  // Budget Calculator
  budgetCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
  },
  budgetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetBox: {
    flex: 1,
    alignItems: 'center',
  },
  budgetPlusIcon: {
    paddingHorizontal: Spacing.md,
  },
  budgetSmallLabel: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
    marginBottom: 4,
  },
  budgetSmallValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  budgetDivider: {
    height: 1,
    backgroundColor: Colors.surfaceMid,
    marginVertical: Spacing.md,
  },
  budgetBottom: {
    alignItems: 'center',
  },
  budgetTotalLabel: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
    marginBottom: 6,
  },
  budgetTotalValue: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.coral,
  },
  // Section titles
  sectionTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
    fontSize: 17,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.md,
  },
  // Subsidy cards
  subsidyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.teal,
  },
  subsidyCardInactive: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    opacity: 0.55,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm + 2,
  },
  cardMainInfo: {
    flex: 1,
  },
  cardName: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 15,
  },
  cardAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.teal,
    marginTop: 2,
  },
  eligiblePill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 218, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.onSurfaceDim,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  tapHint: {
    fontSize: 12,
    color: Colors.teal,
    fontWeight: '600',
    opacity: 0.8,
  },
  // How To section (expanded)
  howToBox: {
    backgroundColor: 'rgba(96, 218, 196, 0.06)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  howToLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  howToText: {
    fontSize: 14,
    color: Colors.onSurface,
    lineHeight: 21,
    marginBottom: Spacing.sm,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  deadlineText: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  // Info note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.onSurfaceDim,
    lineHeight: 17,
  },
});
