import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { useUserStore } from '../src/store/userStore';
import { supabase } from '../src/services/supabase';
import { Colors, Spacing, BorderRadius, Typography } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // The profile will be automatically created by the trigger
        // Set minimal user data and redirect to onboarding
        const userData = {
          id: data.user.id,
          email: data.user.email || '',
          firstName: '',
          nationality: '',
          passportCountry: '',
          homeAirportIata: '',
          homeCity: '',
          budgetMin: 50,
          budgetMax: 500,
          travelStyle: [],
          travelsAlone: false,
          onboardingComplete: false,
        };

        setUser(userData);
        setLoading(false);
        router.replace('/onboarding');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear la cuenta');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Comienza tu aventura con Wander</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={Colors.onSurfaceDim}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.onSurfaceDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor={Colors.onSurfaceDim}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>

            <Button
              title="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.h1,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.onSurfaceDim,
  },
  form: {
    flex: 1,
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
    color: Colors.onSurface,
    fontSize: 16,
  },
  registerButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  loginText: {
    color: Colors.onSurfaceDim,
  },
  loginLink: {
    color: Colors.coral,
    fontWeight: '600',
  },
});