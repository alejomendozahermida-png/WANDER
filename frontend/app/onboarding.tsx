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
import { NATIONALITIES, POPULAR_AIRPORTS } from '../src/services/mockData';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 6;

// ==================== DATA ====================
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
  { id: 'solo', icon: '🎒', label: 'Solo/a', desc: 'Aventura en solitario' },
  { id: 'couple', icon: '💑', label: 'En pareja', desc: 'Viaje romantico' },
  { id: 'friends', icon: '👥', label: 'Con amigos', desc: 'Grupo de amigos' },
  { id: 'family', icon: '👨‍👩‍👧‍👦', label: 'En familia', desc: 'Viaje familiar' },
];

const CLIMATE_OPTIONS = [
  { id: 'hot', icon: '☀️', label: 'Calor', desc: '30°C+, playa y sol' },
  { id: 'warm', icon: '🌤️', label: 'Templado', desc: '20-30°C, agradable' },
  { id: 'mild', icon: '🍂', label: 'Fresco', desc: '10-20°C, otonal' },
  { id: 'cold', icon: '❄️', label: 'Frio', desc: '<10°C, nieve y montanas' },
  { id: 'any', icon: '🌈', label: 'Me da igual', desc: 'Cualquier clima' },
];

const PRIORITY_OPTIONS = [
  { id: 'price', icon: '💰', label: 'Precio', desc: 'Lo mas barato posible' },
  { id: 'experience', icon: '✨', label: 'Experiencia', desc: 'Que sea inolvidable' },
  { id: 'climate', icon: '🌡️', label: 'Clima', desc: 'Buen tiempo garantizado' },
  { id: 'safety', icon: '🛡️', label: 'Seguridad', desc: 'Destinos seguros' },
  { id: 'food', icon: '🍽️', label: 'Gastronomia', desc: 'Descubrir sabores' },
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
  
  // Step 1: Identity
  const [firstName, setFirstName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportCountry, setPassportCountry] = useState('');
  const [showNationalityModal, setShowNationalityModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  
  // Step 2: Airport
  const [homeAirport, setHomeAirport] = useState<any>(null);
  const [showAirportModal, setShowAirportModal] = useState(false);
  
  // Step 3: Languages + Experience
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [travelExperience, setTravelExperience] = useState<string>('');
  
  // Step 4: Companion + Climate + Priority
  const [travelCompanion, setTravelCompanion] = useState<string>('');
  const [climatePref, setClimatePref] = useState<string>('');
  const [topPriority, setTopPriority] = useState<string>('');
  
  // Step 5: Budget
  const [budgetMin, setBudgetMin] = useState(200);
  const [budgetMax, setBudgetMax] = useState(500);
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState(1);
  
  // Step 6: Vibes
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const progress = (step / TOTAL_STEPS) * 100;

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

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS) {
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
        homeCity: homeAirport?.city || '',
        homeAirportIata: homeAirport?.iata || '',
        budgetMin,
        budgetMax,
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
      alert('Error al guardar el perfil. Por favor intenta de nuevo.');
    }
  };

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== code));
    } else {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const toggleVibe = (id: string) => {
    if (selectedVibes.includes(id)) {
      setSelectedVibes(selectedVibes.filter(v => v !== id));
    } else {
      setSelectedVibes([...selectedVibes, id]);
    }
  };

  // ==================== STEP RENDERS ====================
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Quien eres?</Text>
      <Text style={styles.stepSubtitle}>Cuentanos sobre ti</Text>

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
        <TouchableOpacity style={styles.input} onPress={() => setShowNationalityModal(true)}>
          <Text style={nationality ? styles.inputText : styles.placeholderText}>
            {nationality ? NATIONALITIES.find(n => n.code === nationality)?.name : 'Selecciona'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pais del pasaporte</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowPassportModal(true)}>
          <Text style={passportCountry ? styles.inputText : styles.placeholderText}>
            {passportCountry ? NATIONALITIES.find(n => n.code === passportCountry)?.name : 'Selecciona'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Desde donde viajas?</Text>
      <Text style={styles.stepSubtitle}>Tu aeropuerto base</Text>

      <TouchableOpacity style={styles.input} onPress={() => setShowAirportModal(true)}>
        <Text style={homeAirport ? styles.inputText : styles.placeholderText}>
          {homeAirport ? `${homeAirport.city} (${homeAirport.iata})` : 'Selecciona tu aeropuerto'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tu perfil viajero</Text>
      <Text style={styles.stepSubtitle}>Idiomas que hablas</Text>

      <View style={styles.optionGrid}>
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.langChip, selectedLanguages.includes(lang.code) && styles.langChipActive]}
            onPress={() => toggleLanguage(lang.code)}
          >
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text style={[styles.langLabel, selectedLanguages.includes(lang.code) && styles.langLabelActive]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.stepSubtitle, { marginTop: Spacing.lg }]}>Experiencia viajera</Text>
      {EXPERIENCE_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.optionCard, travelExperience === opt.id && styles.optionCardActive]}
          onPress={() => setTravelExperience(opt.id)}
        >
          <Text style={styles.optionIcon}>{opt.icon}</Text>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionLabel, travelExperience === opt.id && styles.optionLabelActive]}>{opt.label}</Text>
            <Text style={styles.optionDesc}>{opt.desc}</Text>
          </View>
          {travelExperience === opt.id && <Ionicons name="checkmark-circle" size={24} color={Colors.coral} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tus preferencias</Text>
      
      <Text style={styles.stepSubtitle}>¿Con quien viajas?</Text>
      <View style={styles.optionRow}>
        {COMPANION_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.squareOption, travelCompanion === opt.id && styles.squareOptionActive]}
            onPress={() => setTravelCompanion(opt.id)}
          >
            <Text style={styles.squareIcon}>{opt.icon}</Text>
            <Text style={[styles.squareLabel, travelCompanion === opt.id && styles.squareLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.stepSubtitle, { marginTop: Spacing.lg }]}>Clima ideal</Text>
      <View style={styles.optionRow}>
        {CLIMATE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.squareOption, climatePref === opt.id && styles.squareOptionActive]}
            onPress={() => setClimatePref(opt.id)}
          >
            <Text style={styles.squareIcon}>{opt.icon}</Text>
            <Text style={[styles.squareLabel, climatePref === opt.id && styles.squareLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.stepSubtitle, { marginTop: Spacing.lg }]}>Prioridad #1</Text>
      <View style={styles.optionRow}>
        {PRIORITY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.squareOption, topPriority === opt.id && styles.squareOptionActive]}
            onPress={() => setTopPriority(opt.id)}
          >
            <Text style={styles.squareIcon}>{opt.icon}</Text>
            <Text style={[styles.squareLabel, topPriority === opt.id && styles.squareLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tu presupuesto</Text>
      <Text style={styles.stepSubtitle}>Por viaje completo (vuelo + alojamiento)</Text>

      <View style={styles.budgetDisplay}>
        <Text style={styles.budgetAmount}>{budgetMin}€ - {budgetMax}€</Text>
        <Text style={styles.budgetHint}>El algoritmo buscara dentro y un poco por encima</Text>
      </View>

      <View style={styles.budgetPresetsGrid}>
        {BUDGET_PRESETS.map((preset, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.budgetPreset, selectedBudgetPreset === idx && styles.budgetPresetActive]}
            onPress={() => {
              setSelectedBudgetPreset(idx);
              setBudgetMin(preset.min);
              setBudgetMax(preset.max);
            }}
          >
            <Text style={styles.budgetPresetIcon}>{preset.icon}</Text>
            <Text style={[styles.budgetPresetLabel, selectedBudgetPreset === idx && styles.budgetPresetLabelActive]}>
              {preset.label}
            </Text>
            <Text style={[styles.budgetPresetRange, selectedBudgetPreset === idx && styles.budgetPresetRangeActive]}>
              {preset.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>¿Que te gusta?</Text>
      <Text style={styles.stepSubtitle}>Selecciona tus vibes (minimo 1)</Text>

      <View style={styles.vibeGrid}>
        {VIBE_OPTIONS.map(vibe => (
          <TouchableOpacity
            key={vibe.id}
            style={[styles.vibeCard, selectedVibes.includes(vibe.id) && styles.vibeCardActive]}
            onPress={() => toggleVibe(vibe.id)}
          >
            <Text style={styles.vibeIcon}>{vibe.icon}</Text>
            <Text style={[styles.vibeLabel, selectedVibes.includes(vibe.id) && styles.vibeLabelActive]}>
              {vibe.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary preview */}
      {selectedVibes.length > 0 && (
        <View style={styles.summaryPreview}>
          <Text style={styles.summaryTitle}>Tu perfil viajero</Text>
          <Text style={styles.summaryText}>
            {travelExperience === 'expert' ? 'Viajero experto' : travelExperience === 'intermediate' ? 'Viajero intermedio' : 'Nuevo viajero'}
            {' · '}
            {travelCompanion === 'solo' ? 'Solo/a' : travelCompanion === 'couple' ? 'En pareja' : travelCompanion === 'friends' ? 'Con amigos' : 'En familia'}
            {' · '}
            {climatePref === 'any' ? 'Cualquier clima' : climatePref === 'hot' ? 'Clima calido' : climatePref === 'warm' ? 'Templado' : climatePref === 'mild' ? 'Fresco' : 'Frio'}
          </Text>
          <Text style={styles.summaryText}>
            Presupuesto: {budgetMin}-{budgetMax}€ · Prioridad: {PRIORITY_OPTIONS.find(p => p.id === topPriority)?.label}
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

  const renderListModal = (
    visible: boolean,
    onClose: () => void,
    data: any[],
    onSelect: (item: any) => void,
    keyField: string,
    labelField: string,
    title: string,
  ) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
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
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navContainer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
        )}
        <Button
          title={step === TOTAL_STEPS ? 'Empezar a viajar' : 'Siguiente'}
          onPress={handleNext}
          disabled={!canProceed()}
          style={step === 1 ? { ...styles.nextBtn, flex: 1 } : styles.nextBtn}
        />
      </View>

      {/* Modals */}
      {renderListModal(showNationalityModal, () => setShowNationalityModal(false), NATIONALITIES, (item: any) => setNationality(item.code), 'code', 'name', 'Nacionalidad')}
      {renderListModal(showPassportModal, () => setShowPassportModal(false), NATIONALITIES, (item: any) => setPassportCountry(item.code), 'code', 'name', 'Pais del pasaporte')}
      {renderListModal(showAirportModal, () => setShowAirportModal(false), POPULAR_AIRPORTS, (item: any) => setHomeAirport(item), 'iata', 'name', 'Aeropuerto')}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.surfaceMid, borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: Colors.coral, borderRadius: 3 },
  progressText: { ...Typography.label, color: Colors.onSurfaceDim, fontSize: 12 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120 },
  stepContent: {},
  stepTitle: { ...Typography.h1, color: Colors.onSurface, fontSize: 28, marginBottom: 4 },
  stepSubtitle: { ...Typography.body, color: Colors.onSurfaceDim, marginBottom: Spacing.lg },
  // Inputs
  inputContainer: { marginBottom: Spacing.md },
  label: { ...Typography.label, color: Colors.onSurfaceDim, marginBottom: 6, fontSize: 12 },
  input: { backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, justifyContent: 'center', minHeight: 50 },
  inputText: { ...Typography.body, color: Colors.onSurface },
  placeholderText: { ...Typography.body, color: Colors.onSurfaceDim },
  // Language chips
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  langChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceHigh, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, gap: 6, borderWidth: 2, borderColor: 'transparent' },
  langChipActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,107,107,0.1)' },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: 13, color: Colors.onSurfaceDim, fontWeight: '500' },
  langLabelActive: { color: Colors.coral, fontWeight: '700' },
  // Option cards (experience)
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 2, borderColor: 'transparent', gap: Spacing.md },
  optionCardActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,107,107,0.08)' },
  optionIcon: { fontSize: 28 },
  optionTextContainer: { flex: 1 },
  optionLabel: { ...Typography.bodySemibold, color: Colors.onSurface, fontSize: 15 },
  optionLabelActive: { color: Colors.coral },
  optionDesc: { fontSize: 12, color: Colors.onSurfaceDim, marginTop: 2 },
  // Square options (companion, climate, priority)
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  squareOption: { width: (width - Spacing.lg * 2 - Spacing.sm * 3) / 4, minWidth: 72, alignItems: 'center', backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, paddingHorizontal: 4, borderWidth: 2, borderColor: 'transparent' },
  squareOptionActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,107,107,0.1)' },
  squareIcon: { fontSize: 24, marginBottom: 4 },
  squareLabel: { fontSize: 11, color: Colors.onSurfaceDim, fontWeight: '600', textAlign: 'center' },
  squareLabelActive: { color: Colors.coral },
  // Budget
  budgetDisplay: { alignItems: 'center', marginBottom: Spacing.xl },
  budgetAmount: { fontSize: 36, fontWeight: '900', color: Colors.coral },
  budgetHint: { fontSize: 12, color: Colors.onSurfaceDim, marginTop: 4 },
  budgetPresetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  budgetPreset: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2, alignItems: 'center', backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, borderWidth: 2, borderColor: 'transparent' },
  budgetPresetActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,107,107,0.1)' },
  budgetPresetIcon: { fontSize: 28, marginBottom: 6 },
  budgetPresetLabel: { ...Typography.bodySemibold, color: Colors.onSurface, fontSize: 14 },
  budgetPresetLabelActive: { color: Colors.coral },
  budgetPresetRange: { fontSize: 13, color: Colors.onSurfaceDim, marginTop: 2 },
  budgetPresetRangeActive: { color: Colors.coral },
  // Vibes
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  vibeCard: { width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3, alignItems: 'center', backgroundColor: Colors.surfaceHigh, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, borderWidth: 2, borderColor: 'transparent' },
  vibeCardActive: { borderColor: Colors.coral, backgroundColor: 'rgba(255,107,107,0.1)' },
  vibeIcon: { fontSize: 36, marginBottom: 6 },
  vibeLabel: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceDim },
  vibeLabelActive: { color: Colors.coral },
  // Summary preview
  summaryPreview: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.xl, borderLeftWidth: 3, borderLeftColor: Colors.coral },
  summaryTitle: { ...Typography.bodySemibold, color: Colors.coral, marginBottom: 4, fontSize: 13 },
  summaryText: { fontSize: 13, color: Colors.onSurfaceDim, lineHeight: 20 },
  // Navigation
  navContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flex: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.surfaceMid },
  modalTitle: { ...Typography.h3, color: Colors.onSurface },
  modalItem: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.surfaceMid },
  modalItemText: { ...Typography.body, color: Colors.onSurface },
});
