import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../src/store/userStore';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const VIBE_LABELS: Record<string, string> = {
  culture: 'Cultura', nature: 'Naturaleza', party: 'Fiesta',
  relax: 'Relax', adventure: 'Aventura', gastronomy: 'Gastronomia',
};

const COMPANION_LABELS: Record<string, string> = {
  solo: 'Solo/a', couple: 'En pareja', friends: 'Con amigos', family: 'En familia',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Nuevo viajero', intermediate: 'Con experiencia', expert: 'Viajero experto',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useUserStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesion',
      '¿Estas seguro de que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesion',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Proximamente', 'La edicion de perfil estara disponible pronto');
  };

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={18} color={Colors.coral} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const SettingRow = ({ icon, label, value, onPress }: { icon: string; label: string; value?: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon as any} size={20} color={Colors.onSurfaceDim} />
      <Text style={styles.settingLabel}>{label}</Text>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={Colors.onSurfaceDim + '60'} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          <LinearGradient
            colors={['rgba(255,77,77,0.15)', 'rgba(255,77,77,0.03)', 'transparent']}
            style={styles.headerGradient}
          />
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.firstName || 'Usuario'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* Quick Tag */}
          {user?.travelExperience && (
            <View style={styles.experienceTag}>
              <Ionicons name="star" size={12} color={Colors.coral} />
              <Text style={styles.experienceTagText}>
                {EXPERIENCE_LABELS[user.travelExperience] || user.travelExperience}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile} activeOpacity={0.7}>
            <Ionicons name="pencil" size={14} color={Colors.coral} />
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="bookmark" size={20} color={Colors.coral} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Guardados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="airplane" size={20} color={Colors.teal} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Reservados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="earth" size={20} color={Colors.sand} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Paises</Text>
          </View>
        </View>

        {/* Travel Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias de viaje</Text>
          <View style={styles.sectionCard}>
            <InfoRow
              icon="airplane"
              label="Aeropuerto base"
              value={user?.homeCity ? `${user.homeCity} (${user.homeAirportIata})` : 'No configurado'}
            />
            <InfoRow
              icon="wallet-outline"
              label="Presupuesto"
              value={`${user?.budgetMin || 0}€ — ${user?.budgetMax || 0}€`}
            />
            <InfoRow
              icon="people-outline"
              label="Compania"
              value={user?.travelCompanion ? (COMPANION_LABELS[user.travelCompanion] || user.travelCompanion) : 'No configurado'}
            />
          </View>
        </View>

        {/* Vibes */}
        {user?.travelStyle && user.travelStyle.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tus vibes</Text>
            <View style={styles.vibesWrap}>
              {user.travelStyle.map((v: string) => (
                <View key={v} style={styles.vibePill}>
                  <Text style={styles.vibePillText}>{VIBE_LABELS[v] || v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuracion</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="notifications-outline" label="Notificaciones" />
            <SettingRow icon="globe-outline" label="Idioma" value="Espanol" />
            <SettingRow icon="card-outline" label="Moneda" value="EUR" />
            <SettingRow icon="shield-checkmark-outline" label="Privacidad" />
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={Colors.coral} />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.5}>
          <Text style={styles.deleteText}>Eliminar cuenta</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Header Card
  headerCard: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 14,
    color: Colors.onSurfaceDim,
    marginTop: 4,
  },
  experienceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,77,77,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  experienceTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.coral,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceMid,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coral,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.surfaceMid,
  },

  // Sections
  section: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,77,77,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: Colors.onSurfaceDim,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '600',
    marginTop: 2,
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
    gap: Spacing.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: Colors.onSurfaceDim,
  },

  // Vibes
  vibesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibePill: {
    backgroundColor: 'rgba(255,77,77,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  vibePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.coral,
  },

  // Actions
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.coral,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  deleteText: {
    fontSize: 13,
    color: Colors.onSurfaceDim,
  },
});
