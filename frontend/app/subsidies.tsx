import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { fetchSubsidies, Subsidy, SubsidyResult } from '../src/services/subsidyService';
import { useUserStore } from '../src/store/userStore';

export default function SubsidiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ budget?: string }>();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SubsidyResult | null>(null);
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

  const realBudget = userBudget + (result?.total_potential_savings || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayudas Europeas</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
          <Text style={styles.loadingText}>Calculando ayudas disponibles...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Budget Calculator Card */}
          <View style={styles.budgetCard}>
            <Text style={styles.budgetTitle}>Tu presupuesto real</Text>
            <View style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Tu presupuesto</Text>
                <Text style={styles.budgetValue}>{Math.round(userBudget)}\u20AC</Text>
              </View>
              <View style={styles.budgetPlus}>
                <Text style={styles.budgetPlusText}>+</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Ayudas</Text>
                <Text style={[styles.budgetValue, { color: Colors.teal }]}>
                  {result?.total_potential_savings || 0}\u20AC
                </Text>
              </View>
              <View style={styles.budgetEquals}>
                <Text style={styles.budgetPlusText}>=</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Total real</Text>
                <Text style={[styles.budgetValue, { color: Colors.coral }]}>
                  {Math.round(realBudget)}\u20AC
                </Text>
              </View>
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={Colors.teal} />
            <Text style={styles.infoText}>
              Estas ayudas son para jovenes europeos (18-30). Las condiciones pueden variar.
            </Text>
          </View>

          {/* Subsidies List */}
          <Text style={styles.sectionTitle}>
            {result?.applicable_count || 0} ayudas disponibles para ti
          </Text>

          {result?.subsidies.map((subsidy, index) => (
            <View
              key={index}
              style={[
                styles.subsidyCard,
                !subsidy.applies && styles.subsidyCardInactive,
              ]}
            >
              <View style={styles.subsidyHeader}>
                <View style={styles.subsidyNameRow}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: subsidy.applies ? Colors.teal : Colors.onSurfaceDim }
                  ]} />
                  <Text style={[
                    styles.subsidyName,
                    !subsidy.applies && styles.subsidyNameInactive
                  ]}>
                    {subsidy.name}
                  </Text>
                </View>
                {subsidy.applies && (
                  <View style={styles.applicableBadge}>
                    <Text style={styles.applicableText}>Elegible</Text>
                  </View>
                )}
              </View>

              <Text style={[
                styles.subsidyDescription,
                !subsidy.applies && styles.subsidyDescInactive
              ]}>
                {subsidy.description}
              </Text>

              <View style={styles.subsidyFooter}>
                <View style={styles.subsidyAmountContainer}>
                  <Text style={styles.subsidyAmountLabel}>Monto:</Text>
                  <Text style={[
                    styles.subsidyAmount,
                    !subsidy.applies && { color: Colors.onSurfaceDim }
                  ]}>
                    {subsidy.amount}
                  </Text>
                </View>

                <View style={styles.subsidyDeadlineContainer}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.onSurfaceDim} />
                  <Text style={styles.subsidyDeadline}>{subsidy.next_deadline}</Text>
                </View>
              </View>

              {subsidy.applies && (
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {
                    Alert.alert(
                      subsidy.name,
                      `Para aplicar a ${subsidy.name}:\n\n${subsidy.description}\n\nMonto: ${subsidy.amount}\nDeadline: ${subsidy.next_deadline}\n\nBusca "${subsidy.name}" en tu navegador para mas informacion.`,
                      [{ text: 'Entendido', style: 'default' }]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="information-circle" size={16} color={Colors.background} />
                  <Text style={styles.applyButtonText}>Mas informacion</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h2,
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
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  budgetCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
  },
  budgetTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetItem: {
    alignItems: 'center',
    flex: 1,
  },
  budgetLabel: {
    fontSize: 11,
    color: Colors.onSurfaceDim,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  budgetPlus: {
    width: 24,
    alignItems: 'center',
  },
  budgetEquals: {
    width: 24,
    alignItems: 'center',
  },
  budgetPlusText: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.onSurfaceDim,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 218, 196, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurfaceDim,
    lineHeight: 18,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  subsidyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.teal,
  },
  subsidyCardInactive: {
    borderLeftColor: Colors.surfaceMid,
    opacity: 0.6,
  },
  subsidyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subsidyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  subsidyName: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    flex: 1,
  },
  subsidyNameInactive: {
    color: Colors.onSurfaceDim,
  },
  applicableBadge: {
    backgroundColor: 'rgba(96, 218, 196, 0.15)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  applicableText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.teal,
  },
  subsidyDescription: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  subsidyDescInactive: {
    color: Colors.onSurfaceDim,
  },
  subsidyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subsidyAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subsidyAmountLabel: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  subsidyAmount: {
    ...Typography.bodySemibold,
    fontSize: 14,
    color: Colors.teal,
  },
  subsidyDeadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subsidyDeadline: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.teal,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  applyButtonText: {
    ...Typography.bodySemibold,
    color: Colors.background,
    fontSize: 14,
  },
});
