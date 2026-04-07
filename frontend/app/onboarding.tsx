import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { useUserStore } from '../src/store/userStore';
import { Colors, Spacing, BorderRadius, Typography } from '../src/constants/theme';
import { MOODS } from '../src/constants/moods';
import { NATIONALITIES, POPULAR_AIRPORTS } from '../src/services/mockData';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useUserStore();
  const [step, setStep] = useState(1);
  
  // Step 1
  const [firstName, setFirstName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportCountry, setPassportCountry] = useState('');
  const [showNationalityModal, setShowNationalityModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  
  // Step 2
  const [homeCity, setHomeCity] = useState('');
  const [homeAirport, setHomeAirport] = useState<any>(null);
  const [showAirportModal, setShowAirportModal] = useState(false);
  
  // Step 3
  const [budgetMin, setBudgetMin] = useState(50);
  const [budgetMax, setBudgetMax] = useState(300);
  
  // Step 4
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [travelsAlone, setTravelsAlone] = useState(false);

  const progress = (step / 4) * 100;

  const handleNext = () => {
    if (step === 1 && (!firstName || !nationality || !passportCountry)) {
      return;
    }
    if (step === 2 && !homeAirport) {
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await updateProfile({
        firstName,
        nationality,
        passportCountry,
        homeCity: homeAirport?.city || homeCity,
        homeAirportIata: homeAirport?.iata || '',
        budgetMin,
        budgetMax,
        travelStyle: selectedVibes,
        travelsAlone,
        onboardingComplete: true,
      });
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil. Por favor intenta de nuevo.');
    }
  };

  const toggleVibe = (vibeId: string) => {
    if (selectedVibes.includes(vibeId)) {
      setSelectedVibes(selectedVibes.filter(v => v !== vibeId));
    } else {
      setSelectedVibes([...selectedVibes, vibeId]);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Quién eres?</Text>
      <Text style={styles.stepSubtitle}>Cuéntanos un poco sobre ti</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor={Colors.onSurfaceDim}
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nacionalidad</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowNationalityModal(true)}
        >
          <Text style={nationality ? styles.inputText : styles.placeholderText}>
            {nationality ? NATIONALITIES.find(n => n.code === nationality)?.name : 'Selecciona tu nacionalidad'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>País del pasaporte</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowPassportModal(true)}
        >
          <Text style={passportCountry ? styles.inputText : styles.placeholderText}>
            {passportCountry ? NATIONALITIES.find(n => n.code === passportCountry)?.name : 'Selecciona el país de tu pasaporte'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Desde dónde viajas?</Text>
      <Text style={styles.stepSubtitle}>Selecciona tu aeropuerto base</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Aeropuerto</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowAirportModal(true)}
        >
          <Text style={homeAirport ? styles.inputText : styles.placeholderText}>
            {homeAirport 
              ? `${homeAirport.city} (${homeAirport.iata}) - ${homeAirport.name}`
              : 'Selecciona tu aeropuerto'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Cuál es tu presupuesto?</Text>
      <Text style={styles.stepSubtitle}>Por viaje completo (vuelo + alojamiento)</Text>

      <View style={styles.budgetContainer}>
        <Text style={styles.budgetLabel}>Viajo con</Text>
        <Text style={styles.budgetAmount}>{budgetMin}€ - {budgetMax}€</Text>
      </View>

      <View style={styles.presetsContainer}>
        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => { setBudgetMin(50); setBudgetMax(150); }}
        >
          <Text style={styles.presetLabel}>Estudiante</Text>
          <Text style={styles.presetRange}>50-150€</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => { setBudgetMin(150); setBudgetMax(300); }}
        >
          <Text style={styles.presetLabel}>Equilibrado</Text>
          <Text style={styles.presetRange}>150-300€</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => { setBudgetMin(300); setBudgetMax(500); }}
        >
          <Text style={styles.presetLabel}>Confort</Text>
          <Text style={styles.presetRange}>300-500€</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>50€</Text>
        <Text style={styles.sliderLabel}>500€</Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Cuál es tu vibe?</Text>
      <Text style={styles.stepSubtitle}>Selecciona tus preferencias (puedes elegir varias)</Text>

      <View style={styles.vibesGrid}>
        {MOODS.map(mood => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.vibeCard,
              selectedVibes.includes(mood.id) && styles.vibeCardSelected,
            ]}
            onPress={() => toggleVibe(mood.id)}
          >
            <Text style={styles.vibeEmoji}>{mood.emoji}</Text>
            <Text style={[
              styles.vibeLabel,
              selectedVibes.includes(mood.id) && styles.vibeLabelSelected,
            ]}>
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.aloneContainer}>
        <Text style={styles.aloneLabel}>¿Viajas solo o con amigos?</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !travelsAlone && styles.toggleButtonActive,
            ]}
            onPress={() => setTravelsAlone(false)}
          >
            <Text style={[
              styles.toggleText,
              !travelsAlone && styles.toggleTextActive,
            ]}>
              Con amigos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              travelsAlone && styles.toggleButtonActive,
            ]}
            onPress={() => setTravelsAlone(true)}
          >
            <Text style={[
              styles.toggleText,
              travelsAlone && styles.toggleTextActive,
            ]}>
              Solo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCountryModal = (visible: boolean, onClose: () => void, onSelect: (code: string) => void) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona un país</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={NATIONALITIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  onSelect(item.code);
                  onClose();
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderAirportModal = () => (
    <Modal visible={showAirportModal} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona tu aeropuerto</Text>
            <TouchableOpacity onPress={() => setShowAirportModal(false)}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={POPULAR_AIRPORTS}
            keyExtractor={(item) => item.iata}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setHomeAirport(item);
                  setShowAirportModal(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {item.city} ({item.iata})
                </Text>
                <Text style={styles.modalItemSubtext}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>Paso {step} de 4</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <Button
            title="Atrás"
            onPress={() => setStep(step - 1)}
            variant="outline"
            style={styles.backButton}
          />
        )}
        <Button
          title={step === 4 ? 'Comenzar a explorar' : 'Siguiente'}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>

      {renderCountryModal(showNationalityModal, () => setShowNationalityModal(false), setNationality)}
      {renderCountryModal(showPassportModal, () => setShowPassportModal(false), setPassportCountry)}
      {renderAirportModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.coral,
  },
  progressText: {
    ...Typography.label,
    color: Colors.onSurfaceDim,
    fontSize: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  stepContent: {
    paddingTop: Spacing.xl,
  },
  stepTitle: {
    ...Typography.h1,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  inputText: {
    color: Colors.onSurface,
    fontSize: 16,
  },
  placeholderText: {
    color: Colors.onSurfaceDim,
    fontSize: 16,
  },
  budgetContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  budgetLabel: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.sm,
  },
  budgetAmount: {
    ...Typography.h1,
    fontSize: 48,
    color: Colors.coral,
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  presetButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  presetLabel: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 14,
  },
  presetRange: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 12,
    marginTop: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  sliderLabel: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
  },
  vibesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  vibeCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 4) / 3,
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    margin: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vibeCardSelected: {
    backgroundColor: Colors.coral,
    borderColor: Colors.coral,
  },
  vibeEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  vibeLabel: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    fontSize: 14,
  },
  vibeLabelSelected: {
    color: Colors.white,
  },
  aloneContainer: {
    marginTop: Spacing.xl,
  },
  aloneLabel: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.pill,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
  },
  toggleButtonActive: {
    backgroundColor: Colors.coral,
  },
  toggleText: {
    ...Typography.bodySemibold,
    color: Colors.onSurfaceDim,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  modalItem: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  modalItemText: {
    ...Typography.body,
    color: Colors.onSurface,
  },
  modalItemSubtext: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
    marginTop: 4,
  },
});