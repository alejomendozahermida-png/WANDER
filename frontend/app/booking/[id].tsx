import React, { useState } from 'react';
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
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useSearchStore } from '../../src/store/searchStore';
import { TRENDING_DESTINATIONS } from '../../src/services/mockData';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { results } = useSearchStore();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'google' | 'apple' | null>(null);

  // Find destination
  const destination = [...results, ...TRENDING_DESTINATIONS].find(d => d.id === id);

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

  const handlePayment = async () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Por favor selecciona un método de pago');
      return;
    }

    setProcessing(true);

    // TODO: Implement Stripe payment when keys are available
    setTimeout(() => {
      setProcessing(false);
      Alert.alert(
        '🎉 ¡Viaje reservado!',
        `Tu viaje a ${destination.city} ha sido confirmado. Recibirás un email con todos los detalles.`,
        [
          {
            text: 'Volver al inicio',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar reserva</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Trip Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumen del viaje</Text>
          
          <View style={styles.destinationRow}>
            <Text style={styles.destinationCity}>{destination.city}</Text>
            <Text style={styles.destinationCountry}>{destination.country}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="airplane" size={16} color={Colors.coral} />
            <Text style={styles.detailLabel}>Vuelo</Text>
            <Text style={styles.detailValue}>{destination.flightPrice}€</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="bed" size={16} color={Colors.coral} />
            <Text style={styles.detailLabel}>Alojamiento</Text>
            <Text style={styles.detailValue}>{destination.hotelPrice}€</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{destination.totalPrice}€</Text>
          </View>
        </Card>

        {/* Payment Method */}
        <Card style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Método de pago</Text>
          <Text style={styles.paymentSubtitle}>
            Pagos procesados de forma segura con Stripe
          </Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <Ionicons 
              name="card" 
              size={24} 
              color={paymentMethod === 'card' ? Colors.coral : Colors.onSurface} 
            />
            <Text style={[
              styles.paymentText,
              paymentMethod === 'card' && styles.paymentTextSelected,
            ]}>
              Tarjeta de crédito/débito
            </Text>
            <View style={[
              styles.radio,
              paymentMethod === 'card' && styles.radioSelected,
            ]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'google' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('google')}
          >
            <Ionicons 
              name="logo-google" 
              size={24} 
              color={paymentMethod === 'google' ? Colors.coral : Colors.onSurface} 
            />
            <Text style={[
              styles.paymentText,
              paymentMethod === 'google' && styles.paymentTextSelected,
            ]}>
              Google Pay
            </Text>
            <View style={[
              styles.radio,
              paymentMethod === 'google' && styles.radioSelected,
            ]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'apple' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('apple')}
          >
            <Ionicons 
              name="logo-apple" 
              size={24} 
              color={paymentMethod === 'apple' ? Colors.coral : Colors.onSurface} 
            />
            <Text style={[
              styles.paymentText,
              paymentMethod === 'apple' && styles.paymentTextSelected,
            ]}>
              Apple Pay
            </Text>
            <View style={[
              styles.radio,
              paymentMethod === 'apple' && styles.radioSelected,
            ]} />
          </TouchableOpacity>
        </Card>

        {/* Terms */}
        <View style={styles.terms}>
          <Text style={styles.termsText}>
            Al continuar, aceptas nuestros{' '}
            <Text style={styles.termsLink}>Términos de servicio</Text> y{' '}
            <Text style={styles.termsLink}>Política de privacidad</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button
          title={processing ? 'Procesando...' : `Pagar ${destination.totalPrice}€`}
          onPress={handlePayment}
          disabled={!paymentMethod || processing}
          loading={processing}
          style={styles.payButton}
        />
      </SafeAreaView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  paymentCard: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  paymentSubtitle: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  destinationRow: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  destinationCity: {
    ...Typography.h1,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  destinationCountry: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.onSurface,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  detailValue: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceMid,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  totalValue: {
    ...Typography.h1,
    color: Colors.coral,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMid,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: Colors.coral,
    backgroundColor: Colors.surface,
  },
  paymentText: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    flex: 1,
    marginLeft: Spacing.md,
  },
  paymentTextSelected: {
    color: Colors.coral,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.onSurfaceDim,
  },
  radioSelected: {
    borderColor: Colors.coral,
    backgroundColor: Colors.coral,
  },
  terms: {
    paddingHorizontal: Spacing.md,
  },
  termsText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.coral,
    textDecorationLine: 'underline',
  },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMid,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  payButton: {
    width: '100%',
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
