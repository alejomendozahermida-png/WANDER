import React, { useState, useRef } from 'react';
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
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { useUserStore } from '../src/store/userStore';
import { Colors, Spacing, BorderRadius, Typography } from '../src/constants/theme';
import { NATIONALITIES, POPULAR_AIRPORTS } from '../src/services/mockData';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 6;

const STEP_META = [
  { icon: 'person-outline', title: '¿Quien eres?', subtitle: 'Cuentanos sobre ti para personalizar tu experiencia' },
  { icon: 'airplane-outline', title: '¿Desde donde viajas?', subtitle: 'Buscaremos vuelos desde tu aeropuerto' },
  { icon: 'globe-outline', title: 'Tu perfil viajero', subtitle: 'Idiomas y experiencia' },
  { icon: 'heart-outline', title: 'Tus preferencias', subtitle: 'Companero, clima y prioridades' },
  { icon: 'wallet-outline', title: 'Tu presupuesto', subtitle: 'Vuelo + alojamiento por viaje' },
  { icon: 'sparkles-outline', title: '¿Que te gusta?', subtitle: 'Selecciona tus vibes favoritas' },
];

const LANGUAGES = [
  { code: 'es', label: 'Espanol', flag: '🇪🇸' },
  { code: 'en', label: 'Ingles', flag: '🇬🇧' },
  { code: 'fr', label: 'Frances', flag: '🇫🇷' },
  { code: 'pt', label: 'Portugues', flag: '🇵🇹' },
  { code: 'de', label: 'Aleman', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', label: 'Chino', flag: '🇨🇳' },
  { code: 'ja', label: 'Japones', flag: '🇯🇵' },
  { code: 'ar', label: 'Arabe', flag: '🇸🇦' },
  { code: 'ru', label: 'Ruso', flag: '🇷🇺' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ko', label: 'Coreano', flag: '🇰🇷' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'beginner', icon: '🌱', label: 'Primera vez', desc: 'Es mi primer viaje internacional' },
  { id: 'intermediate', icon: '🧳', label: 'Algo de experiencia', desc: 'He viajado unas cuantas veces' },
  { id: 'expert', icon: '🌍', label: 'Viajero frecuente', desc: 'Viajar es mi estilo de vida' },
];

const COMPANION_OPTIONS = [
  { id: 'solo', icon: '🎒', label: 'Solo/a' },
  { id: 'couple', icon: '💑', label: 'En pareja' },
  { id: 'friends', icon: '👥', label: 'Amigos' },
  { id: 'family', icon: '👨‍👩‍👧‍👦', label: 'Familia' },
];

const CLIMATE_OPTIONS = [
  { id: 'hot', icon: '☀️', label: 'Calor' },
  { id: 'warm', icon: '🌤️', label: 'Templado' },
  { id: 'mild', icon: '🍂', label: 'Fresco' },
  { id: 'cold', icon: '❄️', label: 'Frio' },
  { id: 'any', icon: '🌈', label: 'Igual' },
];

const PRIORITY_OPTIONS = [
  { id: 'price', icon: '💰', label: 'Precio' },
  { id: 'experience', icon: '✨', label: 'Experiencia' },
  { id: 'climate', icon: '🌡️', label: 'Clima' },
  { id: 'safety', icon: '🛡️', label: 'Seguridad' },
  { id: 'food', icon: '🍽️', label: 'Comida' },
];

const BUDGET_PRESETS = [
  { min: 50, max: 200, label: 'Mochilero', icon: '🎒', desc: '50-200€' },
  { min: 200, max: 500, label: 'Estudiante', icon: '🎓', desc: '200-500€' },
  { min: 500, max: 1200, label: 'Confort', icon: '🏨', desc: '500-1.200€' },
  { min: 1200, max: 2500, label: 'Premium', icon: '✈️', desc: '1.200-2.500€' },
];

const VIBE_OPTIONS = [
  { id: 'culture', icon: '🏛️', label: 'Cultura' },
  { id: 'nature', icon: '🌿', label: 'Naturaleza' },
  { id: 'party', icon: '🎉', label: 'Fiesta' },
  { id: 'relax', icon: '🧘', label: 'Relax' },
  { id: 'adventure', icon: '🧗', label: 'Aventura' },
  { id: 'gastronomy', icon: '🍜', label: 'Gastronomia' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useUserStore();
  const [step, setStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const [firstName, setFirstName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportCountry, setPassportCountry] = useState('');
  const [showNationalityModal, setShowNationalityModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [homeAirport, setHomeAirport] = useState<any>(null);
  const [showAirportModal, setShowAirportModal] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [travelExperience, setTravelExperience] = useState<string>('');
  const [travelCompanion, setTravelCompanion] = useState<string>('');
  const [climatePref, setClimatePref] = useState<string>('');
  const [topPriority, setTopPriority] = useState<string>('');
  const [budgetMin, setBudgetMin] = useState(200);
  const [budgetMax, setBudgetMax] = useState(500);
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState(1);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const progress = (step / TOTAL_STEPS) * 100;
  const meta = STEP_META[step - 1];

  const canProceed = () => {
    switch (step) {
      case 1: return firstName && nationality && passportCountry;
      case 2: return !!homeAirport;
      case 3: return selectedLanguages.length > 0 && !!travelExperience;
      case 4: return !!travelCompanion && !!climatePref && !!topPriority;
      case 5: return true;
      case 6: return selectedVibes.length > 0;
      default: return false;
    }
  };

  const animateStep = (newStep: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(newStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS) {
      animateStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) animateStep(step - 1);
  };

  const handleComplete = async () => {
    try {
      await updateProfile({
        firstName, nationality, passportCountry,
        homeCity: homeAirport?.city || '',
        homeAirportIata: homeAirport?.iata || '',
        budgetMin, budgetMax,
        travelStyle: selectedVibes,
        travelsAlone: travelCompanion === 'solo',
        onboardingComplete: true,
        languages: selectedLanguages,
        travelExperience: travelExperience as any,
        travelCompanion: travelCompanion as any,
        climatePref: climatePref as any,
        topPriority: topPriority as any,
        accomPreference: travelCompanion === 'solo' ? 'hostel_dorm' : travelCompanion === 'family' ? 'budget_hotel' : 'hostel_private',
      });
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev => prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]);
  };

  const toggleVibe = (id: string) => {
    setSelectedVibes(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  // ==================== STEP RENDERS ====================
  const renderStep1 = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor={Colors.onSurfaceDim + '80'}
          value={firstName}
          onChangeText={setFirstName}
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nacionalidad</Text>
        <TouchableOpacity style={styles.selectInput} onPress={() => setShowNationalityModal(true)}>
          <Text style={nationality ? styles.selectText : styles.selectPlaceholder}>
            {nationality ? NATIONALITIES.find(n => n.code === nationality)?.name : 'Selecciona tu pais'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.onSurfaceDim} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Pasaporte</Text>
        <TouchableOpacity style={styles.selectInput} onPress={() => setShowPassportModal(true)}>
          <Text style={passportCountry ? styles.selectText : styles.selectPlaceholder}>
            {passportCountry ? NATIONALITIES.find(n => n.code === passportCountry)?.name : 'Pais del pasaporte'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.onSurfaceDim} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <TouchableOpacity style={styles.airportCard} onPress={() => setShowAirportModal(true)}>
        <View style={styles.airportIcon}>
          <Ionicons name="airplane" size={28} color={Colors.coral} />
        </View>
        {homeAirport ? (
          <View>
            <Text style={styles.airportCity}>{homeAirport.city}</Text>
            <Text style={styles.airportCode}>{homeAirport.iata} - {homeAirport.name}</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.airportPlaceholder}>Selecciona tu aeropuerto</Text>
            <Text style={styles.airportHint}>Buscaremos vuelos desde aqui</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={Colors.onSurfaceDim} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.sectionLabel}>Idiomas que hablas</Text>
      <View style={styles.chipGrid}>
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.chip, selectedLanguages.includes(lang.code) && styles.chipActive]}
            onPress={() => toggleLanguage(lang.code)}
          >
            <Text style={styles.chipFlag}>{lang.flag}</Text>
            <Text style={[styles.chipText, selectedLanguages.includes(lang.code) && styles.chipTextActive]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Experiencia viajera</Text>
      {EXPERIENCE_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.listCard, travelExperience === opt.id && styles.listCardActive]}
          onPress={() => setTravelExperience(opt.id)}
        >
          <Text style={styles.listCardIcon}>{opt.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.listCardTitle, travelExperience === opt.id && { color: Colors.coral }]}>{opt.label}</Text>
            <Text style={styles.listCardDesc}>{opt.desc}</Text>
          </View>
          {travelExperience === opt.id && (
            <Ionicons name="checkmark-circle" size={22} color={Colors.coral} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text style={styles.sectionLabel}>¿Con quien viajas?</Text>
      <View style={styles.gridRow}>
        {COMPANION_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.gridCard, travelCompanion === opt.id && styles.gridCardActive]}
            onPress={() => setTravelCompanion(opt.id)}
          >
            <Text style={styles.gridIcon}>{opt.icon}</Text>
            <Text style={[styles.gridLabel, travelCompanion === opt.id && styles.gridLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Clima ideal</Text>
      <View style={styles.gridRow}>
        {CLIMATE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.gridCard, { minWidth: 64 }, climatePref === opt.id && styles.gridCardActive]}
            onPress={() => setClimatePref(opt.id)}
          >
            <Text style={styles.gridIcon}>{opt.icon}</Text>
            <Text style={[styles.gridLabel, climatePref === opt.id && styles.gridLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Tu prioridad #1</Text>
      <View style={styles.gridRow}>
        {PRIORITY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.gridCard, { minWidth: 64 }, topPriority === opt.id && styles.gridCardActive]}
            onPress={() => setTopPriority(opt.id)}
          >
            <Text style={styles.gridIcon}>{opt.icon}</Text>
            <Text style={[styles.gridLabel, topPriority === opt.id && styles.gridLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View>
      <View style={styles.budgetHero}>
        <Text style={styles.budgetValue}>{budgetMin}€ - {budgetMax}€</Text>
        <Text style={styles.budgetHint}>Buscaremos dentro y un poco por encima</Text>
      </View>

      <View style={styles.budgetGrid}>
        {BUDGET_PRESETS.map((preset, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.budgetCard, selectedBudgetPreset === idx && styles.budgetCardActive]}
            onPress={() => { setSelectedBudgetPreset(idx); setBudgetMin(preset.min); setBudgetMax(preset.max); }}
          >
            <Text style={styles.budgetCardIcon}>{preset.icon}</Text>
            <Text style={[styles.budgetCardLabel, selectedBudgetPreset === idx && { color: Colors.coral }]}>{preset.label}</Text>
            <Text style={[styles.budgetCardRange, selectedBudgetPreset === idx && { color: Colors.coral, opacity: 1 }]}>{preset.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View>
      <View style={styles.vibeGrid}>
        {VIBE_OPTIONS.map(vibe => (
          <TouchableOpacity
            key={vibe.id}
            style={[styles.vibeCard, selectedVibes.includes(vibe.id) && styles.vibeCardActive]}
            onPress={() => toggleVibe(vibe.id)}
          >
            <Text style={styles.vibeIcon}>{vibe.icon}</Text>
            <Text style={[styles.vibeLabel, selectedVibes.includes(vibe.id) && styles.vibeLabelActive]}>{vibe.label}</Text>
            {selectedVibes.includes(vibe.id) && (
              <View style={styles.vibeCheck}>
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedVibes.length > 0 && (
        <View style={styles.profilePreview}>
          <View style={styles.previewHeader}>
            <Ionicons name="sparkles" size={16} color={Colors.coral} />
            <Text style={styles.previewTitle}>Tu perfil</Text>
          </View>
          <Text style={styles.previewText}>
            {travelExperience === 'expert' ? 'Viajero experto' : travelExperience === 'intermediate' ? 'Con experiencia' : 'Nuevo viajero'}
            {' · '}{travelCompanion === 'solo' ? 'Solo/a' : travelCompanion === 'couple' ? 'En pareja' : travelCompanion === 'friends' ? 'Con amigos' : 'En familia'}
            {' · '}{budgetMin}-{budgetMax}€
          </Text>
        </View>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  const renderListModal = (visible: boolean, onClose: () => void, data: any[], onSelect: (item: any) => void, keyField: string, labelField: string, title: string) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={28} color={Colors.onSurfaceDim} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item[keyField]}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={styles.modalItemText}>{item[labelField]}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Step Dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, i < step ? styles.dotFilled : {}, i === step - 1 ? styles.dotCurrent : {}]} />
        ))}
      </View>

      {/* Step Header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepIconCircle}>
          <Ionicons name={meta.icon as any} size={24} color={Colors.coral} />
        </View>
        <Text style={styles.stepTitle}>{meta.title}</Text>
        <Text style={styles.stepSubtitle}>{meta.subtitle}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderCurrentStep()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
        ) : <View style={{ width: 48 }} />}

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS ? 'Empezar' : 'Siguiente'}
          </Text>
          <Ionicons name={step === TOTAL_STEPS ? 'rocket-outline' : 'arrow-forward'} size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderListModal(showNationalityModal, () => setShowNationalityModal(false), NATIONALITIES, (item: any) => setNationality(item.code), 'code', 'name', 'Nacionalidad')}
      {renderListModal(showPassportModal, () => setShowPassportModal(false), NATIONALITIES, (item: any) => setPassportCountry(item.code), 'code', 'name', 'Pais del pasaporte')}
      {renderListModal(showAirportModal, () => setShowAirportModal(false), POPULAR_AIRPORTS, (item: any) => setHomeAirport(item), 'iata', 'name', 'Aeropuerto')}
    </SafeAreaView>
  );
}

const CARD_W = (width - Spacing.lg * 2 - Spacing.sm) / 2;
const GRID_CARD_W = (width - Spacing.lg * 2 - Spacing.sm * 3) / 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  // Dots
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceMid },
  dotFilled: { backgroundColor: Colors.coral },
  dotCurrent: { width: 24, borderRadius: 4, backgroundColor: Colors.coral },
  
  // Step Header
  stepHeader: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  stepIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,77,77,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  stepTitle: { fontSize: 26, fontWeight: '800', color: Colors.onSurface, textAlign: 'center', letterSpacing: -0.5 },
  stepSubtitle: { fontSize: 14, color: Colors.onSurfaceDim, textAlign: 'center', marginTop: 4 },
  
  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
  
  // Inputs
  inputGroup: { marginBottom: Spacing.lg },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: 16, color: Colors.onSurface, borderWidth: 1, borderColor: Colors.surfaceMid },
  selectInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.surfaceMid },
  selectText: { fontSize: 16, color: Colors.onSurface },
  selectPlaceholder: { fontSize: 16, color: Colors.onSurfaceDim + '80' },
  
  // Airport card
  airportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceMid },
  airportIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,77,77,0.1)', alignItems: 'center', justifyContent: 'center' },
  airportCity: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  airportCode: { fontSize: 13, color: Colors.onSurfaceDim, marginTop: 2 },
  airportPlaceholder: { fontSize: 16, color: Colors.onSurface, fontWeight: '600' },
  airportHint: { fontSize: 13, color: Colors.onSurfaceDim, marginTop: 2 },
  
  // Section labels
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.onSurfaceDim, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md },
  
  // Chips (languages)
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, gap: 6, borderWidth: 1.5, borderColor: Colors.surfaceMid },
  chipActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,77,77,0.08)' },
  chipFlag: { fontSize: 18 },
  chipText: { fontSize: 13, color: Colors.onSurfaceDim, fontWeight: '600' },
  chipTextActive: { color: Colors.coral },
  
  // List cards (experience)
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.surfaceMid },
  listCardActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,77,77,0.06)' },
  listCardIcon: { fontSize: 28 },
  listCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  listCardDesc: { fontSize: 12, color: Colors.onSurfaceDim, marginTop: 2 },
  
  // Grid cards (companion, climate, priority)
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gridCard: { width: GRID_CARD_W, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, paddingHorizontal: 4, borderWidth: 1.5, borderColor: Colors.surfaceMid },
  gridCardActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,77,77,0.08)' },
  gridIcon: { fontSize: 24, marginBottom: 4 },
  gridLabel: { fontSize: 11, color: Colors.onSurfaceDim, fontWeight: '700', textAlign: 'center' },
  gridLabelActive: { color: Colors.coral },
  
  // Budget
  budgetHero: { alignItems: 'center', marginBottom: Spacing.xl, paddingVertical: Spacing.md },
  budgetValue: { fontSize: 38, fontWeight: '900', color: Colors.coral, letterSpacing: -1 },
  budgetHint: { fontSize: 13, color: Colors.onSurfaceDim, marginTop: 6 },
  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  budgetCard: { width: CARD_W, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.xl, borderWidth: 1.5, borderColor: Colors.surfaceMid },
  budgetCardActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,77,77,0.08)' },
  budgetCardIcon: { fontSize: 32, marginBottom: 8 },
  budgetCardLabel: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  budgetCardRange: { fontSize: 13, color: Colors.onSurfaceDim, marginTop: 4, opacity: 0.8 },
  
  // Vibes
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  vibeCard: { width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingVertical: Spacing.xl, borderWidth: 1.5, borderColor: Colors.surfaceMid },
  vibeCardActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,77,77,0.08)' },
  vibeIcon: { fontSize: 36, marginBottom: 8 },
  vibeLabel: { fontSize: 13, fontWeight: '700', color: Colors.onSurfaceDim },
  vibeLabelActive: { color: Colors.coral },
  vibeCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.coral, alignItems: 'center', justifyContent: 'center' },
  
  // Profile preview
  profilePreview: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.xl, borderLeftWidth: 3, borderLeftColor: Colors.coral },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: Colors.coral },
  previewText: { fontSize: 13, color: Colors.onSurfaceDim, lineHeight: 20 },
  
  // Bottom nav
  bottomNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.md },
  backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.coral, borderRadius: BorderRadius.pill, paddingVertical: 16, gap: 8 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.surfaceMid },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  modalItem: { paddingVertical: 14, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.surfaceMid },
  modalItemText: { fontSize: 16, color: Colors.onSurface },
});
