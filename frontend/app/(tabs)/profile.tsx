import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/userStore';
import { Card } from '../../src/components/Card';
import { Colors, Spacing, BorderRadius, Typography } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useUserStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
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
    Alert.alert('Próximamente', 'La edición de perfil estará disponible pronto');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.firstName || 'Usuario'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Viajes guardados</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Viajes reservados</Text>
          </Card>
        </View>

        {/* Travel Preferences */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias de viaje</Text>
          
          <View style={styles.preferenceRow}>
            <Ionicons name="airplane" size={20} color={Colors.coral} />
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceLabel}>Aeropuerto base</Text>
              <Text style={styles.preferenceValue}>
                {user?.homeCity || 'No configurado'} ({user?.homeAirportIata || '-'})
              </Text>
            </View>
          </View>

          <View style={styles.preferenceRow}>
            <Ionicons name="cash" size={20} color={Colors.coral} />
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceLabel}>Presupuesto</Text>
              <Text style={styles.preferenceValue}>
                {user?.budgetMin}€ - {user?.budgetMax}€
              </Text>
            </View>
          </View>

          <View style={styles.preferenceRow}>
            <Ionicons name="heart" size={20} color={Colors.coral} />
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceLabel}>Estilos de viaje</Text>
              <Text style={styles.preferenceValue}>
                {user?.travelStyle?.join(', ') || 'No configurado'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={24} color={Colors.onSurface} />
            <Text style={styles.settingText}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.onSurfaceDim} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="globe-outline" size={24} color={Colors.onSurface} />
            <Text style={styles.settingText}>Idioma</Text>
            <Text style={styles.settingValue}>Español</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="card-outline" size={24} color={Colors.onSurface} />
            <Text style={styles.settingText}>Moneda</Text>
            <Text style={styles.settingValue}>EUR (€)</Text>
          </TouchableOpacity>
        </Card>

        {/* Danger Zone */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.coral} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteText}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    ...Typography.h1,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  email: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginBottom: Spacing.md,
  },
  editButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
  },
  editButtonText: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statValue: {
    ...Typography.h1,
    color: Colors.coral,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  preferenceContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  preferenceLabel: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
  },
  preferenceValue: {
    ...Typography.bodySemibold,
    color: Colors.onSurface,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  settingText: {
    ...Typography.body,
    color: Colors.onSurface,
    flex: 1,
    marginLeft: Spacing.md,
  },
  settingValue: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    marginRight: Spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  logoutText: {
    ...Typography.bodySemibold,
    color: Colors.coral,
    marginLeft: Spacing.sm,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  deleteText: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
    fontSize: 14,
  },
});